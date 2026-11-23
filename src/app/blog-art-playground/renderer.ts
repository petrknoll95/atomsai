import { createGpuUniformsMap, rootPassthrough, shaderRendererGPU } from 'shaders/core';
import compressionArtifacts from 'shaders/core/CompressionArtifacts';
import halftone from 'shaders/core/Halftone';
import sunBurst from 'shaders/core/SunBurst';
import { height, palettes, width, type Settings } from './settings';

const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
type RGB = [number, number, number];

function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function readSwatches(tokens: readonly string[], styles: CSSStyleDeclaration) {
  return tokens.map(token => {
    const hex = styles.getPropertyValue(`--palette-${token}`).trim();
    if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error('An AtomsAI color token is missing.');
    return hex;
  });
}

function buildColorTable(swatches: string[]) {
  const colors: RGB[] = swatches.map(hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) as RGB);
  // Use ordered dithering between adjacent brand swatches to retain fine tonal detail.
  return bayer.map(threshold => Array.from({ length: 256 }, (_, luma) => {
    const position = luma / 255 * (colors.length - 1);
    const lower = Math.floor(position);
    return colors[lower + Number(position - lower > (threshold + .5) / 16)];
  }));
}

async function createSunflower() {
  const canvas = makeCanvas();
  const gpu = shaderRendererGPU();
  let unavailable = false;
  gpu.setOnUnavailable(() => { unavailable = true; });
  gpu.setFrameLocked(true);

  try {
    await gpu.initialize({ canvas, colorSpace: 'srgb', observeElement: false });
    if (unavailable || !gpu.isInitialized()) {
      gpu.cleanup();
      return null;
    }
    gpu.beginRecordingResolution(width, height, 1);
    const rootId = 'sunflower-root';
    gpu.registerNode(rootId, rootPassthrough.fragment, null, null, {}, rootPassthrough);

    // Compressed Sunflower, using the three layers and order from its Shaders MCP export.
    const layers = [
      { definition: sunBurst, props: { center: { x: .5, y: 1 }, radius: 1.15, rayCount: 18, softness: .4, speed: 0 } },
      { definition: compressionArtifacts, props: { quality: 1 } },
      { definition: halftone, props: { style: 'cmyk', frequency: 148, cyanAngle: 0, magentaAngle: 0 } },
    ];
    layers.forEach(({ definition, props }, renderOrder) => {
      const { name } = definition;
      const defaults = Object.fromEntries(Object.entries(definition.props).map(([key, prop]) => [key, prop.default]));
      const bridgeDefinition = definition as Parameters<typeof createGpuUniformsMap>[0];
      const uniforms = createGpuUniformsMap(bridgeDefinition, { ...defaults, ...props }, name);
      gpu.registerNode(name, definition.fragment, rootId, { blendMode: 'normal', opacity: 1, renderOrder }, uniforms, definition);
    });
  } catch (error) {
    gpu.cleanup();
    if (unavailable) return null;
    throw error;
  }

  let lastFrame = '';
  // Store the rendered pixels independently of the WebGPU canvas's presentation lifetime.
  const snapshot = makeCanvas();
  const snapshotContext = snapshot.getContext('2d')!;
  return {
    async frame(settings: Settings, swatches: string[]) {
      if (unavailable) return null;
      const key = [settings.palette, settings.burstX, settings.burstY, settings.frequency, settings.quality].join(':');
      if (key === lastFrame) return snapshot;

      const paper = swatches[swatches.length - 1];
      const tint = swatches[swatches.length - 2];
      const ink = swatches[0];
      const mid = swatches[Math.floor((swatches.length - 1) / 2)];
      gpu.updateUniformValue('SunBurst', 'center', { x: settings.burstX / 100, y: settings.burstY / 100 });
      gpu.updateUniformValue('SunBurst', 'color', mid);
      gpu.updateUniformValue('SunBurst', 'background', tint);
      gpu.updateUniformValue('CompressionArtifacts', 'quality', settings.quality);
      gpu.updateUniformValue('Halftone', 'frequency', settings.frequency);
      gpu.updateUniformValue('Halftone', 'paperColor', paper);
      gpu.updateUniformValue('Halftone', 'cyanColor', mid);
      gpu.updateUniformValue('Halftone', 'magentaColor', tint);
      gpu.updateUniformValue('Halftone', 'yellowColor', paper);
      gpu.updateUniformValue('Halftone', 'blackColor', ink);
      // Prime the compression input with the current uniforms before capturing a still.
      await gpu.renderSyntheticFrame(0);
      // Read the submitted canvas before presentation. Canvas2D synchronizes the copy.
      await gpu.renderSyntheticFrame(0, { waitForGpu: false });
      if (unavailable) return null;
      snapshotContext.clearRect(0, 0, width, height);
      snapshotContext.drawImage(canvas, 0, 0);
      lastFrame = key;
      return snapshot;
    },
    dispose: gpu.cleanup,
  };
}

export async function createCoverRenderer() {
  const styles = getComputedStyle(document.documentElement);
  const swatches = palettes.map(({ tokens }) => readSwatches(tokens, styles));
  const tables = swatches.map(buildColorTable);
  const canvas = makeCanvas();
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  const imageLayer = makeCanvas();
  const imageContext = imageLayer.getContext('2d', { alpha: false });
  if (!context || !imageContext) throw new Error('The preview canvas could not be opened.');
  const sunflower = await createSunflower();
  let lastImage: HTMLImageElement | undefined;
  let lastCrop = '';

  return {
    async render(image: HTMLImageElement, settings: Settings) {
      const colors = swatches[settings.palette];
      const shader = settings.opacity && sunflower ? await sunflower.frame(settings, colors) : null;
      const crop = [settings.zoom, settings.imageX, settings.imageY, colors[0]].join(':');
      if (lastImage !== image || lastCrop !== crop) {
        imageContext.fillStyle = colors[0];
        imageContext.fillRect(0, 0, width, height);
        imageContext.imageSmoothingQuality = 'high';
        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * settings.zoom / 100;
        const imageWidth = image.naturalWidth * scale;
        const imageHeight = image.naturalHeight * scale;
        imageContext.drawImage(image,
          (width - imageWidth) * settings.imageX / 100,
          (height - imageHeight) * settings.imageY / 100,
          imageWidth, imageHeight);
        lastImage = image;
        lastCrop = crop;
      }
      context.drawImage(imageLayer, 0, 0);

      if (shader) {
        context.globalAlpha = settings.opacity / 100;
        context.drawImage(shader, 0, 0);
        context.globalAlpha = 1;
      }

      const frame = context.getImageData(0, 0, width, height);
      const table = tables[settings.palette];
      const data = frame.data;
      for (let y = 0; y < height; y++) {
        const row = (y & 3) * 4;
        for (let x = 0, offset = y * width * 4; x < width; x++, offset += 4) {
          const luma = (54 * data[offset] + 183 * data[offset + 1] + 19 * data[offset + 2]) >> 8;
          const color = table[row + (x & 3)][luma];
          data[offset] = color[0];
          data[offset + 1] = color[1];
          data[offset + 2] = color[2];
        }
      }
      context.putImageData(frame, 0, 0);
      return { canvas, shaderAvailable: Boolean(sunflower && (!settings.opacity || shader)) };
    },
    dispose() { sunflower?.dispose(); },
  };
}
