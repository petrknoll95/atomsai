import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const output = 'docs/visual/stories';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  if (process.env.BROWSER && process.env.BROWSER !== name) continue;
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/#customer-stories`);
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
  const section = page.locator('#customer-stories');
  const dots = section.getByRole('button', { name: /^Go to story/ });
  const selected = () => section.locator('button[aria-label^="Go to story"]').evaluateAll(elements => elements.findIndex(element => element.getAttribute('aria-current') === 'true'));
  const progress = () => dots.locator('[class*="fill"]').evaluateAll(elements => elements.map(element => Number(getComputedStyle(element).transform.match(/matrix\(([^,]+)/)?.[1] ?? 0)));
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await dots.nth(2).evaluate(el => el.click());
  await page.mouse.move(0, 0);
  await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
  await expect.poll(async () => (await progress())[2]).toBeGreaterThan(.15);
  const firstProgress = (await progress())[2];
  await page.waitForTimeout(900);
  assert((await progress())[2] > firstProgress + .08, 'Progress must fill over time.');
  // An element screenshot can scroll ScrollSmoother's transformed wrapper
  // independently of the document. Capture the viewport without that side effect.
  await page.screenshot({ path: `${output}/${name}-progress.png` });
  await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true', { timeout: 9000 });
  await expect.poll(async () => (await progress())[3]).toBeGreaterThan(.03);
  assert((await progress())[2] === 0, 'The previous line must reset after advancing.');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true', { timeout: 9000 });
  await page.waitForTimeout(400);
  await section.locator('[data-story-playback]').focus();
  await section.locator('[data-story-portraits]').hover({ position: { x: 50, y: 80 } });
  const hovered = (await progress())[0];
  await page.waitForTimeout(600);
  assert((await progress())[0] > hovered + .05, 'Hover must not pause or reset progress.');
  const portrait = section.locator('[data-story-portraits]');
  const dragBox = await portrait.boundingBox();
  await page.mouse.move(dragBox.x + dragBox.width * .8, dragBox.y + dragBox.height * .5);
  await page.mouse.down();
  const held = Math.max(...await progress());
  await page.waitForTimeout(600);
  assert(Math.max(...await progress()) > held + .05, 'Holding a drag must not pause progress.');
  await page.mouse.move(dragBox.x + dragBox.width * .1, dragBox.y + dragBox.height * .5, { steps: 12 });
  await page.mouse.up();
  const released = Math.max(...await progress());
  assert(released < .15, 'Dragging to another slide must reset the clock.');
  for (const control of ['Next customer story', 'Previous customer story']) {
    await expect.poll(async () => Math.max(...await progress())).toBeGreaterThan(.15);
    await section.getByRole('button', { name: control, exact: true }).evaluate(el => el.click());
    assert(Math.max(...await progress()) < .08, `${control} must reset progress.`);
  }
  await expect.poll(async () => Math.max(...await progress())).toBeGreaterThan(.15);
  await dots.nth(3).evaluate(el => el.click());
  assert((await progress())[3] < .08, 'Pagination must reset progress.');
  await page.waitForTimeout(6000);
  await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true', { timeout: 2500 });
  await dots.nth(1).click();
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
  assert((await progress())[1] < .08, 'Clicking a new line must restart the clock.');
  await dots.nth(2).focus();
  const focused = (await progress())[1];
  await page.waitForTimeout(500);
  assert((await progress())[1] > focused + .04, 'Keyboard focus must not pause progress.');
  await expect(section.getByRole('button', { name: 'Pause customer stories' })).toBeVisible();
  // Let the site's focus scrolling position controls before pointer-down.
  await section.getByRole('button', { name: 'Pause customer stories' }).focus();
  await section.getByRole('button', { name: 'Pause customer stories' }).click();
  await expect(section.getByRole('button', { name: 'Play customer stories' })).toBeVisible();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const paused = await progress();
  await page.waitForTimeout(500);
  assert.deepEqual(await progress(), paused);
  await dots.nth(2).evaluate(el => el.click());
  await dots.nth(1).evaluate(el => el.click());
  assert((await progress()).every(value => value === 0), 'Navigation while paused must clear progress.');
  await page.waitForTimeout(300);
  assert((await progress()).every(value => value === 0), 'Navigation must not resume paused autoplay.');
  await section.getByRole('button', { name: 'Play customer stories' }).focus();
  await section.getByRole('button', { name: 'Play customer stories' }).click();
  await expect(section.getByRole('button', { name: 'Pause customer stories' })).toBeVisible();
  await expect.poll(async () => (await progress())[1]).toBeGreaterThan(.05);
  await dots.nth(3).press('Enter');
  await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true');
  assert.equal(await section.getByRole('button', { name: 'Read Story', exact: true }).count(), 1, 'Only the active story is exposed to assistive technology.');
  await section.getByRole('button', { name: 'Read Story', exact: true }).focus();
  await section.getByRole('button', { name: 'Read Story', exact: true }).click();
  await expect(section.getByRole('dialog')).toBeVisible();
  // Rotation continues even while the modal is open. Close returns focus to
  // the current slide, since the original trigger may have moved offscreen.
  const modalSelection = await selected();
  await expect.poll(selected, { timeout: 9000 }).toBe((modalSelection + 1) % 4);
  await page.keyboard.press('Escape');
  await expect(section.getByRole('button', { name: 'Read Story', exact: true })).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(0, 0);
  for (const width of [1200, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `Overflow at ${width}` }).toBe(true);
    assert.equal(await section.getByRole('button', { name: /^(Play|Pause) customer stories$/ }).count(), 0, 'Reduced motion disables the autoplay control.');
    if (width === 390) {
      await section.screenshot({ path: `${output}/${name}-390.png` });
      const portrait = section.locator('[data-story-portraits]');
      await portrait.scrollIntoViewIfNeeded();
      const box = await portrait.boundingBox();
      await page.mouse.move(box.x + box.width * .85, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .15, box.y + box.height * .5, { steps: 15 });
      await page.mouse.up();
      await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
    }
  }
  const reducedSelected = await selected();
  await page.waitForTimeout(7500);
  assert.equal(await selected(), reducedSelected, 'Reduced motion must not automatically change slides.');
  assert.deepEqual(errors, []);
  results.push({ browser: name, passed: true, checks: ['timer-linked line fill', 'automatic next slide', 'last-to-first loop', 'hover does not interrupt', 'drag hold continues, slide change resets', 'arrows and pagination reset timer and progress', 'new slide gets full seven-second interval', 'navigation preserves explicit pause', 'explicit pause/play control', 'focus does not interrupt', 'autoplay continues behind the story dialog', 'inactive slide inertness', 'dialog focus restoration', 'reduced motion', '1200/768/390/320px overflow', 'horizontal drag at 390px'], errors });
  await browser.close();
  console.log(`${name}: passed`);
}
await fs.writeFile(`${output}/checks.json`, JSON.stringify({ base, date: new Date().toISOString(), delay: 7000, results }, null, 2) + '\n');
