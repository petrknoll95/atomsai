import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const out = 'docs/visual/menu-resolution';
const url = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
await fs.mkdir(out, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  for (const quality of ['balanced', 'display']) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Reproduce the old menu budget in an isolated browser, without modifying
    // source files or adding a production-only debug URL/control.
    if (quality === 'balanced') await page.route('**/_next/static/chunks/*.js', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replaceAll('resolution:"display"', 'resolution:"balanced"');
      await route.fulfill({ response, body });
    });
    await page.goto(url);
    await page.getByRole('button', { name: 'Open site menu' }).click();
    const canvas = page.locator('[data-menu-pattern] canvas');
    await expect(canvas).toHaveAttribute('data-render-state', 'ready', { timeout: 20000 });
    await expect(canvas).toHaveAttribute('data-resolution', quality);
    const stats = await canvas.evaluate(el => ({ width: el.width, height: el.height, cssWidth: el.clientWidth, cssHeight: el.clientHeight, ...el.dataset }));
    assert(Number(stats.retainedMaskBytes) <= 67108864);
    if (quality === 'display') {
      assert(stats.width >= stats.cssWidth * 1.9);
      assert(stats.width * stats.height <= 12000000 + 10000);
    } else assert.equal(stats.width, 1024);
    await page.screenshot({ path: `${out}/${name}-${quality}.png` });
    if (quality === 'display') {
      const prepared = await canvas.getAttribute('data-prepare-count');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(canvas).toHaveAttribute('data-playback', 'playing');
      const phase = await canvas.getAttribute('data-phase');
      await page.waitForTimeout(600);
      assert.notEqual(await canvas.getAttribute('data-phase'), phase);
      assert.equal(await canvas.getAttribute('data-prepare-count'), prepared, 'Animation must reuse the masks');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 390, height: 844 });
      await expect.poll(() => canvas.evaluate(el => el.clientHeight)).toBe(844);
      await expect.poll(() => canvas.evaluate(el => el.width / el.clientWidth)).toBeGreaterThan(1.9);
      assert(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth));
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-menu-pattern]')).toHaveCount(0);
    }
    assert.deepEqual(errors, []);
    results.push({ browser: name, quality, stats, errors });
    await page.close();
  }
  await browser.close();
}
await fs.writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
const parts = [];
for (const [i, quality] of ['balanced', 'display'].entries()) {
  const input = await sharp(`${out}/chromium-${quality}.png`)
    .extract({ left: 1078, top: 220, width: 80, height: 320 })
    .resize(320, 1280, { kernel: 'nearest' }).png().toBuffer();
  parts.push({ input, left: i * 340, top: 0 });
}
await sharp({ create: { width: 660, height: 1280, channels: 3, background: '#fafafa' } })
  .composite(parts).png().toFile(`${out}/edge-before-after.png`);
console.log(JSON.stringify(results, null, 2));
