// Usage: node scripts/render-blog-offsets.mjs
// Bake the default seed for browsers that cannot generate new stills with WebGPU.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import config from '../src/app/blog-art-playground/offsets.json' with { type: 'json' };

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public/assets/blog/offsets');
const source = path.join(root, 'src/app/blog-art-playground');
const css = await fs.readFile(path.join(root, 'src/styles/tokens.css'), 'utf8');
const swatches = new Map(Array.from(css.matchAll(/--palette-([\w-]+):\s*(#[\da-f]{6});/gi), match => [match[1], match[2]]));
const palettes = config.palettes.map(palette => {
  assert(palette.tokens.every(token => swatches.has(token)));
  return { id: palette.id, colors: palette.tokens.map(token => swatches.get(token)) };
});

const shaderModules = ['shaders/core', 'shaders/core/BarShift', 'shaders/core/BlueNoise', 'shaders/core/SimplexNoise', 'shaders/std'];
const moduleRoot = path.dirname(fileURLToPath(import.meta.resolve('shaders/core')));
const imports = Object.fromEntries(shaderModules.map(specifier => [specifier, '/shaders/' + path.relative(moduleRoot, fileURLToPath(import.meta.resolve(specifier)))]));
const origin = 'http://localhost:3219';
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-webgpu'] });

try {
  const page = await browser.newPage({ viewport: { width: config.width, height: config.height }, deviceScaleFactor: 1 });
  // The browser loads the installed ESM directly, without a bundler to inline this flag.
  await page.addInitScript(() => { globalThis.process = { env: { NODE_ENV: 'production' } }; });
  await page.route(`${origin}/**`, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/') {
      return route.fulfill({ contentType: 'text/html', body: `<!doctype html><title>Render Offsets</title><script type="importmap">${JSON.stringify({ imports })}</script>` });
    }
    if (url.pathname === '/render-offsets.mjs' || url.pathname === '/seed.mjs') {
      return route.fulfill({ contentType: 'text/javascript', path: path.join(source, url.pathname) });
    }
    const file = path.join(moduleRoot, url.pathname.slice('/shaders/'.length));
    if (!url.pathname.startsWith('/shaders/') || !file.startsWith(moduleRoot + path.sep) || !file.endsWith('.js')) return route.abort();
    return route.fulfill({ contentType: 'text/javascript', path: file });
  });
  await page.goto(origin);
  const frames = await page.evaluate(async ({ width, height, defaultSeed, palettes }) => {
    const { createOffsetsRenderer } = await import('/render-offsets.mjs');
    const renderer = await createOffsetsRenderer({ width, height });
    if (!renderer) throw new Error('WebGPU is required to render the Offsets stills.');
    try {
      const frames = [];
      for (const { colors } of palettes) {
        const canvas = await renderer.render(defaultSeed, colors);
        frames.push(canvas.toDataURL('image/png').split(',')[1]);
      }
      return frames;
    } finally {
      renderer.dispose();
    }
  }, { ...config, palettes });

  await fs.mkdir(output, { recursive: true });
  for (const [index, frame] of frames.entries()) {
    const { id } = palettes[index];
    const { data, info } = await sharp(Buffer.from(frame, 'base64')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [config.width, config.height]);
    assert(new Set(data).size > 40, `Unexpectedly flat Offsets render for ${id}`);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(output, `${id}.png`));
    console.log(`Rendered ${id}`);
  }
} finally {
  await browser.close();
}
