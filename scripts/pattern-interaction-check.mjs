import { chromium, webkit, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const report = { date: new Date().toISOString(), base, results: [], errors: [] };
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
async function ready(page) { await expect(page.locator('canvas')).toHaveAttribute('data-render-state', 'ready'); }
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push({ engine: name, message: error.message }));
  await page.goto(`${base}/patterns`, { waitUntil: 'networkidle' }); await ready(page);
  const first = hash(await page.locator('canvas').screenshot());
  await page.getByRole('button', { name: '10', exact: true }).click(); await ready(page);
  const second = hash(await page.locator('canvas').screenshot());
  expect(second).not.toBe(first);
  await page.getByLabel('Pattern family').selectOption('concentric'); await ready(page);
  const rings15 = hash(await page.locator('canvas').screenshot());
  await page.getByRole('button', { name: '29', exact: true }).click(); await ready(page);
  expect(hash(await page.locator('canvas').screenshot())).not.toBe(rings15);
  await page.getByRole('button', { name: 'Compare with original' }).click();
  await expect(page.locator('img[src="/pattern-references/concentric-29.png"]')).toBeVisible();
  await page.getByLabel('Number of rings').fill('7'); await page.getByLabel('Number of rings').blur(); await ready(page);
  await expect(page.getByRole('button', { name: 'Compare with original' })).toBeDisabled();
  expect(hash(await page.locator('canvas').screenshot())).not.toBe(rings15);
  await page.getByRole('radio', { name: 'Dark', exact: true }).check(); await ready(page);
  const dark = hash(await page.locator('canvas').screenshot());
  await page.getByRole('radio', { name: 'Light', exact: true }).check(); await ready(page);
  expect(hash(await page.locator('canvas').screenshot())).not.toBe(dark);
  await page.getByRole('slider', { name: 'Zoom', exact: true }).focus(); await page.keyboard.press('End'); await ready(page);
  await expect(page.getByRole('slider', { name: 'Zoom', exact: true })).toHaveValue('3');
  const zoom = hash(await page.locator('canvas').screenshot());
  await page.getByRole('slider', { name: 'Horizontal crop', exact: true }).focus(); await page.keyboard.press('End'); await ready(page);
  expect(hash(await page.locator('canvas').screenshot())).not.toBe(zoom);
  await page.getByRole('button', { name: 'Reset all' }).click(); await ready(page);
  expect(hash(await page.locator('canvas').screenshot())).toBe(first);
  const quietA = hash(await page.locator('canvas').screenshot());
  await page.waitForTimeout(250);
  expect(hash(await page.locator('canvas').screenshot())).toBe(quietA);
  const widths = [];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await ready(page);
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(geometry.scrollWidth).toBe(width); widths.push(geometry);
  }
  // Generated artwork must still work when every reference/image request is blocked.
  await page.route('**/*', route => route.request().resourceType() === 'image' ? route.abort() : route.continue());
  await page.setViewportSize({ width: 512, height: 512 });
  await page.goto(`${base}/patterns/render?kind=concentric&count=29&size=512`, { waitUntil: 'networkidle' }); await ready(page);
  const withoutImages = hash(await page.locator('canvas').screenshot());
  const box = await page.locator('canvas').boundingBox(); expect(box).toEqual({ x: 0, y: 0, width: 512, height: 512 });
  // Force context loss/restoration, then verify the same still is rebuilt.
  const contextLossSupported = await page.locator('canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2'); const ext = gl?.getExtension('WEBGL_lose_context');
    if (!ext) return false; ext.loseContext(); window.setTimeout(() => ext.restoreContext(), 150); return true;
  });
  if (contextLossSupported) {
    await page.waitForTimeout(250); await ready(page);
    expect(hash(await page.locator('canvas').screenshot())).toBe(withoutImages);
  }
  report.results.push({ engine: name, checks: ['Count changes pixels', 'Concentric source and inferred counts change geometry', 'Palette changes pixels', 'Zoom and pan change pixels', 'Reset restores exact output', 'Idle canvas is static', 'No page overflow', 'Renderer works with all image requests blocked', 'Exact fixture origin and dimensions', ...(contextLossSupported ? ['WebGL context loss/restoration restores exact output'] : [])], widths });
  await browser.close();
}
await fs.writeFile('docs/patterns/interactions.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
