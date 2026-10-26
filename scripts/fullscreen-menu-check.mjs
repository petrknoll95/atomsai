import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit, expect } from '@playwright/test';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const output = path.resolve('docs/visual/fullscreen-menu');
const viewports = [
  { width: 1600, height: 960 }, { width: 768, height: 960 },
  { width: 390, height: 844 }, { width: 320, height: 568 },
  { width: 568, height: 320 },
];
const report = { date: new Date().toISOString(), base, results: [], errors: [] };
const originalDestinations = [
  '#applications', 'https://pyai.com/', '#offerings', '#industries',
  'https://atomsai.com/company/about', 'https://atomsai.com/company/contact',
];
const productDestinations = ['https://justcall.io/', 'https://helpwise.io/', 'https://serviceagent.ai/', 'https://www.callpage.io/'];
await fs.mkdir(output, { recursive: true });

// The native modal makes the background trigger inert, but its expanded state
// and focus restoration still need to be inspected while the dialog is open.
const openButton = page => page.getByRole('button', { name: 'Open site menu', exact: true, includeHidden: true });
const menu = page => page.getByRole('dialog', { name: 'Site menu', exact: true, includeHidden: true });
const navigation = page => menu(page).getByRole('navigation', { name: 'Site menu', exact: true });
async function frames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function scrollState(page) {
  return page.evaluate(() => ({
    x: scrollX, y: scrollY, rootOverflow: getComputedStyle(document.documentElement).overflow,
    bodyOverflow: getComputedStyle(document.body).overflow, bodyPosition: getComputedStyle(document.body).position,
  }));
}
async function geometry(page) {
  return menu(page).evaluate(dialog => ({
    native: dialog instanceof HTMLDialogElement, modal: dialog.matches(':modal'),
    rect: dialog.getBoundingClientRect().toJSON(), viewport: { width: innerWidth, height: innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    focusedInside: dialog.contains(document.activeElement), opacity: Number(getComputedStyle(dialog).opacity),
  }));
}
async function fullViewport(page) {
  const value = await geometry(page);
  assert(value.native && value.modal, 'The site menu must be a native modal dialog.');
  for (const [dimension, expected] of [['x', 0], ['y', 0], ['width', value.viewport.width], ['height', value.viewport.height]]) {
    assert(Math.abs(value.rect[dimension] - expected) <= 1, `Menu ${dimension} should be ${expected}, received ${value.rect[dimension]}.`);
  }
  assert(value.scrollWidth <= value.viewport.width, 'The menu must not cause page-width overflow.');
  return value;
}
async function open(page) {
  await openButton(page).press('Enter');
  await expect(menu(page)).toBeVisible();
  await expect(openButton(page)).toHaveAttribute('aria-expanded', 'true');
  await frames(page);
  assert.equal(await menu(page).getAttribute('data-menu-state'), 'open', 'Reduced motion should settle within two frames.');
  assert.equal(await menu(page).evaluate(dialog => dialog.scrollTop), 0, 'Every menu opening must reset its internal scroll position.');
}
async function closed(page, restoreFocus = true) {
  await frames(page);
  assert.equal(await menu(page).evaluate(dialog => dialog.open), false, 'The completed close must dismiss the native modal.');
  await expect(menu(page)).toBeHidden();
  await expect(openButton(page)).toHaveAttribute('aria-expanded', 'false');
  if (restoreFocus) await expect(openButton(page)).toBeFocused();
}
async function checkFocusBoundaries(page, nextKey, previousKey) {
  const dialog = menu(page);
  const controls = dialog.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]').filter({ visible: true });
  assert(await controls.count() >= 11, 'The menu must provide a close control, six original destinations, and four product links.');
  await controls.last().focus();
  await page.keyboard.press(nextKey);
  await expect(controls.first()).toBeFocused();
  await expect(controls.first()).toBeInViewport({ ratio: 1 });
  await page.keyboard.press(previousKey);
  await expect(controls.last()).toBeFocused();
  await expect(controls.last()).toBeInViewport({ ratio: 1 });
  for (let index = 0; index < await controls.count() + 1; index++) {
    await page.keyboard.press(nextKey);
    await frames(page);
    assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Keyboard focus escaped the native modal.');
    const focus = await dialog.evaluate(() => {
      const element = document.activeElement;
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return { name: element.getAttribute('aria-label') || element.textContent.trim(), rect: rect.toJSON(), unobscured: !!hit && (element === hit || element.contains(hit)) };
    });
    assert(focus.unobscured, `Focused control is obscured or outside the viewport: ${JSON.stringify(focus)}`);
  }
  const backgroundFocused = await openButton(page).evaluate(button => { button.focus(); return document.activeElement === button; });
  assert.equal(backgroundFocused, false, 'A background control must be inert while the modal is open.');
  assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'Rejected background focus must leave focus inside the menu.');
}

