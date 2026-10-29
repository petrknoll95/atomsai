import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const output = 'docs/visual/story-slits';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  if (process.env.BROWSER && process.env.BROWSER !== name) continue;
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 960 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/#customer-stories`);
    const section = page.locator('#customer-stories');
    const portraits = section.locator('[data-story-portraits]');
    const dots = section.getByRole('button', { name: /^Go to story/ });
    const selected = () => dots.evaluateAll(els => els.findIndex(el => el.getAttribute('aria-current') === 'true'));
    const aligned = async index => {
      await expect(portraits).toHaveAttribute('data-portrait-index', String(index));
      await expect(portraits).toHaveAttribute('data-slit-transition', 'idle');
      const source = ['stories-Media', 'abigail-boone', 'brauer', 'ageing-better'][index];
      await expect(portraits.locator('[data-portrait-still] img')).toHaveAttribute('src', new RegExp(source));
      await expect.poll(() => portraits.locator('[data-portrait-still] img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    };
    await aligned(0);
    await section.getByRole('button', { name: 'Pause customer stories' }).evaluate(el => el.click());
    await expect(section.getByRole('button', { name: 'Play customer stories' })).toBeVisible();
    const frames = await section.evaluate(async section => {
      const viewport = section.querySelector('[data-story-portraits]');
      const strips = [...viewport.querySelectorAll('[data-slit-layer="incoming"] [data-portrait-slit]')];
      const slides = [...section.querySelectorAll('[aria-roledescription="slide"]')];
      const frames = [];
      section.querySelector('[aria-label="Go to story 4"]').click();
      const start = performance.now();
      while (performance.now() - start < 1400) {
        await new Promise(requestAnimationFrame);
        const box = viewport.getBoundingClientRect();
        frames.push({ time: performance.now() - start, width: box.width, height: box.height,
          clips: strips.map(el => getComputedStyle(el).clipPath),
          transforms: strips.map(el => getComputedStyle(el.querySelector('picture')).transform),
          opacity: strips.map(el => getComputedStyle(el).opacity),
          viewportOpacity: getComputedStyle(viewport).opacity,
          contentOpacity: slides.map(el => Number(getComputedStyle(el).opacity)),
        });
      }
      return frames;
    });
    assert(frames.every(f => f.clips.length === 8), 'Eight incoming slit masks');
    assert(frames.every(f => new Set(f.clips.slice(0,4)).size === 1 && new Set(f.clips.slice(4)).size === 1), 'All slit masks must animate in sync');
    assert(frames.some(f => f.clips[0] !== f.clips[7]), 'Masks must open in mirrored center-out directions');
    const moving = frames.find(f => f.transforms.every(t => t.startsWith('matrix(')));
    const x = moving.transforms.map(t => Number(t.slice(7,-1).split(',')[4]));
    assert(x[0] > 0 && x[7] < 0 && Math.abs(x[0]+x[7]) < .1, 'Incoming offsets must start symmetrically towards the center');
    assert(frames.some(f => f.transforms.some(t => t !== 'none' && Number(t.match(/matrix\(([^,]+)/)?.[1] || 1) > 1.01)), 'Incoming image must scale during reveal');
    assert(frames.every(f => f.viewportOpacity === '1' && f.opacity.every(o => o === '1')), 'Portraits must remain opaque.');
    assert(frames.every(f => f.width === frames[0].width && f.height === frames[0].height), 'Image frame must stay fixed.');
    assert(frames.some(f => f.contentOpacity[0] > .1 && f.contentOpacity[3] > .1), 'Story content must still cross-fade.');
    await aligned(3);
    // Forward and reverse loop boundaries, then interrupted pagination.
    for (const index of [0, 3]) { await dots.nth(index).evaluate(el => el.click()); await aligned(index); }
    for (const index of [1, 3, 0, 2]) { await dots.nth(index).evaluate(el => el.click()); await page.waitForTimeout(70); }
    await expect.poll(selected).toBe(2);
    await aligned(2);
    await portraits.scrollIntoViewIfNeeded();
    const box = await portraits.boundingBox();
    await page.mouse.move(box.x + box.width * .85, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .15, box.y + box.height * .5, { steps: 15 });
    await page.mouse.up();
    await expect.poll(selected).toBe(3);
    await aligned(3);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const widths = [];
    for (const width of [1600, 1200, 1199, 1024, 768, 767, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      await dots.nth(1).evaluate(el => el.click());
      await aligned(1);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const geometry = await section.evaluate(section => {
        const actual = section.querySelector('[data-story-portraits]').getBoundingClientRect();
        const reserved = section.querySelector('[aria-hidden="false"] [data-portrait-slot]').getBoundingClientRect();
        return { differences: ['x', 'y', 'width', 'height'].map(key => Math.abs(actual[key] - reserved[key])), overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(geometry.differences.every(d => d < .6), `${name}: portrait alignment at ${width}: ${JSON.stringify(geometry)}`);
      assert(!geometry.overflow, `Page overflow at ${width}: ${JSON.stringify(geometry)}`);
      if ([1024, 390].includes(width)) await section.screenshot({ path: `${output}/${name}-${width}.png`, style: 'header, .skip-link { visibility: hidden !important; }' });
      widths.push({ width, ...geometry });
    }
    assert.deepEqual(errors, []);
    results.push({ browser: name, frames, widths, swiping: true, loops: true, rapidNavigation: true, errors });
    console.log(`${name}: eight-column slit reveals, content fade, sync, loops, swipe, reduced motion and responsive alignment passed`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ base, results }, null, 2) + '\n');
