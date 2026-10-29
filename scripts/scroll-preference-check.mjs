import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';
const base = process.env.VISUAL_URL || 'http://localhost:3001';
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const batteryMode of ['available', 'unavailable', 'denied']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(mode => {
        const battery = Object.assign(new EventTarget(), { level: .15, charging: false });
        const connection = Object.assign(new EventTarget(), { saveData: false });
        Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
        Object.defineProperty(navigator, 'getBattery', { configurable: true, value: mode === 'unavailable' ? undefined
          : () => mode === 'denied' ? Promise.reject(new Error('Battery access denied')) : Promise.resolve(battery) });
        window.testScrollPreferences = { battery, connection };
        const original = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = function (options) {
          window.testScrollBehavior = options?.behavior;
          return original.call(this, options);
        };
      }, batteryMode);
      await page.goto(base, { waitUntil: 'networkidle' });
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-native-scroll', 'reduced-motion');
      await expect(html).not.toHaveAttribute('data-smooth-scroll');
      assert.equal(await html.evaluate(el => getComputedStyle(el).scrollBehavior), 'auto');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      if (batteryMode === 'available') {
        await expect(html).toHaveAttribute('data-native-scroll', 'low-battery');
        await page.getByRole('link', { name: 'Explore applications', exact: true }).click();
        await expect.poll(() => page.evaluate(() => window.testScrollBehavior)).toBe('instant');
        await page.evaluate(() => {
          const { battery } = window.testScrollPreferences;
          battery.charging = true; battery.dispatchEvent(new Event('chargingchange'));
        });
      }
      await expect(html).toHaveAttribute('data-smooth-scroll', 'true');
      await expect(html).not.toHaveAttribute('data-native-scroll');
      await page.evaluate(() => {
        const { connection } = window.testScrollPreferences;
        connection.saveData = true; connection.dispatchEvent(new Event('change'));
      });
      await expect(html).toHaveAttribute('data-native-scroll', 'data-saver');
      await expect(html).not.toHaveAttribute('data-smooth-scroll');
      await page.evaluate(() => scrollTo({ top: 1200, behavior: 'instant' }));
      assert(Math.abs(await page.evaluate(() => scrollY + document.getElementById('smooth-content').getBoundingClientRect().top)) < 2);
      // Changes apply live, preserve scroll position, and respect precedence.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(html).toHaveAttribute('data-native-scroll', 'reduced-motion');
      assert(Math.abs(await page.evaluate(() => scrollY) - 1200) < 3);
      await page.evaluate(() => {
        const { connection, battery } = window.testScrollPreferences;
        connection.saveData = false; connection.dispatchEvent(new Event('change'));
        battery.charging = false; battery.level = .8; battery.dispatchEvent(new Event('levelchange'));
      });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(html).toHaveAttribute('data-smooth-scroll', 'true');
      assert(Math.abs(await page.evaluate(() => scrollY) - 1200) < 3);
      if (batteryMode === 'available') {
        await page.evaluate(() => {
          const { battery } = window.testScrollPreferences;
          battery.level = .2; battery.dispatchEvent(new Event('levelchange'));
        });
        await expect(html).toHaveAttribute('data-native-scroll', 'low-battery');
        await expect(html).not.toHaveAttribute('data-smooth-scroll');
      }
      assert.deepEqual(errors, []);
      console.log(`${name}, battery ${batteryMode}: initial/live motion, saving preferences, native geometry, restoration passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
