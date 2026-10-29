import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const output = 'docs/visual/story-transition';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 960 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/#customer-stories`);
    const section = page.locator('#customer-stories');
    await section.getByRole('button', { name: 'Pause customer stories' }).evaluate(el => el.click());
    const slides = section.locator('[aria-roledescription="slide"]');
    const dots = section.getByRole('button', { name: /^Go to story/ });
    await dots.nth(0).evaluate(el => el.click());
    await expect(slides.nth(0)).toHaveCSS('opacity', '1');
    await page.waitForTimeout(1100);
    // Sample actual rendered frames, including geometry, while changing slides.
    const frames = await section.evaluate(async section => {
      const slides = [...section.querySelectorAll('[aria-roledescription="slide"]')];
      const frames = [];
      section.querySelector('[aria-label="Go to story 2"]').click();
      const start = performance.now();
      while (performance.now() - start < 1200) {
        await new Promise(requestAnimationFrame);
        frames.push({
          time: performance.now() - start,
          slides: slides.map(slide => ({ opacity: Number(getComputedStyle(slide).opacity), x: slide.getBoundingClientRect().x })),
          objects: [...slides[1].querySelectorAll('[data-story-reveal]')].map(el => ({
            opacity: Number(getComputedStyle(el).opacity),
            y: new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
          })),
        });
      }
      return frames;
    });
    const overlap = frames.filter(f => f.slides[0].opacity > .05 && f.slides[1].opacity > .05);
    assert(overlap.length > 1, 'Both stories must be visible during the cross-fade.');
    assert(overlap.every(f => Math.abs(f.slides[0].x - f.slides[1].x) < .5), 'Slides must overlap without sideways travel.');
    assert(frames.some(f => f.objects[0].opacity > .2 && f.objects.at(-1).opacity < .1), 'Objects must reveal in sequence.');
    assert(frames.some(f => f.objects.some(o => o.y > 1 && o.y < 16)), 'Object reveals must interpolate vertically.');
    await expect(slides.nth(1)).toHaveCSS('opacity', '1');
    await expect(slides.nth(1).locator('[data-story-reveal]').last()).toHaveCSS('opacity', '1');
    await section.screenshot({ path: `${output}/${name}-settled.png` });
    for (const index of [3, 0, 2, 1, 3]) {
      await dots.nth(index).evaluate(el => el.click());
      await page.waitForTimeout(70);
    }
    await expect(slides.nth(3)).toHaveCSS('opacity', '1');
    await expect(slides.nth(3).locator('[data-story-reveal]').last()).toHaveCSS('opacity', '1');
    assert.equal(await section.getByRole('button', { name: 'Read Story', exact: true }).count(), 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await dots.nth(0).evaluate(el => el.click());
    await expect(slides.nth(0)).toHaveCSS('opacity', '1');
    const reduced = await slides.nth(0).locator('[data-story-reveal]').evaluateAll(els => els.map(el => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform })));
    assert(reduced.every(o => o.opacity === '1' && o.transform === 'none'), 'Reduced motion must reveal everything immediately.');
    await page.setViewportSize({ width: 390, height: 844 });
    await dots.nth(1).evaluate(el => el.click());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    results.push({ browser: name, overlapFrames: overlap.length, passed: true, reduced, frames, errors });
    console.log(`${name}: cross-fade, fixed slide position, staggered reveals, rapid navigation, reduced motion and mobile overflow passed`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ base, results }, null, 2) + '\n');
