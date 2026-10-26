import { chromium, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const root = path.resolve('docs/patterns');
const manifest = JSON.parse(await fs.readFile(`${root}/reference/manifest.json`, 'utf8'));
const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const engines = (process.env.PATTERN_ENGINES || 'chromium,webkit').split(',');
const report = { date: new Date().toISOString(), base, frame: { width: 800, height: 800, deviceScaleFactor: 1 }, method: 'Original origin, no alignment adjustment or blur. Both images converted to sRGB. Overlay 50%; absolute difference amplified 8×.', results: [], errors: [] };
await fs.mkdir(`${root}/rendered`, { recursive: true });
await fs.mkdir(`${root}/comparison`, { recursive: true });
for (const engine of engines) {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push({ engine, message: error.message }));
  for (const source of manifest) {
    const key = `${source.kind}-${source.count}`;
    await page.goto(`${base}/patterns/render?kind=${source.kind}&count=${source.count}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => ['ready', 'error'].includes(document.querySelector('canvas')?.dataset.renderState));
    const canvas = page.locator('canvas');
    const state = await canvas.evaluate(element => ({ ...element.dataset, width: element.width, height: element.height, rect: element.getBoundingClientRect().toJSON() }));
    if (state.renderState !== 'ready') throw new Error(`${engine}/${key}: ${await page.locator('[role=alert]').allTextContents()}`);
    if (state.rect.x !== 0 || state.rect.y !== 0 || state.width !== 800 || state.height !== 800) throw new Error(`Incorrect ${engine}/${key} capture geometry.`);
    const rendered = `${root}/rendered/${key}-${engine}.png`;
    await canvas.screenshot({ path: rendered, animations: 'disabled' });
    const referenceFile = await fs.readFile(`${root}/reference/${key}.png`);
    const reference = await sharp(referenceFile).toColourspace('srgb').removeAlpha().raw().toBuffer();
    const actual = await sharp(rendered).toColourspace('srgb').removeAlpha().raw().toBuffer();
    const overlay = Buffer.alloc(actual.length), difference = Buffer.alloc(actual.length);
    let sum = 0, max = 0, over4 = 0, over8 = 0;
    const histogram = new Uint32Array(256);
    for (let i = 0; i < actual.length; i += 3) {
      let pixelMax = 0;
      for (let channel = 0; channel < 3; channel++) {
        const j = i + channel, delta = Math.abs(actual[j] - reference[j]);
        sum += delta; max = Math.max(max, delta); pixelMax = Math.max(pixelMax, delta);
        overlay[j] = Math.round((actual[j] + reference[j]) / 2); difference[j] = Math.min(255, delta * 8);
      }
      histogram[pixelMax]++; if (pixelMax > 4) over4++; if (pixelMax > 8) over8++;
    }
    let accumulated = 0, p99 = 0;
    for (; p99 < 255; p99++) { accumulated += histogram[p99]; if (accumulated >= 800 * 800 * .99) break; }
    for (const [name, buffer] of [['overlay', overlay], ['difference', difference]]) await sharp(buffer, { raw: { width: 800, height: 800, channels: 3 } }).png().toFile(`${root}/comparison/${key}-${engine}-${name}.png`);
    const result = { engine, key, sourceNode: source.id, sourceSha256: crypto.createHash('sha256').update(referenceFile).digest('hex'), meanAbsoluteChannelError: sum / actual.length, maximumChannelError: max, p99MaximumPixelError: p99, pixelsOver4Percent: over4 / 6400, pixelsOver8Percent: over8 / 6400, state };
    report.results.push(result);
    console.log(`${engine} ${key}: MAE ${result.meanAbsoluteChannelError.toFixed(4)}, p99 ${p99}, max ${max}, >8 ${result.pixelsOver8Percent.toFixed(3)}%`);
  }
  await browser.close();
}
await fs.writeFile(`${root}/results.json`, `${JSON.stringify(report, null, 2)}\n`);
if (report.errors.length || report.results.some(result => result.meanAbsoluteChannelError > 1 || result.pixelsOver8Percent > .01)) process.exitCode = 1;