async function startMotionSamples(page, duration) {
  await page.evaluate(milliseconds => {
    window.__fullscreenMenuSamples = { done: false, values: [] };
    const start = performance.now();
    const take = () => {
      const dialog = document.querySelector('dialog[aria-label="Site menu"]');
      window.__fullscreenMenuSamples.values.push({
        time: performance.now() - start, open: dialog.open, modal: dialog.matches(':modal'),
        state: dialog.dataset.menuState, opacity: Number(getComputedStyle(dialog).opacity),
        expanded: document.querySelector('button[data-menu="site"]').getAttribute('aria-expanded'),
      });
      if (performance.now() - start < milliseconds) requestAnimationFrame(take);
      else window.__fullscreenMenuSamples.done = true;
    };
    take();
  }, duration);
}
async function finishMotionSamples(page) {
  await page.waitForFunction(() => window.__fullscreenMenuSamples.done);
  return page.evaluate(() => window.__fullscreenMenuSamples.values);
}

for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const macWebKit = engineName === 'webkit' && process.platform === 'darwin';
  const nextKey = macWebKit ? 'Alt+Tab' : 'Tab';
  const previousKey = macWebKit ? 'Alt+Shift+Tab' : 'Shift+Tab';
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      page.setDefaultTimeout(15_000);
      const result = { engine: engineName, viewport, keyboardNavigation: nextKey, checks: [], errors: [] };
      report.results.push(result);
      page.on('pageerror', error => result.errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
      page.on('requestfailed', request => result.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
      try {
        await page.goto(base, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await expect(openButton(page)).toBeVisible();
        await expect(openButton(page)).toHaveAttribute('aria-expanded', 'false');
        const controlsId = await openButton(page).getAttribute('aria-controls');
        assert(controlsId, 'The trigger must identify the menu it controls.');
        const before = await scrollState(page);

        await open(page);
        await expect(menu(page)).toHaveAttribute('id', controlsId);
        result.geometry = await fullViewport(page);
        result.topbarHeight = await menu(page).getByRole('button', { name: 'Close site menu', exact: true }).evaluate(button => button.parentElement.getBoundingClientRect().height);
        assert(Math.abs(result.topbarHeight - (viewport.width < 768 ? 80 : 96)) <= .5, 'The menu top bar must preserve the desktop/mobile header height.');
        assert(result.geometry.focusedInside, 'Opening the menu must move focus into the dialog.');
        await expect(navigation(page).getByRole('link')).toHaveCount(10);
        result.links = await navigation(page).getByRole('link').evaluateAll(links => links.map(link => ({ name: link.textContent.trim(), href: link.getAttribute('href') })));
        assert.deepEqual(result.links.map(link => link.href).filter(href => originalDestinations.includes(href)), originalDestinations, 'The menu must preserve the original six destinations and their order.');
        assert.deepEqual(result.links.map(link => link.href).filter(href => productDestinations.includes(href)), productDestinations, 'The supporting links must retain all four original product destinations.');
        await expect(navigation(page).getByRole('link', { name: 'Applications', exact: true })).toHaveAttribute('href', '#applications');
        result.checks.push('Reduced motion opens the full-viewport native modal immediately, preserving six original destinations and four product links');

        await checkFocusBoundaries(page, nextKey, previousKey);
        result.checks.push('Forward/reverse keyboard boundaries remain inside the menu; background controls reject focus');
        result.locked = await scrollState(page);
        assert(/hidden|clip/.test(result.locked.rootOverflow + result.locked.bodyOverflow) || result.locked.bodyPosition === 'fixed', 'Opening the modal must lock background scrolling.');
        await page.mouse.move(viewport.width - 12, Math.floor(viewport.height / 2));
        await page.mouse.wheel(0, 800); await frames(page);
        const afterWheel = await scrollState(page);
        assert.equal(afterWheel.y, result.locked.y, 'Wheel input must not scroll the background document.');
        // On a short viewport the menu may scroll internally; every link still
        // needs to be reachable without expanding the page horizontally.
        for (const link of await navigation(page).getByRole('link').all()) {
          await link.scrollIntoViewIfNeeded(); await expect(link).toBeInViewport();
        }
        result.checks.push('Background scrolling is locked; every menu link remains reachable, including in short landscape');

        await page.keyboard.press('Escape'); await closed(page);
        const afterEscape = await scrollState(page);
        assert.deepEqual(afterEscape, before, 'Escape must restore the original scroll position and scroll styles.');
        await open(page);
        await menu(page).getByRole('button', { name: 'Close site menu', exact: true }).click();
        await closed(page);
        assert.deepEqual(await scrollState(page), before, 'The close control must restore the original scroll state.');
        result.checks.push('Escape and the close control restore the trigger focus and original scroll state');

        await open(page);
        if ([1600, 390, 320].includes(viewport.width)) {
          result.screenshotScrollTop = await menu(page).evaluate(dialog => dialog.scrollTop);
          assert.equal(result.screenshotScrollTop, 0, 'Initial-state captures must begin at the top of the menu.');
          const firstLinkTop = await navigation(page).getByRole('link').first().evaluate(link => link.getBoundingClientRect().top);
          assert(firstLinkTop >= result.topbarHeight, 'Applications must appear below the sticky top bar in initial-state captures.');
          await page.mouse.move(1, 1); await frames(page);
          result.screenshot = `menu-${engineName}-${viewport.width}x${viewport.height}.png`;
          await page.screenshot({ path: path.join(output, result.screenshot), animations: 'disabled' });
        }
        if (viewport.width === 1600) {
          result.resizes = [];
          for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, viewport]) {
            await page.setViewportSize(size); await frames(page);
            await expect(openButton(page)).toHaveAttribute('aria-expanded', 'true');
            result.resizes.push(await fullViewport(page));
          }
          result.checks.push('The open menu survives narrow and landscape resizes while filling the new viewport');
        }
        await navigation(page).getByRole('link', { name: 'Applications', exact: true }).click();
        await closed(page, false);
        await expect(page.locator('#applications-title')).toBeFocused();
        await expect(page.locator('#applications-title')).toBeInViewport();
        const navigated = await scrollState(page);
        assert.equal(navigated.rootOverflow, before.rootOverflow);
        assert.equal(navigated.bodyOverflow, before.bodyOverflow);
        assert.equal(navigated.bodyPosition, before.bodyPosition);
        result.checks.push('Applications navigation closes the menu, unlocks scrolling, and focuses the destination heading');
        if (viewport.width === 1600) {
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
          await page.emulateMedia({ reducedMotion: 'no-preference' }); await frames(page);
          await startMotionSamples(page, 650);
          await openButton(page).click();
          result.opening = await finishMotionSamples(page);
          assert(result.opening.some(frame => frame.open && frame.state === 'opening' && frame.opacity > 0 && frame.opacity < 1), 'Motion-enabled opening must show intermediate opacity frames.');
          await expect(menu(page)).toHaveAttribute('data-menu-state', 'open');
          await startMotionSamples(page, 450);
          await page.keyboard.press('Escape');
          result.closing = await finishMotionSamples(page);
          assert(result.closing.some(frame => frame.state === 'closing' && frame.modal && frame.expanded === 'true' && frame.opacity > 0 && frame.opacity < 1), 'Closing must keep the native modal active until the exit finishes.');
          await closed(page);
          await openButton(page).click(); await page.waitForTimeout(40);
          await page.emulateMedia({ reducedMotion: 'reduce' }); await frames(page);
          assert.equal(await menu(page).getAttribute('data-menu-state'), 'open', 'Changing to reduced motion must immediately finish opening.');
          assert.equal(await menu(page).evaluate(dialog => Number(getComputedStyle(dialog).opacity)), 1);
          await page.keyboard.press('Escape'); await frames(page); await closed(page);
          result.checks.push('Opening/closing animate through intermediate frames; the modal persists during exit and dynamic reduced motion finishes immediately');
        }
      } catch (error) {
        result.errors.push(error.message);
      } finally {
        await page.close();
        if (result.errors.length) report.errors.push({ engine: engineName, viewport, messages: result.errors });
        console.log(`${engineName} ${viewport.width}×${viewport.height}: ${result.errors.length ? 'failed' : 'passed'}`);
      }
    }
  } finally {
    await browser.close();
  }
}
await fs.writeFile(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ cases: report.results.length, passed: report.results.filter(result => !result.errors.length).length, errors: report.errors }, null, 2));
if (report.errors.length) process.exitCode = 1;
