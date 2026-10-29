import { chromium, webkit, expect } from '@playwright/test';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const output = 'docs/visual/story-seam';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const deviceScaleFactor of [1, 2]) {
      const page = await browser.newPage({ viewport: { width: 947, height: 1000 }, deviceScaleFactor });
      const portrait = page.locator('[data-story-portraits]');
      for (const width of [947, 1001, 1600, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`http://127.0.0.1:3001/?seam-check=${width}#customer-stories`);
        await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
        const playback = page.locator('[data-story-playback]');
        await expect(playback).toBeVisible();
        await playback.focus();
        if ((await playback.getAttribute('aria-label')).startsWith('Pause')) await playback.click();
        // A contrasting backing makes uncovered subpixel gaps detectable.
        await page.addStyleTag({ content: '[data-story-portraits] { background: #ff00ff !important; }' });
        await portrait.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const box = await portrait.boundingBox();

        await page.mouse.move(box.x + box.width * .85, box.y + 150);
        await page.mouse.down();
        for (const fraction of [.53, .347, .183]) {
          await page.mouse.move(box.x + box.width * fraction, box.y + 150, { steps: 8 });
          await page.waitForTimeout(120);
          const boundaries = await portrait.locator('[data-slit-layer="incoming"] [data-portrait-slit]').evaluateAll(es => es.map(e => e.getBoundingClientRect().x));
          const seam = boundaries.find(x => x > box.x + 10 && x < box.x + box.width - 10);
          assert(seam !== undefined, 'Expected a visible slit boundary');
          const png = await page.screenshot({ clip: { x: seam - 8, y: box.y + 60, width: 16, height: 12 } });
          const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
          const columns = Array.from({ length: info.width }, (_, x) => {
            let r = 0, g = 0, b = 0;
            for (let y = 0; y < info.height; y++) {
              const i = (y * info.width + x) * 3;
              r += data[i]; g += data[i + 1]; b += data[i + 2];
            }
            return [r, g, b].map(v => v / info.height);
          });
          const outer = [...columns.slice(0, 2), ...columns.slice(-2)];
          const brightness = rgb => (rgb[0] + rgb[1] + rgb[2]) / 3;
          const excess = Math.max(...columns.map(brightness)) - Math.max(...outer.map(brightness));
          const magenta = columns.some(([r, g, b]) => r - g > 30 && b - g > 30);
          assert(!magenta, `${name}/${width}/${deviceScaleFactor}: exposed backing`);
          // Adjacent strips intentionally show offset image regions. Reject a white
          // export edge rather than treating that intended contrast as a seam.
          assert(!columns.some(rgb => rgb.every(value => value > 245)), `${name}/${width}/${deviceScaleFactor}: white hairline`);
          results.push({ browser: name, width, deviceScaleFactor, fraction, brightnessExcess: excess, exposedBacking: magenta });
        }
        if (deviceScaleFactor === 2 && width === 947) await portrait.screenshot({ path: `${output}/${name}-after.png`, style: '[data-story-portraits] { background: var(--color-secondary) !important; }' });
        await page.mouse.up();
        await page.waitForTimeout(900);
      }
      await page.close();
    }
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
console.log(`Passed ${results.length} seam samples across Chromium/WebKit, 4 widths and 2 pixel densities.`);
