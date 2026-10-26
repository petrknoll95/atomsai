import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// Original exports include outside strokes and dropdown shadow. Frame origin is
// (33,21) within each 802×510 export; crop to the original 736×444 component.
const out = path.resolve('docs/visual');
const variants = [
  ['ServiceAgent', '260:6729', 'header-dropdown.png'],
  ['JustCall', '250:6234', 'header-JustCall.png'],
  ['Helpwise', '250:6337', 'header-Helpwise.png'],
  ['CallPage', '250:6420', 'header-CallPage.png'],
];
await fs.mkdir(`${out}/comparison`, { recursive: true });
await fs.mkdir(`${out}/rendered`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const results = [];
try {
  await page.goto(process.env.VISUAL_URL || 'http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.locator('h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-menu="Applications"] > summary').click();
  for (const [product, node, file] of variants) {
    if (product !== 'ServiceAgent') await page.locator('[data-applications-panel] a').filter({ hasText: product }).first().hover();
    await page.locator(`[data-product-preview="${product}"]`).waitFor();
    await page.evaluate(async () => Promise.all(Array.from(document.querySelectorAll('[data-applications-panel] img')).map(image => image.decode())));
    const panel = page.locator('[data-applications-panel]');
    const geometry = await panel.boundingBox();
    const screenshot = `${out}/rendered/header-${product}.png`;
    await panel.screenshot({ path: screenshot, animations: 'disabled' });
    const reference = await sharp(`${out}/reference/${file}`).extract({ left: 33, top: 21, width: 736, height: 444 }).toColourspace('srgb').removeAlpha().raw().toBuffer();
    const actual = await sharp(screenshot).removeAlpha().raw().toBuffer();
    const overlay = Buffer.alloc(actual.length), diff = Buffer.alloc(actual.length);
    let sum = 0, changed = 0;
    for (let i = 0; i < actual.length; i += 3) {
      let maxDelta = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(reference[i + c] - actual[i + c]);
        sum += d; maxDelta = Math.max(maxDelta, d);
        overlay[i + c] = Math.round((reference[i + c] + actual[i + c]) / 2);
        diff[i + c] = Math.min(255, d * 4);
      }
      if (maxDelta > 24) changed++;
    }
    for (const [kind, buffer] of [['overlay', overlay], ['difference-x4', diff]]) {
      await sharp(buffer, { raw: { width: 736, height: 444, channels: 3 } }).png().toFile(`${out}/comparison/header-${product}-${kind}.png`);
    }
    results.push({ product, node, originalExport: { file, width: 802, height: 510 }, crop: { left: 33, top: 21, width: 736, height: 444 }, geometry, meanAbsoluteChannelError: sum / actual.length, pixelsOver24Percent: 100 * changed / (actual.length / 3) });
  }
} finally {
  await browser.close();
}
await fs.writeFile(`${out}/header-results.json`, JSON.stringify({ date: new Date().toISOString(), browser: 'Playwright Chromium', viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1, sourceFile: 'pLyUMYhdCUYzwz0UXPtGY8', note: 'Original Figma exports retained. Crop excludes shadow and outside stroke; CSS geometry is verified separately. Pixel metrics include font rasterization differences.', results, errors }, null, 2) + '\n');
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length || results.some(({ geometry }) => geometry.x !== 204 || geometry.y !== 80 || geometry.width !== 736 || geometry.height !== 444)) process.exitCode = 1;
