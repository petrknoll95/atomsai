import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';

const out = 'docs/visual/prototype-hero';
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3001/hero-variants/nebula');
    const field = page.locator('[data-prototype-field]');
    await expect(field).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
    await page.waitForTimeout(1000);
    const displacement = async () => Number(await field.getAttribute('data-displacement'));
    const energies = [];
    for (const delay of [90, 4]) {
      await page.mouse.move(10, 880);
      await page.mouse.move(800, 440);
      await page.waitForTimeout(250);
      let peak = 0;
      for (let i = 1; i <= 24; i++) {
        await page.mouse.move(800 + i * 20, 440);
        await page.waitForTimeout(delay);
        peak = Math.max(peak, Number(await field.getAttribute('data-pointer-energy')));
      }
      energies.push(peak);
    }
    assert(energies[1] > energies[0] * 1.5, `Speed response: ${energies}`);
    const displaced = await displacement();
    assert(displaced > 3 && displaced <= 120.01, `Bounded particle scattering: ${displaced}`);
    await page.screenshot({ path: `${out}/${name}-pointer.png` });
    await page.waitForTimeout(1500);
    const settling = await displacement();
    assert(settling < displaced * .8, 'A stationary pointer must let particles settle');
    await expect.poll(displacement, { timeout: 15000 }).toBeLessThan(.5);
    // The same interaction works after the nebula has organized into rings.
    const range = await page.locator('[data-section=hero]').evaluate(el => el.offsetHeight - el.querySelector('[data-prototype-field]').parentElement.offsetHeight);
    const ringsAt = .42 * 380 / 520;
    await page.evaluate(y => scrollTo(0, y), range * ringsAt);
    await expect.poll(async () => Number(await page.locator('[data-section=hero]').getAttribute('data-progress'))).toBeCloseTo(ringsAt, 2);
    await page.mouse.move(900, 440);
    await page.mouse.move(1200, 440, { steps: 8 });
    await expect.poll(displacement).toBeGreaterThan(3);
    await page.evaluate(y => scrollTo(0, y), range);
    await expect.poll(() => page.locator('[data-hero-reveal]').evaluate(el => getComputedStyle(el).clipPath), { timeout: 15000 }).toBe('none');
    await expect.poll(displacement).toBe(0);
    // Reduced motion clears the offsets and ignores further pointer travel.
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(1500);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(700);
    const canvas = field.locator('canvas');
    const pixels = await canvas.evaluate(el => el.toDataURL());
    await page.mouse.move(800, 440);
    await page.mouse.move(1300, 440, { steps: 10 });
    await page.waitForTimeout(300);
    assert.equal(await canvas.evaluate(el => el.toDataURL()), pixels);
    assert.equal(await displacement(), 0);
    assert.deepEqual(errors, []);
    results.push({ name, energies, displaced, settling, rings: true, reveal: true, reducedMotion: true, errors });
    console.log(`${name}: speed response, settling, rings, reveal and reduced motion passed`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${out}/pointer-checks.json`, JSON.stringify(results, null, 2));
