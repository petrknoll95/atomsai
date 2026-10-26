import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';
const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const out = 'docs/patterns/homepage-motion';
await fs.mkdir(out, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  if (process.env.HOME_MOTION_BROWSER && process.env.HOME_MOTION_BROWSER !== name) continue;
  const browser = await engine.launch();
  for (const width of [1600, 390]) {
    if (process.env.HOME_MOTION_WIDTH && Number(process.env.HOME_MOTION_WIDTH) !== width) continue;
    let page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'no-preference' });
    const result = { name, width, placements: [], errors: [] }; results.push(result);
    page.on('pageerror', error => result.errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      const canvases = page.locator('[data-home-pattern] canvas');
      assert.equal(await canvases.count(), 11);
      for (let i = 0; i < await canvases.count(); i++) {
        const canvas = canvases.nth(i);
        const bounds = await canvas.boundingBox();
        if (!bounds?.width || !bounds?.height) continue;
        const application = await canvas.evaluate(c => c.closest('[data-home-pattern]').dataset.homePattern);
        const kind = await canvas.getAttribute('data-pattern');
        await expect(canvas).toHaveAttribute('data-motion', kind === 'concentric' ? 'ripple' : 'tide');
        await canvas.scrollIntoViewIfNeeded();
        await expect(canvas).toHaveAttribute('data-render-state', 'ready');
        const card = page.locator('[data-application]').filter({ has: page.locator(`[data-home-pattern="${application}"]`) });
        if (application.startsWith('applications-')) {
          await page.mouse.move(0, 0);
          await expect(canvas).toHaveAttribute('data-playback', 'paused');
          const held = await canvas.getAttribute('data-motion-frames');
          await page.waitForTimeout(150);
          assert.equal(await canvas.getAttribute('data-motion-frames'), held, 'Hidden hover artwork must not redraw');
          await card.hover({ position: { x: bounds.width / 2, y: bounds.height / 2 } });
        }
        await expect(canvas).toHaveAttribute('data-playback', 'playing');
        const before = await canvas.getAttribute('data-motion-frames');
        const phase = await canvas.getAttribute('data-phase');
        await expect.poll(async () => Number(await canvas.getAttribute('data-motion-frames'))).toBeGreaterThan(Number(before));
        await expect.poll(async () => await canvas.getAttribute('data-phase')).not.toBe(phase);
        result.placements.push({ application, motion: await canvas.getAttribute('data-motion'), animates: true });
        if (application === 'applications-concentric') {
          await page.waitForTimeout(500);
          await page.locator('#applications').screenshot({ path: `${out}/${name}-${width}-applications.png` });
        }
        if (application.startsWith('applications-')) {
          await card.locator('a').evaluate(el => el.blur());
          await page.mouse.move(0, 0);
          await expect(canvas).toHaveAttribute('data-playback', 'paused');
        }
      }
      // Start lifecycle checks on a fresh document: Playwright's full-section
      // screenshots scroll transformed content independently of ScrollSmoother.
      await page.close();
      page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'no-preference' });
      page.on('pageerror', error => result.errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      const cta = page.locator('[data-home-pattern="cta-pattern"] canvas');
      await cta.evaluate(c => window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - 250, behavior: 'instant' }));
      await expect(cta).toHaveAttribute('data-playback', 'playing');
      await page.waitForTimeout(1200); // Finish the native scroll / smooth-scroll synchronization before navigating again.
      const drift = page.locator('[data-home-pattern="offerings-drift"] canvas');
      await expect.poll(async () => drift.evaluate(c => c.getBoundingClientRect().bottom)).toBeLessThan(0);
      await expect(drift).toHaveAttribute('data-playback', 'paused');
      const held = await drift.getAttribute('data-motion-frames');
      await page.waitForTimeout(200);
      assert.equal(await drift.getAttribute('data-motion-frames'), held);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(cta).toHaveAttribute('data-playback', 'reduced');
      await page.waitForTimeout(200); // Allow the scrolling-mode resize to settle.
      const frozen = await cta.getAttribute('data-motion-frames');
      await page.waitForTimeout(200);
      assert.equal(await cta.getAttribute('data-motion-frames'), frozen);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    } catch (error) { result.errors.push(error.stack); }
    await page.close();
    console.log(name, width, result.errors.length ? result.errors : 'passed');
  }
  await browser.close();
}
if (process.env.HOME_MOTION_BROWSER || process.env.HOME_MOTION_WIDTH) {
  const previous = await fs.readFile(`${out}/results.json`, 'utf8').then(JSON.parse).catch(() => ({ results: [] }));
  results.push(...previous.results.filter(old => !results.some(current => current.name === old.name && current.width === old.width)));
}
await fs.writeFile(`${out}/results.json`, JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
if (results.some(r => r.errors.length)) process.exitCode = 1;
