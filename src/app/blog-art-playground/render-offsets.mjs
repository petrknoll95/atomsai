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
    coverSpan: { default: 1 },
  },
  effect: wgsl`
    let columns = 6.0;
    let rows = 4.0;
    let coverY = (uv.y - 0.5) / coverSpan + 0.5;
    let row = u32(clamp(floor(coverY * rows), 0.0, rows - 1.0));
    let cell = uv.x * columns;
    let column = floor(cell);
    let anchors = vec2f(column, column + 1.0);

    // Hash the adjacent grid anchors independently for each seed and row.
    var hash = vec2u(u32(gridSeed) * 747796405u + row * 2891336453u);
    hash += vec2u(anchors) * 277803737u;
    hash = (hash ^ (hash >> vec2u(16u))) * 2246822519u;
    hash = hash ^ (hash >> vec2u(13u));
    let offsets = (vec2f(hash & vec2u(65535u)) / 65535.0 * 2.0 - 1.0) * 0.052;

    // Fix both edges. Interpolation keeps each row in bounds and preserves every bar.
    let interior = select(offsets, vec2f(0.0), anchors <= vec2f(0.0));
    let anchored = select(interior, vec2f(0.0), anchors >= vec2f(columns));
    let offset = mix(anchored.x, anchored.y, fract(cell));
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
      renderer.updateUniformValue(offsetBars.name, 'count', offsetCount(seed));
      renderer.updateUniformValue(horizontalOffsets.name, 'gridSeed', seed);
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
