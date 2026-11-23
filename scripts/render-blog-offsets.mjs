// Usage: node scripts/render-blog-offsets.mjs [--articles]
// Bake the playground defaults, or regenerate the published article covers.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import config from '../src/app/blog-art-playground/offsets.json' with { type: 'json' };
import posts from '../src/content/blog/posts.json' with { type: 'json' };

const root = fileURLToPath(new URL('../', import.meta.url));
const articles = process.argv.includes('--articles');
const output = path.join(root, 'public/assets/blog/offsets', articles ? 'articles' : '');
const source = path.join(root, 'src/app/blog-art-playground');
const css = await fs.readFile(path.join(root, 'src/styles/tokens.css'), 'utf8');
const swatches = new Map(Array.from(css.matchAll(/--palette-([\w-]+):\s*(#[\da-f]{6});/gi), match => [match[1], match[2]]));
const palettes = config.palettes.map(palette => {
  assert(palette.tokens.every(token => swatches.has(token)));
  return { id: palette.id, colors: palette.tokens.map(token => swatches.get(token)) };
});
const articleLayouts = {
  'quotes-go-quiet': ['forest-sage', 9],
  'no-shows': ['iris-cream', 56],
  'speed-to-lead': ['orange-cream', 23],
  'who-answers-at-7pm': ['deep-iris', 14],
  'the-demo-was-never-the-hard-part': ['forest-sage', 4],
  'write-the-evals-before-the-prompt': ['orange-cream', 101],
  'how-much-autonomy-should-an-agent-have': ['deep-iris', 121],
};
// Bias lighter ramps toward their dark stops to keep the white titles readable.
const articleBalance = { 'iris-cream': 0.56, 'orange-cream': 0.75 };
const jobs = articles ? posts.map(({ slug, title }) => {
  assert(Object.hasOwn(articleLayouts, slug), `Missing Offsets layout for ${slug}`);
  const [paletteId, seed] = articleLayouts[slug];
  const palette = palettes.find(({ id }) => id === paletteId);
  assert(palette, `Unknown Offsets palette for ${slug}`);
  return { id: slug, title, seed, colors: palette.colors, balance: articleBalance[paletteId] };
}) : palettes.map(palette => ({ ...palette, seed: config.defaultSeed }));

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
      return route.fulfill({ contentType: 'text/html', body: `<!doctype html><title>Render Offsets</title><style>@font-face { font-family: 'Founders Grotesk'; src: url('/cover-font.woff2'); font-weight: 400; }</style><script type="importmap">${JSON.stringify({ imports })}</script>` });
    }
    if (url.pathname === '/cover-font.woff2') {
      return route.fulfill({ contentType: 'font/woff2', path: path.join(root, 'public/fonts/FoundersGrotesk-Regular.woff2') });
    }
    if (['/render-offsets.mjs', '/seed.mjs', '/cover-text.mjs'].includes(url.pathname)) {
      return route.fulfill({ contentType: 'text/javascript', path: path.join(source, url.pathname) });
    }
    const file = path.join(moduleRoot, url.pathname.slice('/shaders/'.length));
    if (!url.pathname.startsWith('/shaders/') || !file.startsWith(moduleRoot + path.sep) || !file.endsWith('.js')) return route.abort();
    return route.fulfill({ contentType: 'text/javascript', path: file });
  });
  await page.goto(origin);
  const frames = await page.evaluate(async ({ width, height, jobs }) => {
    const { createOffsetsRenderer } = await import('/render-offsets.mjs');
    const { drawCoverText, loadCoverFont } = await import('/cover-text.mjs');
    const renderer = await createOffsetsRenderer({ width, height });
    if (!renderer) throw new Error('WebGPU is required to render the Offsets stills.');
    try {
      const frames = [];
      for (const { colors, seed, title, balance } of jobs) {
        const canvas = await renderer.render(seed, colors, balance);
        if (title) {
          const fonts = await loadCoverFont(title);
          if (!fonts.length) throw new Error('Founders Grotesk did not load.');
          drawCoverText(canvas.getContext('2d'), title);
        }
        frames.push(canvas.toDataURL('image/png').split(',')[1]);
      }
      return frames;
    } finally {
      renderer.dispose();
    }
  }, { width: config.width, height: config.height, jobs });

  await fs.mkdir(output, { recursive: true });
  for (const [index, frame] of frames.entries()) {
    const { id } = jobs[index];
    const { data, info } = await sharp(Buffer.from(frame, 'base64')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [config.width, config.height]);
    assert(new Set(data).size > 40, `Unexpectedly flat Offsets render for ${id}`);
    const image = sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } });
    if (articles) {
      await image.webp({ quality: 92 }).toFile(path.join(output, `${id}.webp`));
    } else {
      await image.png({ compressionLevel: 9 }).toFile(path.join(output, `${id}.png`));
    }
    console.log(`Rendered ${id}`);
  }
} finally {
  await browser.close();
}
