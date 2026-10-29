import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = 'docs/visual/industry-press';
await fs.mkdir(out, { recursive: true });
const report = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3001/');
    const gallery = page.locator('#industry-gallery');
    await gallery.scrollIntoViewIfNeeded();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
    await gallery.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const box = await gallery.boundingBox();
    // Press the image above its central link, which now intentionally navigates on click.
    const x = box.x + box.width / 2, y = box.y + box.height * .2;
    const values = () => gallery.locator('[data-industry-image]').evaluateAll(circles => circles.map(circle => ({
      inset: parseFloat(getComputedStyle(circle).getPropertyValue('--industry-inset')),
      width: circle.getBoundingClientRect().width,
    })));
    await page.mouse.move(x, y);
    await page.waitForTimeout(1300);
    const rest = await values();
    await gallery.screenshot({ path: `${out}/${name}-hover.png` });
    await page.mouse.down();
    await expect(gallery).toHaveAttribute('data-pressed', 'true');
    await page.waitForTimeout(130);
    const intermediate = await values();
    assert(intermediate.every((v, i) => v.inset > rest[i].inset && v.inset < 36), 'All circles interpolate into the deeper clip');
    await page.waitForTimeout(400);
    const pressed = await values();
    assert(pressed.every(v => Math.abs(v.inset - 36) < .1), 'Every circle is clipped while held');
    assert(pressed.every((v, i) => v.width === rest[i].width), 'Slide/image layout stays unchanged');
    await gallery.screenshot({ path: `${out}/${name}-pressed.png` });
    await page.mouse.move(x - 230, y, { steps: 16 });
    await expect(gallery).toHaveAttribute('data-pressed', 'true');
    await page.mouse.up();
    await expect(gallery).toHaveAttribute('data-pressed', 'false');
    await page.mouse.move(2, 2);
    await page.waitForTimeout(1500);
    assert((await values()).every(v => v.inset < .1), 'Release restores the resting clip');
    // Losing window focus must never leave the circles stuck in their held state.
    await page.mouse.move(x, y); await page.mouse.down();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(gallery).toHaveAttribute('data-pressed', 'false');
    await page.mouse.up();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gallery.scrollIntoViewIfNeeded();
    const reducedBox = await gallery.boundingBox();
    await page.mouse.move(reducedBox.x + reducedBox.width / 2, reducedBox.y + reducedBox.height * .2);
    await page.mouse.down();
    assert((await values()).every(v => v.inset === 36), 'Reduced motion applies the held state immediately');
    await page.mouse.up();
    assert((await values()).every(v => v.inset <= 12), 'Reduced motion releases immediately');
    assert.deepEqual(errors, []);
    report.push({ name, rest, intermediate, pressed, errors });
    console.log(`${name}: all-circle press, interpolation, release, blur and reduced motion passed`);
    await page.close();
  } finally { await browser.close(); }
}
// Real touch input covers cancellation by a device gesture as well as release.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:3001/');
  const gallery = page.locator('#industry-gallery');
  await gallery.scrollIntoViewIfNeeded();
  const box = await gallery.boundingBox();
  const client = await page.context().newCDPSession(page);
  for (const finish of ['touchEnd', 'touchCancel']) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height * .2 }] });
    await expect(gallery).toHaveAttribute('data-pressed', 'true');
    const insets = await gallery.locator('[data-industry-image]').evaluateAll(circles => circles.map(el => parseFloat(getComputedStyle(el).getPropertyValue('--industry-inset'))));
    assert(insets.every(value => value >= 18 && value < 36));
    await client.send('Input.dispatchTouchEvent', { type: finish, touchPoints: [] });
    await expect(gallery).toHaveAttribute('data-pressed', 'false');
  }
  report.push({ name: 'Chromium touch', release: true, cancel: true });
  console.log('Touch: press, release and native cancellation passed');
} finally { await browser.close(); }
await fs.writeFile(`${out}/checks.json`, JSON.stringify(report, null, 2));
