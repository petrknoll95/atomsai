import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';
const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const output = 'docs/visual/smooth-scroll';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  for (const { width, touch } of [{ width: 1600, touch: false }, { width: 390, touch: false }, { width: 390, touch: true }]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference', isMobile: touch, hasTouch: touch });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
      await page.waitForTimeout(500);
      const samples = await page.evaluate(async () => {
        scrollTo({ top: 1200, behavior: 'instant' });
        const values = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          values.push({ native: scrollY, rendered: -document.getElementById('smooth-content').getBoundingClientRect().top });
        }
        return values;
      });
      const lag = touch ? samples.at(-1) : samples.find(frame => frame.native - frame.rendered > 5);
      if (touch) assert(Math.abs(lag.native - lag.rendered) < 3, 'Touch scrolling must stay native');
      assert(lag, `Expected real GSAP catch-up: ${JSON.stringify(samples)}`);
      await page.waitForFunction(() => Math.abs(scrollY + document.getElementById('smooth-content').getBoundingClientRect().top) < 3);
      const settled = await page.evaluate(() => ({ native: scrollY, rendered: -document.getElementById('smooth-content').getBoundingClientRect().top, header: document.querySelector('header').getBoundingClientRect().toJSON() }));
      assert(Math.abs(settled.native - settled.rendered) < 3);
      assert.equal(settled.header.y, 0);
      assert.equal(settled.header.height, width < 768 ? 80 : 96);
      await page.screenshot({ path: `${output}/${name}-${width}${touch ? '-touch' : ''}-header.png` });
      await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Site menu', exact: true });
      await expect(dialog).toHaveAttribute('data-menu-state', 'open');
      const locked = await page.evaluate(() => -document.getElementById('smooth-content').getBoundingClientRect().top);
      if (touch) await page.keyboard.press('PageDown');
      else await page.mouse.wheel(0, 600);
      await page.waitForTimeout(300);
      assert(Math.abs(await page.evaluate(() => -document.getElementById('smooth-content').getBoundingClientRect().top) - locked) < 2);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await page.waitForTimeout(100);
      assert(Math.abs(await page.evaluate(() => scrollY) - locked) < 2);
      await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
      await expect(dialog).toHaveAttribute('data-menu-state', 'open');
      await dialog.getByRole('link', { name: 'Applications', exact: true }).click();
      await expect(dialog).toBeHidden();
      await page.waitForFunction(offset => Math.abs(document.getElementById('applications').getBoundingClientRect().top - offset) < 3, width < 768 ? 96 : 112);
      const destination = await page.locator('#applications').boundingBox();
      assert(Math.abs(destination.y - (width < 768 ? 96 : 112)) < 3, `Anchor clearance: ${destination.y}`);
      await expect(page.locator('#applications-title')).toBeFocused();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('html')).not.toHaveAttribute('data-smooth-scroll');
      await page.evaluate(() => scrollTo({ top: 1700, behavior: 'instant' }));
      assert.equal(await page.getByRole('banner').evaluate(el => el.getBoundingClientRect().top), 0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
      await page.goto(`${base}/#industries`, { waitUntil: 'networkidle' });
      await page.waitForFunction(offset => Math.abs(document.getElementById('industries').getBoundingClientRect().top - offset) < 3, width < 768 ? 96 : 112);
      const deepLink = await page.locator('#industries').boundingBox();
      assert(Math.abs(deepLink.y - (width < 768 ? 96 : 112)) < 3, `Deep link clearance: ${deepLink.y}`);
      assert.deepEqual(errors, []);
      results.push({ browser: name, width, touch, lag, settled, checks: [touch ? 'Native touch scrolling' : 'GSAP catch-up and settling', 'fixed header', 'modal scroll lock/restoration', 'section navigation and focus', 'live reduced motion', 'initial deep link'], errors });
      console.log(`${name} ${width}${touch ? ' touch' : ''}: passed`);
    } catch (error) {
      results.push({ browser: name, width, touch, errors: [...errors, error.message] });
      console.error(`${name} ${width}${touch ? ' touch' : ''}: ${error.message}`);
    } finally { await page.close(); }
  }
  await browser.close();
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ date: new Date().toISOString(), base, results }, null, 2));
if (results.some(result => result.errors.length)) process.exitCode = 1;
