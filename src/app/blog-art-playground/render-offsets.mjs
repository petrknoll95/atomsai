import { createGpuUniformsMap, rootPassthrough, shaderRendererGPU } from 'shaders/core';
import barShift from 'shaders/core/BarShift';
import blueNoise from 'shaders/core/BlueNoise';
import simplexNoise from 'shaders/core/SimplexNoise';
import { defineShader, math, p, uniformOf, warps, wgsl } from 'shaders/std';
import { offsetCount } from './seed.mjs';

const shiftIntensity = 0.15;
const noiseScale = 0.75;
const getBarMap = warps.barOffset({ count: p('count'), angle: 0, intensity: p('intensity'), seed: p('seed') });
const offsetBars = defineShader({
  name: 'CoverOffsets',
  props: barShift.props,
  animatedTime: { speed: 'speed' },
  map: params => {
    const bars = getBarMap(params);
    const count = uniformOf(p('count'), params);
    // Align odd counts to the left edge so the cover contains only full-width bars.
    const phase = math.sub(0.5, math.div(math.floor(math.mul(count, 0.5)), count));
    return {
      map: (uv, aspect) => {
        const shifted = bars.map(math.add(uv, math.vec2(phase, 0)), aspect);
        return math.vec2(uv.member('x'), shifted.member('y'));
      },
    };
  },
});

const horizontalOffsets = defineShader({
  name: 'HorizontalOffsets',
  props: {
    gridSeed: { default: 0 },
    barCount: { default: 6 },
    coverSpan: { default: 1 },
  },
  effect: wgsl`
    let seed = u32(gridSeed);
    let rowPosition = ((uv.y - 0.5) / coverSpan + 0.5) * 4.0;
    let row = u32(clamp(floor(rowPosition), 0.0, 3.0));
    let rowY = rowPosition - f32(row);
    let layoutHash = seed * 747796405u + 2891336453u;
    let rowOrder = (row + (layoutHash >> 16u)) % 4u;
    let patchRank = (rowOrder % 2u) * 2u + rowOrder / 2u;
    let patchCount = 2u + seed % 3u;

    var hash = layoutHash + (row + 1u) * 277803737u;
    hash = (hash ^ (hash >> 16u)) * 2246822519u;
    hash = hash ^ (hash >> 13u);
    let startY = 0.07 + f32((hash >> 8u) & 255u) / 255.0 * 0.18;
    let inPatch = patchRank < patchCount && rowY >= startY && rowY < startY + 0.58;

    // Displace one nearby seam locally and blend back to the original field on either side.
    let seam = f32(1u + hash % (u32(barCount) - 1u)) / barCount;
    let weight = 1.0 - smoothstep(0.0, 0.42 / barCount, abs(uv.x - seam));
    let direction = select(-1.0, 1.0, (hash & 256u) != 0u);
    let amplitude = 0.015 + f32((hash >> 24u) & 255u) / 255.0 * 0.005;
    let offset = select(0.0, direction * amplitude * weight, inPatch);
    return textureSample(childTexture, childSampler, vec2f(uv.x + offset, uv.y));
  `,
});

/** @param {{ width: number, height: number }} dimensions */
export async function createOffsetsRenderer({ width, height }) {
  if (!navigator.gpu) return null;

  // Render beyond the crop so vertical bar shifts always sample real noise.
  const padding = Math.ceil(shiftIntensity * height) + 2;
  const renderHeight = height + 2 * padding;
  const heightRatio = renderHeight / height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = renderHeight;
  const snapshot = document.createElement('canvas');
  snapshot.width = width;
  snapshot.height = height;
  const context = snapshot.getContext('2d', { alpha: false });
  if (!context) throw new Error('The export canvas could not be opened.');

  const renderer = shaderRendererGPU();

  try {
    renderer.setFrameLocked(true);
    await renderer.initialize({ canvas, toneMapping: 'neutral', observeElement: false });
    if (!renderer.isInitialized()) {
      renderer.cleanup();
      return null;
    }
    renderer.beginRecordingResolution(width, renderHeight, 1);
    renderer.registerNode('root', rootPassthrough.fragment, null, null, {}, rootPassthrough);

    // Seeded simplex noise supplies the gradient. The remaining layers retain the Offsets treatment.
    const layers = [
      { definition: simplexNoise, props: { colorSpace: 'oklab', scale: noiseScale + Math.log(heightRatio), contrast: -.18, speed: 0 } },
      { definition: offsetBars, props: { intensity: shiftIntensity / heightRatio, edges: 'stretch' } },
      { definition: horizontalOffsets, props: { coverSpan: 1 / heightRatio } },
      { definition: blueNoise, props: {}, blendMode: 'overlay', opacity: .12 },
    ];
    layers.forEach(({ definition, props, blendMode = 'normal', opacity = 1 }, renderOrder) => {
      const defaults = Object.fromEntries(Object.entries(definition.props).map(([key, prop]) => [key, prop.default]));
      const uniforms = createGpuUniformsMap(definition, { ...defaults, ...props }, definition.name);
      renderer.registerNode(definition.name, definition.fragment, 'root', { blendMode, opacity, renderOrder }, uniforms, definition);
    });
  } catch (error) {
    renderer.cleanup();
    throw error;
  }

  return {
    /** @param {number} seed @param {string[]} colors */
    async render(seed, colors) {
      renderer.updateUniformValue('SimplexNoise', 'seed', seed);
      renderer.updateUniformValue('SimplexNoise', 'stops', colors.map((color, index) => ({
        color, position: index / (colors.length - 1),
      })));
      const count = offsetCount(seed);
      renderer.updateUniformValue(offsetBars.name, 'count', count);
      renderer.updateUniformValue(horizontalOffsets.name, 'gridSeed', seed);
      renderer.updateUniformValue(horizontalOffsets.name, 'barCount', count);
      renderer.updateUniformValue('BlueNoise', 'stops', [
        { color: colors[colors.length - 1], position: 0 }, { color: colors[0], position: 1 },
      ]);

      await renderer.renderSyntheticFrame(0);
      await renderer.renderSyntheticFrame(0, { waitForGpu: false });
      if (renderer.getFailureReason()) throw new Error('The Offsets still could not be rendered.');
      context.drawImage(canvas, 0, -padding);
      return snapshot;
    },
    dispose: renderer.cleanup,
  };
}
