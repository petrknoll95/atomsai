import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit, expect } from '@playwright/test';
import sharp from 'sharp';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const output = path.resolve('docs/visual/header-motion');
await fs.mkdir(output, { recursive: true });
const report = { date: new Date().toISOString(), base, results: [] };
const trigger = (page, name) => name === 'site'
  ? page.getByRole('button', { name: 'Open site menu', exact: true })
  : page.locator(`[data-menu="${name}"] > summary`);
const panel = (page, name) => page.locator(`[data-menu="${name}"] [data-desktop-menu-slot] > div`);
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));

async function sample(page, name, duration) {
  await page.evaluate(({ name, duration }) => {
    window.__headerSamples = { complete: false, frames: [] };
    const start = performance.now();
    const take = () => {
      const menu = document.querySelector(`[data-menu="${name}"]`);
      const summary = menu.querySelector('summary');
      const slot = menu.querySelector('[data-desktop-menu-slot]');
      const content = slot?.firstElementChild;
      window.__headerSamples.frames.push({
        time: performance.now() - start,
        opacity: content ? Number(getComputedStyle(content).opacity) : 0,
        expanded: summary.getAttribute('aria-expanded'),
        inert: slot?.inert,
        emphasis: Number(getComputedStyle(summary).getPropertyValue('--menu-emphasis')),
      });
      if (performance.now() - start < duration) requestAnimationFrame(take);
      else window.__headerSamples.complete = true;
    };
    take();
  }, { name, duration });
}
async function finishSamples(page) {
  await page.waitForFunction(() => window.__headerSamples.complete);
  return page.evaluate(() => window.__headerSamples.frames);
}

