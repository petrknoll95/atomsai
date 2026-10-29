import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';

const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [1600, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route('**/fonts/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 650));
        await route.continue();
      });
      await page.route(/\.js(?:\?|$)/, async route => {
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.continue();
      });
      await page.addInitScript(() => {
        window.heroFrames = [];
        const sample = () => {
          const hero = document.querySelector('[data-section=hero]');
          const title = document.querySelector('#hero-heading');
          if (hero && title && getComputedStyle(hero).position === 'relative') {
            const lead = hero.querySelector('p');
            const bounds = el => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10) / 10); };
            window.heroFrames.push({
              height: hero.offsetHeight,
              enhanced: hero.hasAttribute('data-enhanced'),
              visible: Number(getComputedStyle(title.parentElement).opacity) > .05,
              fonts: document.fonts.status,
              title: bounds(title), lead: bounds(lead),
            });
          }
          if (performance.now() < 8000) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      await page.goto('http://127.0.0.1:3001/hero-variants/nebula');
      await expect(page.locator('[data-prototype-field]')).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
      await page.waitForTimeout(1500);
      const frames = await page.evaluate(() => window.heroFrames);
      const before = frames.find(frame => !frame.enhanced);
      const after = frames.findLast(frame => frame.enhanced);
      assert(before && after, 'Observe both server layout and initialized canvas');
      assert.equal(before.height, after.height, 'Canvas startup must not change the hero track height');
      const visible = frames.filter(frame => frame.visible);
      assert(visible.length > 0);
      assert(visible.every(frame => frame.fonts === 'loaded'), 'No visible fallback-font flash');
      for (const frame of visible) {
        for (const key of ['title', 'lead']) {
          assert(frame[key].every((n, i) => Math.abs(n - after[key][i]) < 1), `${name} ${width}: visible ${key} moved`);
        }
      }
      results.push({ name, width, initialHeight: before.height, finalHeight: after.height, visibleFrames: visible.length, stable: true });
      await page.close();
    }
    const fallback = await browser.newPage({ javaScriptEnabled: false });
    await fallback.goto('http://127.0.0.1:3001/hero-variants/nebula');
    await expect(fallback.locator('#hero-heading')).toBeVisible();
    assert.equal(await fallback.locator('#hero-heading').evaluate(el => getComputedStyle(el.parentElement).opacity), '1');
    await expect(fallback.locator('[data-hero-reveal]')).toHaveCSS('clip-path', 'none');
    await fallback.close();
  } finally { await browser.close(); }
}
await fs.writeFile('docs/visual/prototype-hero/loading-checks.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
