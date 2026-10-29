import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';

const url = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const out = 'docs/visual/hero-atoms';
await fs.mkdir(out, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const host = page.locator('[data-hero-atoms]');
  const canvas = host.locator('canvas');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(host).toHaveAttribute('data-playback', 'running');
  await expect(canvas).toHaveCount(1);
  const pixels = () => canvas.evaluate(el => el.toDataURL());
  const first = await pixels();
  await page.waitForTimeout(1500);
  assert.notEqual(await pixels(), first, 'The canvas must visibly change over time');
  await page.screenshot({ path: `${out}/${name}-desktop.png` });
  // Slow vs fast traversals of the same region must produce different energy.
  const energies = [];
  for (const delay of [90, 8]) {
    await page.mouse.move(400, 280);
    let peak = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 45; i++) {
        await page.mouse.move(400 + (pass ? 44 - i : i) * 14, 280);
        await page.waitForTimeout(delay);
        peak = Math.max(peak, Number(await host.getAttribute('data-pointer-energy') || 0));
      }
    }
    energies.push(peak);
  }
  assert(energies[1] > energies[0] * 1.5, `Velocity response: ${energies}`);
  await page.screenshot({ path: `${out}/${name}-hover.png` });
  const stats = await host.evaluate(el => ({ ...el.dataset }));
  assert(Number(stats.particles) <= 3000);
  await page.evaluate(() => window.scrollTo({ top: 1900, behavior: 'instant' }));
  await expect(host).toHaveAttribute('data-playback', 'paused', { timeout: 10000 });
  await page.waitForTimeout(150);
  const paused = await pixels();
  await page.waitForTimeout(400);
  assert.equal(await pixels(), paused, 'Offscreen rendering must stop');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(host).toHaveAttribute('data-playback', 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(host).toHaveAttribute('data-playback', 'reduced');
  await page.waitForTimeout(250);
  const staticFrame = await pixels();
  await page.mouse.move(700, 250);
  await page.waitForTimeout(500);
  assert.equal(await pixels(), staticFrame, 'Reduced motion must remain static, including hover');
  const widths = [];
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await expect(canvas).toHaveJSProperty('clientWidth', width);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
    widths.push({ width, particles: Number(await host.getAttribute('data-particles')) });
  }
  assert.deepEqual(errors, []);
  results.push({ browser: name, stats, velocityEnergy: energies, widths, pixelsAnimate: true, offscreenPauses: true, reducedMotionStatic: true, errors });
  await page.close();

  // Fresh mobile load tests initial reduced motion and native touch scroll semantics.
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await mobile.goto(url);
  const mobileHost = mobile.locator('[data-hero-atoms]');
  await expect(mobileHost).toHaveAttribute('data-state', 'ready');
  await expect(mobileHost).toHaveAttribute('data-playback', 'reduced');
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({ path: `${out}/${name}-mobile.png` });
  const mobileBefore = await mobileHost.locator('canvas').evaluate(el => el.toDataURL());
  await mobile.touchscreen.tap(180, 220);
  await mobile.waitForTimeout(300);
  assert.equal(await mobileHost.locator('canvas').evaluate(el => el.toDataURL()), mobileBefore);
  await mobile.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(mobileHost).toHaveAttribute('data-playback', 'running');
  await expect(mobileHost).toHaveAttribute('data-fps', '30', { timeout: 5000 });
  assert(await mobileHost.locator('canvas').evaluate(el => el.width * el.height <= 3_000_000 && getComputedStyle(el).pointerEvents === 'none' && getComputedStyle(el).touchAction === 'auto'));
  await mobile.close();
  await browser.close();
}

const browser = await chromium.launch();
const fallback = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 1600, height: 960 } });
await fallback.goto(url);
await expect(fallback.locator('[data-hero-atoms] img')).toBeVisible();
await expect(fallback.getByRole('heading', { level: 1 })).toBeVisible();
await browser.close();
await fs.writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
