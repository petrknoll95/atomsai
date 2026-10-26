import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { chromium, webkit, expect } from '@playwright/test';
const out = 'docs/visual/voice-preview';
await fs.mkdir(out, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, reducedMotion: 'reduce' });
  const result = { browser: name, errors: [] }; results.push(result);
  page.on('pageerror', e => result.errors.push(e.message));
  try {
    await page.goto(`${process.env.VISUAL_URL || 'http://127.0.0.1:3001'}/#technology`, { waitUntil: 'networkidle' });
    const button = page.getByRole('link', { name: 'Start talking in the PyAI playground (opens in a new tab)' });
    const glass = button.locator('..');
    const widget = glass.locator('..');
    await glass.scrollIntoViewIfNeeded();
    await expect(widget.locator('#voice-preview-pattern canvas')).toHaveAttribute('data-render-state', 'ready');
    await page.evaluate(() => document.fonts.ready);
    result.geometry = await glass.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight, backdrop: getComputedStyle(el).backdropFilter, surfaceBackdrop: getComputedStyle(el, '::before').backdropFilter }));
    assert.equal(result.geometry.width, 736); assert.equal(result.geometry.height, 320);
    assert.equal(result.geometry.backdrop, 'none');
    assert.equal(result.geometry.surfaceBackdrop, 'blur(18px)');
    const fallback = button.locator('[data-voice-button-backdrop]');
    result.fallback = await fallback.isVisible();
    if (!result.fallback) assert.equal(await button.evaluate(el => getComputedStyle(el).backdropFilter), 'blur(18px)');
    else await expect(fallback.locator('canvas')).toHaveAttribute('data-render-state', 'ready');
    result.assets = await glass.locator('img').evaluateAll(imgs => imgs.map(i => ({ src: i.getAttribute('src'), loaded: i.complete && i.naturalWidth > 0, width: i.width, height: i.height, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight })));
    assert(result.assets.every(a => a.loaded));
    assert(result.assets.some(a => a.src.endsWith('preview-waveform.svg') && a.width === 736 && a.height === 320));
    assert(result.assets.some(a => a.src.endsWith('preview-voice-icon.svg') && a.width === 24 && a.height === 24));
    await glass.screenshot({ path: `${out}/${name}-glass.png` });
    await widget.screenshot({ path: `${out}/${name}-widget.png` });
    const blurred = await button.screenshot();
    await button.evaluate(el => { el.style.backdropFilter = 'none'; el.style.webkitBackdropFilter = 'none'; el.querySelectorAll('[data-voice-blur-layer]').forEach(layer => { layer.style.filter = 'none'; }); });
    const unblurred = await button.screenshot();
    const a = await sharp(blurred).removeAlpha().raw().toBuffer(), b = await sharp(unblurred).removeAlpha().raw().toBuffer();
    result.blurPixelDifference = a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0) / a.length;
    assert(result.blurPixelDifference > 0.1, 'Button blur must change the rendered backdrop, not just computed CSS');
    await button.evaluate(el => { el.style.removeProperty('backdrop-filter'); el.style.removeProperty('-webkit-backdrop-filter'); el.querySelectorAll('[data-voice-blur-layer]').forEach(layer => layer.style.removeProperty('filter')); });
    if (result.fallback) {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForTimeout(250);
      const phases = await widget.locator('canvas').evaluateAll(canvases => canvases.map(c => Number(c.dataset.phase)));
      const delta = Math.abs(phases[0] - phases[1]);
      result.phaseDifference = Math.min(delta, 1 - delta);
      assert(result.phaseDifference < 0.015, 'Blurred shader copy must follow the original phase');
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      await glass.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 390) await widget.screenshot({ path: `${out}/${name}-mobile.png` });
    }
  } catch (error) { result.errors.push(error.stack); }
  await browser.close();
  console.log(name, result.errors.length ? result.errors : 'passed');
}
await fs.writeFile(`${out}/results.json`, JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
if (results.some(r => r.errors.length)) process.exitCode = 1;