for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const result = { engine: engineName, checks: [], errors: [], transitions: [] };
  report.results.push(result);
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, reducedMotion: 'no-preference' });
    page.on('pageerror', error => result.errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    for (const name of ['Applications', 'Infrastructure', 'Industries']) {
      const button = trigger(page, name);
      await sample(page, name, 550);
      await button.click();
      const opening = await finishSamples(page);
      assert(opening.some(value => value.opacity > 0 && value.opacity < 1), `${name} must have intermediate reveal frames.`);
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(panel(page, name)).toHaveCSS('opacity', '1');
      await sample(page, name, 450);
      await page.keyboard.press('Escape');
      const closing = await finishSamples(page);
      assert(closing.some(value => value.opacity > 0 && value.opacity < 1 && value.expanded === 'false' && value.inert), `${name} must animate out while already inert and collapsed for assistive technology.`);
      await expect(panel(page, name)).toHaveCount(0);
      await expect(button).toBeFocused();
      result.transitions.push({ name, opening, closing });
    }
    result.checks.push('All three desktop menus reveal/close through intermediate frames; closing content is inert and Escape restores focus.');

    const applications = trigger(page, 'Applications');
    await page.locator('h1').focus();
    await page.mouse.move(1, 1);
    await sample(page, 'Applications', 400);
    await applications.hover();
    const hover = await finishSamples(page);
    assert(hover.some(value => value.emphasis > 0 && value.emphasis < 1), 'Trigger hover must interpolate its background.');
    await expect(applications).toHaveAttribute('aria-expanded', 'false');
    result.checks.push('Trigger hover fades smoothly without opening the menu.');

    await applications.click();
    await page.waitForTimeout(40);
    await applications.dispatchEvent('click');
    await frame(page);
    const closingOpacity = await panel(page, 'Applications').evaluate(element => Number(getComputedStyle(element).opacity));
    await applications.dispatchEvent('click');
    await expect(panel(page, 'Applications')).toHaveCSS('opacity', '1');
    assert(closingOpacity > 0 && closingOpacity < 1, 'Rapid reopening must interrupt an in-flight exit.');
    await page.waitForTimeout(200);
    await expect(panel(page, 'Applications')).toBeVisible();
    await trigger(page, 'Infrastructure').click();
    await expect(panel(page, 'Applications')).toHaveCount(0);
    await expect(panel(page, 'Infrastructure')).toHaveCSS('opacity', '1');
    await page.locator('h1').click();
    await expect(panel(page, 'Infrastructure')).toHaveCount(0);
    result.checks.push('Rapid close/reopen and switching menus cannot leave stale panels; outside click dismisses.');

    await applications.press('Enter');
    await page.locator('[data-applications-panel] a').first().focus();
    await expect(page.locator('[data-product-preview="JustCall"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(applications).toBeFocused();
    await expect(panel(page, 'Applications')).toHaveCount(0);
    await applications.press('Enter');
    await expect(page.locator('[data-product-preview="ServiceAgent"]')).toBeVisible();
    result.checks.push('Keyboard product previews still work; a completed close resets the default preview on reopening.');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await frame(page);
    await expect(panel(page, 'Applications')).toHaveCSS('opacity', '1');
    await page.keyboard.press('Escape');
    await frame(page);
    await expect(panel(page, 'Applications')).toHaveCount(0);
    await applications.click();
    await frame(page);
    await expect(panel(page, 'Applications')).toHaveCSS('opacity', '1');
    const geometry = await panel(page, 'Applications').boundingBox();
    assert.deepEqual(geometry, { x: 204, y: 80, width: 736, height: 444 });
    result.geometry = geometry;
    await page.locator('[data-applications-panel] img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    const screenshot = path.join(output, `applications-${engineName}.png`);
    await panel(page, 'Applications').screenshot({ path: screenshot });
    const reference = await sharp('docs/visual/reference/header-dropdown.png').extract({ left: 33, top: 21, width: 736, height: 444 }).toColourspace('srgb').removeAlpha().raw().toBuffer();
    const actual = await sharp(screenshot).toColourspace('srgb').removeAlpha().raw().toBuffer();
    let sum = 0;
    const overlay = Buffer.alloc(actual.length);
    for (let i = 0; i < actual.length; i++) { sum += Math.abs(reference[i] - actual[i]); overlay[i] = Math.round((reference[i] + actual[i]) / 2); }
    result.meanAbsoluteChannelError = sum / actual.length;
    // The unchanged WebKit baseline is 2.045 against Figma (Chromium 1.382).
    // Check the browser baseline separately, so that tolerance cannot conceal a regression.
    assert(result.meanAbsoluteChannelError < 2.2, 'The settled dropdown must retain its original Figma appearance.');
    const baseline = await sharp(path.join(output, `baseline-${engineName}.png`)).toColourspace('srgb').removeAlpha().raw().toBuffer();
    let baselineError = 0;
    for (let i = 0; i < actual.length; i++) baselineError += Math.abs(baseline[i] - actual[i]);
    result.baselineMeanAbsoluteChannelError = baselineError / actual.length;
    assert(result.baselineMeanAbsoluteChannelError < 0.05, 'The settled panel must preserve its pre-animation browser appearance.');
    await sharp(overlay, { raw: { width: 736, height: 444, channels: 3 } }).png().toFile(path.join(output, `applications-${engineName}-overlay.png`));
    result.checks.push('Reduced motion settles instantly; the final panel retains original 736 × 444 geometry and matches the Figma comparison tolerance.');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await applications.click();
    await page.waitForTimeout(35);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await frame(page);
    await expect(panel(page, 'Applications')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await applications.click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(panel(page, 'Applications')).toHaveCount(0);
    await trigger(page, 'site').click();
    await expect(page.getByRole('navigation', { name: 'Site menu' })).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    result.checks.push('Changing motion preference during exit and resizing to mobile finishes safely; the full-screen menu opens without overflow.');
    await page.close();
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    await browser.close();
  }
}
await fs.writeFile(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.results.map(result => ({ engine: result.engine, checks: result.checks, errors: result.errors, geometry: result.geometry, meanAbsoluteChannelError: result.meanAbsoluteChannelError, baselineMeanAbsoluteChannelError: result.baselineMeanAbsoluteChannelError })), null, 2));
if (report.results.some(result => result.errors.length)) process.exitCode = 1;
