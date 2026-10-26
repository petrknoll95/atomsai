import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';
const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  for (const mode of ['touch', 'rgba8', 'unavailable']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const result = { browser: name, mode, errors: [] };
    page.on('pageerror', error => result.errors.push(error.message));
    results.push(result);
    if (mode === 'rgba8') await page.addInitScript(() => {
      const original = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function(name) { return name === 'EXT_color_buffer_float' ? null : original.call(this, name); };
    });
    if (mode === 'unavailable') await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(name, ...args) { return name === 'webgl2' ? null : original.call(this, name, ...args); };
    });
    try {
      await page.goto(`${base}/patterns/motion`, { waitUntil: 'networkidle' });
      const canvas = page.locator('canvas');
      if (mode === 'unavailable') {
        await expect(page.locator('p[role="status"]')).toContainText('Motion is unavailable');
        await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeDisabled();
        await expect(canvas).toHaveAttribute('data-render-state', 'error');
        result.fallback = 'Visible explanation and disabled playback';
      } else {
        await expect(canvas).toHaveAttribute('data-render-state', 'ready');
        const first = Number(await canvas.getAttribute('data-motion-frames'));
        await page.waitForTimeout(250);
        assert(Number(await canvas.getAttribute('data-motion-frames')) > first);
        result.dimensions = await canvas.evaluate(c => ({ width: c.width, height: c.height, cssWidth: c.clientWidth, dpr: devicePixelRatio, maskPrecision: c.dataset.maskPrecision, retainedMaskBytes: Number(c.dataset.retainedMaskBytes) }));
        assert(result.dimensions.width <= 1024 && result.dimensions.height <= 1024);
        assert(result.dimensions.width <= result.dimensions.cssWidth * 1.5 + 1);
        if (mode === 'rgba8') assert.equal(result.dimensions.maskPrecision, 'uint8');
        await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
        const hidden = await canvas.getAttribute('data-motion-frames');
        await page.waitForTimeout(300); assert.equal(await canvas.getAttribute('data-motion-frames'), hidden);
        await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
        await page.waitForTimeout(200); assert(Number(await canvas.getAttribute('data-motion-frames')) > Number(hidden));
        result.visibility = 'Simulated hidden-document event stops frames; visible event resumes';
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    } catch (error) { result.errors.push(error.stack); }
    await page.close();
    console.log(`${name} ${mode}: ${result.errors.length ? result.errors.join('\n') : 'passed'}`);
  }
  await browser.close();
}
await fs.mkdir('docs/patterns/motion', { recursive: true });
await fs.writeFile('docs/patterns/motion/devices.json', JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
if (results.some(result => result.errors.length)) process.exitCode = 1;
