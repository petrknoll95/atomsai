import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';
const url = process.env.VISUAL_URL || 'http://localhost:3001/';
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [1600, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url, { waitUntil: 'networkidle' });
      const root = page.locator('[data-application-workflow]');
      const scene = index => root.locator(`[data-application-scene="${index}"]`);
      await scene(0).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
      for (const index of [1, 2, 3, 0]) {
        await root.locator(`#application-trigger-${index}`).evaluate(el => el.click());
        await expect(scene(index)).toHaveAttribute('data-active', 'true');
        const specs = await scene(index).evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.id.startsWith('application-')).map(a => ({ delay: a.effect.getTiming().delay, duration: a.effect.getTiming().duration, easing: a.effect.getTiming().easing })));
        assert(specs.length >= 6, `${name} ${index}: custom parts are animated`);
        assert(specs.some(s => s.delay > 0));
        assert(specs.every(s => s.easing === 'cubic-bezier(0.16, 1, 0.3, 1)'));
        if (index === 2) assert.deepEqual(specs.slice(0, 3).map(s => s.delay), [0, 130, 260]);
        // Freeze the actual component animations at repeatable points for review.
        for (const time of [180, 500, 1500]) {
          await scene(index).evaluate((el, t) => el.getAnimations({ subtree: true }).filter(a => a.id.startsWith('application-')).forEach(a => { a.pause(); a.currentTime = t; }), time);
          await scene(index).screenshot({ path: `docs/visual/application-reveals/${name}-${width}-${index}-${time}.png` });
        }
        await scene(index).evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.id.startsWith('application-')).forEach(a => a.play()));
        await page.waitForTimeout(100);
      }
      // Rapid switching must cancel old motion without leaving partial transforms.
      await root.evaluate(el => [2, 1, 3, 0, 2].forEach((i, step) => setTimeout(() => el.querySelector(`#application-trigger-${i}`).click(), step * 35)));
      await page.waitForTimeout(1800);
      await expect(scene(2)).toHaveAttribute('data-active', 'true');
      assert.equal(await root.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.id.startsWith('application-')).length), 0);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const index of [0, 1, 2, 3]) {
        await root.locator(`#application-trigger-${index}`).evaluate(el => el.click());
        assert.equal(await root.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.id.startsWith('application-')).length), 0);
        await expect(scene(index)).toHaveCSS('opacity', '1');
      }
      assert.deepEqual(errors, []);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      console.log(`${name} ${width}: four sequences, stagger, interruption, settled cleanup, reduced motion and no overflow passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
