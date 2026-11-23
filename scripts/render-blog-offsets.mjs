// Usage: node scripts/render-blog-offsets.mjs
// Generates stills from Offsets 1 (1e9048cd-ad7e-4452-807b-64dbc06dfe07).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import config from '../src/app/blog-art-playground/offsets.json' with { type: 'json' };

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public/assets/blog/offsets');
const css = await fs.readFile(path.join(root, 'src/styles/tokens.css'), 'utf8');
const swatches = new Map(Array.from(css.matchAll(/--palette-([\w-]+):\s*(#[\da-f]{6});/gi), match => [match[1], match[2]]));
const palettes = config.palettes.map(palette => {
  assert(palette.gradient.every(token => palette.tokens.includes(token)));
  assert(palette.tokens.every(token => swatches.has(token)));
  return { id: palette.id, colors: palette.tokens.map(token => swatches.get(token)), gradient: palette.gradient.map(token => swatches.get(token)) };
});

const corePath = fileURLToPath(import.meta.resolve('shaders/core'));
const moduleRoot = path.dirname(corePath);
const origin = 'http://localhost:3219';
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-webgpu'] });

function indexArt(data, colors, width) {
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const rgb = colors.map(hex => Buffer.from(hex.slice(1), 'hex'));
  const pairs = rgb.flatMap((from, i) => rgb.slice(i + 1).map(to => {
    const direction = Array.from(from, (value, channel) => to[channel] - value);
    return { from, to, direction, length: direction.reduce((sum, value) => sum + value ** 2, 0) };
  }));
  const cache = new Map();

  for (let offset = 0, pixel = 0; offset < data.length; offset += 3, pixel++) {
    const red = data[offset] >> 3;
    const green = data[offset + 1] >> 3;
    const blue = data[offset + 2] >> 3;
    const key = (red << 10) | (green << 5) | blue;
    let nearest = cache.get(key);
    if (!nearest) {
      const target = [red * 8 + 4, green * 8 + 4, blue * 8 + 4];
      let bestDistance = Infinity;
      for (const pair of pairs) {
        const offset = target.map((sample, channel) => sample - pair.from[channel]);
        const mix = Math.max(0, Math.min(1, offset.reduce((sum, value, channel) => sum + value * pair.direction[channel], 0) / pair.length));
        const distance = offset.reduce((sum, value, channel) => sum + (value - pair.direction[channel] * mix) ** 2, 0) + pair.length * .007;
        if (distance < bestDistance) {
          nearest = { from: pair.from, to: pair.to, mix };
          bestDistance = distance;
        }
      }
      cache.set(key, nearest);
    }
    const threshold = bayer[((Math.floor(pixel / width) & 3) << 2) + ((pixel % width) & 3)];
    const color = nearest.mix * 16 > threshold + .5 ? nearest.to : nearest.from;
    data.set(color, offset);
  }
}

try {
  const page = await browser.newPage({ viewport: { width: config.width, height: config.height }, deviceScaleFactor: 1 });
  // The browser loads the installed ESM directly, without a bundler to inline this flag.
  await page.addInitScript(() => { globalThis.process = { env: { NODE_ENV: 'production' } }; });
  await page.route(`${origin}/**`, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Render Offsets</title>' });
    const file = path.join(moduleRoot, url.pathname);
    if (!file.startsWith(moduleRoot + path.sep) || !file.endsWith('.js')) return route.abort();
    return route.fulfill({ contentType: 'text/javascript', path: file });
  });
  await page.goto(origin);
  const frames = await page.evaluate(async ({ width, height, variants }) => {
    const { shaderRendererGPU, rootPassthrough, createGpuUniformsMap } = await import('/index.js');
    const { default: FlowingGradient } = await import('/shaders/FlowingGradient/index.js');
    const { default: BarShift } = await import('/shaders/BarShift/index.js');
    const { default: GridDistortion } = await import('/shaders/GridDistortion/index.js');
    const { default: BlueNoise } = await import('/shaders/BlueNoise/index.js');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const snapshot = document.createElement('canvas');
    snapshot.width = width;
    snapshot.height = height;
    const context = snapshot.getContext('2d', { alpha: false });
    const renderer = shaderRendererGPU();
    try {
      renderer.setFrameLocked(true);
      await renderer.initialize({ canvas, toneMapping: 'neutral', observeElement: false });
      if (!renderer.isInitialized()) throw new Error('WebGPU is required to render the Offsets stills.');
      renderer.beginRecordingResolution(width, height, 1);
      renderer.registerNode('root', rootPassthrough.fragment, null, null, {}, rootPassthrough);
      const layers = [
        { definition: FlowingGradient, props: { colorSpace: 'oklab', distortion: 0, speed: 3.5 } },
        { definition: BarShift, props: {} },
        { definition: GridDistortion, props: { decay: 8.3, gridSize: 6, intensity: 1.5, radius: 3 } },
        { definition: BlueNoise, props: {}, blendMode: 'overlay', opacity: .25 },
      ];
      layers.forEach(({ definition, props, blendMode = 'normal', opacity = 1 }, renderOrder) => {
        const defaults = Object.fromEntries(Object.entries(definition.props).map(([key, prop]) => [key, prop.default]));
        const uniforms = createGpuUniformsMap(definition, { ...defaults, ...props }, definition.name);
        renderer.registerNode(definition.name, definition.fragment, 'root', { blendMode, opacity, renderOrder }, uniforms, definition);
      });

      const frames = [];
      for (const { colors, gradient } of variants) {
        ['colorA', 'colorB', 'colorC', 'colorD'].forEach((prop, index) => renderer.updateUniformValue('FlowingGradient', prop, gradient[index]));
        renderer.updateUniformValue('BlueNoise', 'stops', [
          { color: colors.at(-1), position: 0 }, { color: colors[0], position: 1 },
        ]);
        // Every palette uses the same single point on the preset's timeline.
        await renderer.renderSyntheticFrame(frames.length ? 0 : .65);
        await renderer.renderSyntheticFrame(0, { waitForGpu: false });
        context.drawImage(canvas, 0, 0);
        frames.push(snapshot.toDataURL('image/png').split(',')[1]);
      }
      return frames;
    } finally {
      renderer.cleanup();
    }
  }, { ...config, variants: palettes });

  await fs.mkdir(output, { recursive: true });
  for (const [index, frame] of frames.entries()) {
    const { id, colors } = palettes[index];
    const { data, info } = await sharp(Buffer.from(frame, 'base64')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [config.width, config.height]);
    assert(new Set(data).size > 40, `Unexpectedly flat Offsets render for ${id}`);
    indexArt(data, colors, info.width);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(output, `${id}.png`));
    console.log(`Rendered ${id}`);
  }
} finally {
  await browser.close();
}
