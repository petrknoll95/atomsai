import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3101';
const output = 'docs/motion/text-reveals';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [1600, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.textRevealFrames = [];
        const start = performance.now();
        const sample = () => {
          const lines = [...document.querySelectorAll('#hero-heading .text-reveal-line')];
          if (lines.length) window.textRevealFrames.push(lines.map(line => Number(getComputedStyle(line).opacity)));
          if (performance.now() - start < 4000) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      await page.goto(base);
      await expect(page.locator('#hero-heading')).toHaveAttribute('data-text-reveal-state', 'visible');
      const frames = await page.evaluate(() => window.textRevealFrames);
      assert(frames.some(frame => frame[0] > .1 && frame[0] < .95 && frame[0] > frame[1] + .08), 'Hero lines must stagger through intermediate opacity.');
      assert.equal(await page.locator('#hero-heading .text-reveal-line').count(), 2, 'Preserve the authored hero line break.');
      const headings = page.locator('[data-text-reveal-state]');
      const bounds = () => headings.evaluateAll(els => els.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
      const splitBounds = await bounds();
      await page.screenshot({ path: `${output}/${name}-${width}-hero.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('.text-reveal-line')).toHaveCount(0);
      const plainBounds = await page.locator('h1.display, h2.display').evaluateAll(els => els.filter(el => !el.closest('dialog')).map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
      assert.equal(splitBounds.length, plainBounds.length);
      splitBounds.forEach((rect, index) => {
        assert(Math.abs(rect.width - plainBounds[index].width) < .5, `Width changed for headline ${index}`);
        assert(Math.abs(rect.height - plainBounds[index].height) < .5, `Height changed for headline ${index}`);
      });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const target = page.locator('#applications-title');
      await expect(target).toHaveAttribute('data-text-reveal-state', 'pending');
      await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
      await page.mouse.wheel(0, await target.evaluate(el => el.getBoundingClientRect().top - 250));
      await expect(target).toHaveAttribute('data-text-reveal-state', 'visible', { timeout: 30000 });
      await expect.poll(() => target.evaluate(el => getComputedStyle(el.closest('section')).opacity)).toBe('1');
      await page.screenshot({ path: `${output}/${name}-${width}-applications.png` });
      await page.setViewportSize({ width: width === 1600 ? 768 : 320, height: 960 });
      await expect(target).toHaveAttribute('data-text-reveal-state', 'visible');
      await expect.poll(() => target.locator('.text-reveal-line').evaluateAll(els => els.every(el => Number(getComputedStyle(el).opacity) === 1))).toBe(true);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow after re-splitting.');
      await page.locator('#faq-heading').evaluate(el => { el.tabIndex = -1; el.focus({ preventScroll: true }); });
      await expect(page.locator('#faq-heading')).toHaveAttribute('data-text-reveal-state', 'visible');
      assert.deepEqual(errors, []);
      results.push({ browser: name, width, passed: true, heroFrames: frames.filter((_, i) => i % 5 === 0), checks: ['load stagger', 'unchanged heading dimensions', 'scroll reveal', 'section fade reaches full opacity', 'resize', 'keyboard focus', 'live reduced motion', 'no overflow'], errors });
      await page.close();
    }
    const deepLink = await browser.newPage();
    await deepLink.goto(`${base}/#closing-heading`);
    await expect(deepLink.locator('#closing-heading')).toHaveAttribute('data-text-reveal-state', 'visible');
    await deepLink.close();
    const plain = await browser.newPage({ javaScriptEnabled: false });
    await plain.goto(base);
    await expect(plain.locator('#hero-heading')).toBeVisible();
    await expect(plain.locator('#applications-title')).toHaveCSS('opacity', '1');
    await plain.close();
    const slowFonts = await browser.newPage();
    await slowFonts.route('**/fonts/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2500));
      await route.continue().catch(() => {});
    });
    await slowFonts.goto(base, { waitUntil: 'domcontentloaded' });
    await expect(slowFonts.locator('#applications-title')).toHaveAttribute('data-text-reveal-state', 'visible');
    await expect(slowFonts.locator('#applications-title')).toHaveCSS('opacity', '1');
    await expect(slowFonts.locator('.text-reveal-line')).toHaveCount(0);
    await slowFonts.close();
    console.log(`${name}: headline reveal checks passed`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ base, results }, null, 2) + '\n');
