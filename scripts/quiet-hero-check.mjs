import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const check = expect.configure({ timeout: 20000 });

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  if (process.argv[2] && process.argv[2] !== name) continue;
  const browser = await engine.launch();
  try {
    for (const width of [1600, 390]) {
      if (process.argv[3] && Number(process.argv[3]) !== width) continue;
      const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:3001/hero-variants/particles');
      const field = page.locator('[data-starfield]');
      const hero = page.locator('[data-variant="stars"]');
      const surface = page.locator('[data-hero-theme-surface]');
      await check(field).toHaveAttribute('data-ready', 'true');
      await page.waitForTimeout(1700);
      await check(surface).toHaveAttribute('data-theme', 'dark');
      await check(page.locator('#hero-heading')).toBeVisible();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const pixels = () => field.locator('canvas').evaluate(el => el.toDataURL());
      const first = await pixels();
      await page.waitForTimeout(200);
      assert.notEqual(await pixels(), first, 'Idle particles animate');
      await page.mouse.move(30, 160);
      await page.mouse.move(width - 30, 260, { steps: 10 });
      assert.equal(await field.locator('div').count(), 0, 'No pill label layer');
      assert.equal(await field.getAttribute('data-connection-graph'), null);
      const color = await hero.evaluate(el => ({ color: getComputedStyle(el).getPropertyValue('--hero-dot-color').trim(), opacity: getComputedStyle(el).getPropertyValue('--hero-dot-opacity').trim(), background: getComputedStyle(el).backgroundColor }));
      assert.equal(color.opacity, '.85');
      assert.match(color.color, /color\(display-p3/);
      assert.equal(color.background, 'rgba(0, 0, 0, 0)');
      await page.screenshot({ path: `docs/visual/quiet-hero/${name}-${width}.png` });
      const range = await hero.evaluate(el => el.offsetHeight - el.querySelector('[data-hero-stage]').offsetHeight);
      await page.evaluate(y => scrollTo(0, y), range * .55);
      await check.poll(async () => Number(await hero.getAttribute('data-progress'))).toBeGreaterThan(.54);
      await check.poll(() => surface.evaluate(el => el.style.getPropertyValue('--hero-theme-mix'))).toBe('100%');
      await check(surface).toHaveAttribute('data-theme', 'light');
      await page.screenshot({ path: `docs/visual/quiet-hero/${name}-${width}-transition.png` });
      await page.evaluate(y => scrollTo(0, y), range);
      await check(page.locator('[data-hero-reveal]')).toHaveAttribute('aria-hidden', 'false');
      await check(page.locator('[data-hero-reveal]')).toHaveCSS('transform', 'none');
      assert(await field.locator('canvas').evaluate(el => !el.getContext('2d').getImageData(0, 0, el.width, el.height).data.some((n, i) => i % 4 === 3 && n)), 'Field clears before release');
      await page.screenshot({ path: `docs/visual/quiet-hero/${name}-${width}-revealed.png` });
      await check(hero).not.toHaveAttribute('data-auto-flight', 'true');
      await page.waitForTimeout(250);
      if (width < 768) await page.evaluate(() => scrollTo(0, 0));
      else await page.mouse.wheel(0, -range);
      await check.poll(() => surface.evaluate(el => el.style.getPropertyValue('--hero-theme-mix'))).toBe('0%');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(900);
      const still = await pixels();
      await page.mouse.move(100, 200);
      await page.waitForTimeout(250);
      assert.equal(await pixels(), still, 'Reduced motion is static');
      assert.deepEqual(errors, []);
      console.log(`${name} ${width}: idle field, no interaction, theme transition, section reveal, reduced motion passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
