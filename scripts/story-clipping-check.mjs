import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const output = 'docs/visual/story-clipping';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/#customer-stories`);
    await page.evaluate(() => document.fonts.ready);
    const viewport = page.locator('#customer-story-content');
    const widths = [];
    for (const width of [320, 360, 390, 767, 768, 1024, 1199, 1200, 1600]) {
      await page.setViewportSize({ width, height: 960 });
      await expect.poll(() => viewport.evaluate(el => Math.abs(el.querySelector('[aria-hidden="false"]').getBoundingClientRect().left - el.getBoundingClientRect().left - 20))).toBeLessThan(.6);
      const geometry = await viewport.evaluate(el => {
        const clip = el.getBoundingClientRect();
        const slide = el.querySelector('[aria-hidden="false"]');
        const button = slide.querySelector('button');
        const b = button.getBoundingClientRect();
        const row = button.parentElement.getBoundingClientRect();
        const logo = button.parentElement.querySelector('img').getBoundingClientRect();
        return { buttonOverflow: b.right - row.right, logoOverlap: logo.right - b.left, paintRoom: clip.right - b.right, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(geometry.buttonOverflow < .6, `${name} ${width}: button overflows row`);
      assert(geometry.logoOverlap < -10, `${name} ${width}: logo overlaps button`);
      assert(geometry.paintRoom >= 19, `${name} ${width}: insufficient focus paint area`);
      assert(!geometry.overflow);
      widths.push({ width, ...geometry });
      if ([320, 768].includes(width)) {
        await viewport.locator('[aria-hidden="false"] button').focus();
        await page.locator('#customer-stories').screenshot({ path: `${output}/${name}-${width}.png`, style: 'header, .skip-link { visibility: hidden !important; }' });
      }
    }
    // The lowest result card moves 16px down at reveal start. Its entire
    // visible bounds must remain within the expanded painting viewport.
    await page.setViewportSize({ width: 390, height: 960 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Pause customer stories' }).evaluate(el => el.click());
    const frames = await viewport.evaluate(async viewport => {
      document.querySelector('[aria-label="Go to story 2"]').click();
      const frames = [], start = performance.now();
      while (performance.now() - start < 1200) {
        await new Promise(requestAnimationFrame);
        const v = viewport.getBoundingClientRect();
        const objects = [...viewport.querySelectorAll('[aria-hidden="false"] [data-story-reveal]')];
        frames.push(objects.filter(el => Number(getComputedStyle(el).opacity) > .05).map(el => {
          const r = el.getBoundingClientRect();
          return { right: v.right - r.right, bottom: v.bottom - r.bottom, left: r.left - v.left, top: r.top - v.top };
        }));
      }
      return frames;
    });
    assert(frames.flat().every(r => Object.values(r).every(gap => gap >= -.6)), `${name}: a revealed object is clipped`);
    assert.deepEqual(errors, []);
    results.push({ browser: name, widths, transitionFrames: frames.length, noTransitionClipping: true, errors });
    console.log(`${name}: button fits, focus has room, transitions unclipped, no overflow at nine widths`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ base, results }, null, 2) + '\n');
