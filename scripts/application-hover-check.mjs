import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit, expect } from '@playwright/test';
import sharp from 'sharp';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const output = path.resolve('docs/patterns/application-hover');
const referencePath = path.resolve('docs/visual/comparison/applications-reference.png');
const products = [
  { name: 'JustCall', application: 'applications-drift', kind: 'drift', count: 5, href: 'https://justcall.io/' },
  { name: 'Helpwise', application: 'applications-band', kind: 'single-band', count: 5, href: 'https://helpwise.io/' },
  { name: 'ServiceAgent', application: 'applications-concentric', kind: 'concentric', count: 15, href: 'https://serviceagent.ai/' },
  { name: 'CallPage', application: 'applications-offset', kind: 'offset', count: 20, href: 'https://www.callpage.io/' },
];
const report = { date: new Date().toISOString(), base, results: [], comparisons: [], errors: [], method: 'Original 1600 × 903 section crop, no alignment adjustment or resizing. Overlay 50%; difference ×4. Touch destinations are fulfilled locally to verify first-tap navigation without contacting the product sites.' };
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const cardFor = (page, name) => page.locator(`[data-application="${name}"]`);
await fs.mkdir(output, { recursive: true });

async function frames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function state(card) {
  return card.evaluate(element => {
    const style = getComputedStyle(element);
    const icon = element.querySelector('[data-application-icon]');
    const pattern = element.querySelector('[data-application-pattern]');
    const action = element.querySelector('[data-application-action]');
    return {
      active: element.dataset.active, raw: style.getPropertyValue('--application-progress').trim(),
      progress: Number(style.getPropertyValue('--application-progress')),
      opacity: Number(getComputedStyle(pattern).opacity),
      mask: getComputedStyle(icon).maskImage, iconColor: getComputedStyle(icon).backgroundColor,
      actionColor: getComputedStyle(action).backgroundColor, actionPadding: getComputedStyle(action).paddingInline,
      focusVisible: action.matches(':focus-visible'),
    };
  });
}
async function endpoint(card, active) {
  await expect(card).toHaveAttribute('data-active', String(active));
  await expect.poll(async () => (await state(card)).progress).toBe(active ? 1 : 0);
  const value = await state(card);
  assert(value.raw && Number.isFinite(value.progress), 'Animation progress must be an explicit numeric CSS property.');
  assert(Math.abs(value.opacity - value.progress) < .002, 'Pattern opacity must follow the animation progress.');
  return value;
}
async function idle(page) {
  await page.mouse.move(1, 1);
  for (const product of products) await endpoint(cardFor(page, product.name), false);
}
async function startSamples(card, duration) {
  await card.evaluate((element, milliseconds) => {
    window.__applicationSamples = { running: true, values: [] };
    const start = performance.now();
    const sample = () => {
      const progress = Number(getComputedStyle(element).getPropertyValue('--application-progress'));
      const opacity = Number(getComputedStyle(element.querySelector('[data-application-pattern]')).opacity);
      window.__applicationSamples.values.push({ time: performance.now() - start, progress, opacity });
      if (performance.now() - start < milliseconds) requestAnimationFrame(sample);
      else window.__applicationSamples.running = false;
    };
    sample();
  }, duration);
}
async function samples(page, direction) {
  await page.waitForFunction(() => !window.__applicationSamples.running);
  const values = await page.evaluate(() => window.__applicationSamples.values);
  assert(values.some(value => value.progress > .01 && value.progress < .99), 'Motion-enabled transitions must include intermediate frames.');
  assert(values.every(value => Number.isFinite(value.progress) && value.progress >= 0 && value.progress <= 1 && Math.abs(value.progress - value.opacity) < .02), 'Animation frames must remain bounded and drive the visible pattern.');
  if (direction) assert(values.every((value, index) => !index || (value.progress - values[index - 1].progress) * direction >= -.002), 'An uninterrupted transition must be monotonic.');
  return values;
}
async function captureSection(page, engine, name) {
  const bounds = await page.locator('#applications').evaluate(section => {
    const rect = section.getBoundingClientRect();
    return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
  });
  assert.equal(bounds.width, 1600);
  assert(Math.abs(bounds.height - 903) < .05, `Applications section height changed: ${bounds.height}`);
  const file = `${name}-${engine}-1600.png`;
  // ScrollSmoother transforms the content, so document-coordinate crops are
  // invalid while smoothing is active. Capture the section's own visible bounds.
  await page.locator('#applications').screenshot({ path: path.join(output, file), animations: 'disabled' });
  const capture = await fs.readFile(path.join(output, file));
  await sharp(capture).extract({ left: 0, top: 0, width: 1600, height: 903 }).png().toFile(path.join(output, file));
  return file;
}
async function compare(engine, filename) {
  const source = await fs.readFile(referencePath);
  const reference = await sharp(source).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const actual = await sharp(path.join(output, filename)).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(reference.info.width, 1600); assert.equal(reference.info.height, 903);
  assert.equal(actual.data.length, reference.data.length);
  const overlay = Buffer.alloc(actual.data.length), difference = Buffer.alloc(actual.data.length);
  let sum = 0, maximum = 0, over32 = 0;
  for (let index = 0; index < actual.data.length; index += 3) {
    let pixelMaximum = 0;
    for (let channel = 0; channel < 3; channel++) {
      const offset = index + channel, delta = Math.abs(reference.data[offset] - actual.data[offset]);
      sum += delta; maximum = Math.max(maximum, delta); pixelMaximum = Math.max(pixelMaximum, delta);
      overlay[offset] = Math.round((reference.data[offset] + actual.data[offset]) / 2);
      difference[offset] = Math.min(255, delta * 4);
    }
    if (pixelMaximum > 32) over32++;
  }
  for (const [name, buffer] of [['overlay', overlay], ['difference-x4', difference]]) {
    await sharp(buffer, { raw: { width: 1600, height: 903, channels: 3 } }).png().toFile(path.join(output, `serviceagent-${engine}-${name}.png`));
  }
  report.comparisons.push({ engine, reference: 'docs/visual/comparison/applications-reference.png', referenceSha256: hash(source), rendered: filename, meanAbsoluteChannelError: sum / actual.data.length, maximumChannelError: maximum, pixelsOver32Percent: over32 / (1600 * 903) * 100 });
}
function watch(page, result) {
  page.on('pageerror', error => result.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
  page.on('requestfailed', request => result.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
}
async function load(page) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; }); await Promise.all(Array.from(document.images, image => image.decode().catch(() => {}))); });
}

for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  // macOS WebKit follows Safari's default Tab-to-form-controls preference;
  // Option+Tab includes links without changing the page or browser preference.
  const nextLinkKey = engineName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  const result = { engine: engineName, keyboardNavigation: nextLinkKey, checks: [], errors: [], states: [], transitions: [], responsive: [], touch: [] };
  report.results.push(result);
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    page.setDefaultTimeout(30_000);
    watch(page, result);
    await load(page);
    const section = page.locator('#applications');
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('[data-application]')).toHaveCount(4);
    for (const product of products) {
      const card = cardFor(page, product.name);
      await expect(card.locator('[data-home-pattern]')).toHaveAttribute('data-home-pattern', product.application);
      await expect(card.locator('canvas')).toHaveAttribute('data-pattern', product.kind);
      await expect(card.locator('canvas')).toHaveAttribute('data-count', String(product.count));
      await expect(card.locator('canvas')).toHaveAttribute('data-render-state', 'ready', { timeout: 30_000 });
      assert.deepEqual(await card.locator('canvas').evaluate(canvas => ({ width: canvas.clientWidth, height: canvas.clientHeight })), { width: 352, height: 352 }, 'The source circle border must not shrink the 352 × 352 artwork field.');
      const value = await endpoint(card, false);
      assert(value.mask !== 'none', `${product.name} must retain an original masked icon.`);
    }
    result.defaultCapture = await captureSection(page, engineName, 'default');
    result.checks.push('Four distinct procedural presets; all cards start inactive with original masked icons');

    for (const product of products) {
      const card = cardFor(page, product.name);
      await startSamples(card, 900); await card.locator('[data-application-action]').hover();
      const entered = await samples(page, 1);
      const active = await endpoint(card, true);
      const patternHash = hash(await card.locator('[data-application-pattern]').screenshot());
      const screenshot = await captureSection(page, engineName, product.name.toLowerCase());
      result.states.push({ name: product.name, ...active, patternHash, screenshot });
      if (product.name === 'ServiceAgent') await compare(engineName, screenshot);
      await startSamples(card, 650); await page.mouse.move(1, 1);
      const exited = await samples(page, -1); await endpoint(card, false);
      result.transitions.push({ name: product.name, entered, exited });
    }
    assert.equal(new Set(result.states.map(value => value.patternHash)).size, 4, 'All four active patterns must render different pixels.');
    result.checks.push('All four cards animate through intermediate entry/exit frames and return to their endpoints');

    const first = cardFor(page, 'JustCall');
    await startSamples(first, 1400);
    await first.locator('[data-application-action]').hover(); await page.waitForTimeout(90);
    const interruptedEntry = await state(first);
    assert(interruptedEntry.progress > 0 && interruptedEntry.progress < 1);
    await page.mouse.move(1, 1); await page.waitForTimeout(20);
    const interruptedExit = await state(first);
    assert(interruptedExit.progress < interruptedEntry.progress && interruptedExit.progress > 0);
    await first.locator('[data-application-action]').hover(); await endpoint(first, true);
    result.interruption = { interruptedEntry, interruptedExit, samples: await samples(page, 0) };
    await idle(page);
    result.checks.push('Rapid leave/re-entry reverses from the current progress and reaches the final state');

    await page.locator('[data-section="offerings"] a').last().focus();
    await page.keyboard.press(nextLinkKey);
    await expect(first.locator('[data-application-action]')).toBeFocused();
    assert((await endpoint(first, true)).focusVisible);
    const outline = await first.locator('[data-application-action]').evaluate(link => ({ style: getComputedStyle(link).outlineStyle, width: getComputedStyle(link).outlineWidth }));
    assert(outline.style !== 'none' && outline.width !== '0px', 'Keyboard focus must be visible.');
    await first.locator('[data-application-action]').hover(); await page.mouse.move(1, 1); await endpoint(first, true);
    await first.locator('[data-application-action]').hover(); await page.keyboard.press(nextLinkKey);
    await endpoint(first, true); await endpoint(cardFor(page, 'Helpwise'), true);
    await page.mouse.move(1, 1); await endpoint(first, false); await endpoint(cardFor(page, 'Helpwise'), true);
    for (const name of ['ServiceAgent', 'CallPage']) {
      await page.keyboard.press(nextLinkKey);
      await expect(cardFor(page, name).locator('[data-application-action]')).toBeFocused();
      assert((await endpoint(cardFor(page, name), true)).focusVisible);
    }
    await page.keyboard.press(nextLinkKey); await idle(page);
    result.checks.push('Keyboard navigation activates each link with a visible focus indicator; pointer and keyboard ownership coexist correctly');

    await first.locator('[data-application-action]').hover(); await page.waitForTimeout(80);
    assert((await state(first)).progress > 0 && (await state(first)).progress < 1);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await frames(page);
    assert.equal((await state(first)).progress, 1, 'Enabling reduced motion must finish an in-flight entry.');
    await page.mouse.move(1, 1); await frames(page); assert.equal((await state(first)).progress, 0);
    await first.locator('[data-application-action]').hover(); await frames(page); assert.equal((await state(first)).progress, 1);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await frames(page);
    await page.mouse.move(1, 1);
    const firstElement = await first.elementHandle();
    await page.waitForFunction(element => {
      const progress = Number(getComputedStyle(element).getPropertyValue('--application-progress'));
      return progress > 0 && progress < 1;
    }, firstElement, { timeout: 2000 });
    await firstElement.dispose();
    await page.emulateMedia({ reducedMotion: 'reduce' }); await frames(page);
    assert.equal((await state(first)).progress, 0, 'Enabling reduced motion must finish an in-flight exit.');
    result.checks.push('Dynamic reduced-motion changes finish in-flight entry/exit and make subsequent state changes immediate');

    for (const width of [1200, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      for (const product of products) {
        const card = cardFor(page, product.name); await card.locator('[data-application-action]').hover(); await endpoint(card, true);
        const link = card.locator('[data-application-action]'); await expect(link).toBeVisible();
        await idle(page);
      }
      const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
      assert(geometry.scrollWidth <= width && geometry.bodyWidth <= width, `Card interactions overflow at ${width}px.`);
      result.responsive.push(geometry);
    }
    result.checks.push('All cards remain usable without overflow at 1200, 768, 390 and 320px');
    await page.close();

    for (const width of [768, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      context.setDefaultTimeout(30_000);
      // Preserve the real href and target, while avoiding external-site side effects.
      await context.route(url => products.some(product => new URL(product.href).origin === url.origin), route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Navigation verified</title>' }));
      const touchPage = await context.newPage(); watch(touchPage, result); await load(touchPage);
      const navigations = [];
      for (const product of products) {
        const card = cardFor(touchPage, product.name);
        await card.locator('[data-application-icon]').tap(); await frames(touchPage);
        await endpoint(card, false);
        const [popup] = await Promise.all([
          touchPage.waitForEvent('popup'), card.locator('[data-application-action]').tap(),
        ]);
        await popup.waitForLoadState('domcontentloaded');
        assert.equal(new URL(popup.url()).origin, new URL(product.href).origin, 'The first link tap must open the original destination.');
        navigations.push({ name: product.name, destination: popup.url() }); await popup.close();
        await endpoint(card, false);
      }
      const geometry = await touchPage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
      assert(geometry.scrollWidth <= width && geometry.bodyWidth <= width, `Touch layout overflows at ${width}px.`);
      result.touch.push({ ...geometry, navigations }); await context.close();
    }
    result.checks.push('Touch has no sticky hover; each product link opens on its first tap at 768, 390 and 320px');
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    await browser.close();
    if (result.errors.length) report.errors.push({ engine: engineName, messages: result.errors });
    console.log(`${engineName}: ${result.errors.length ? 'failed' : 'passed'}`);
  }
}
await fs.writeFile(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ results: report.results.map(({ engine, checks, errors }) => ({ engine, checks, errors })), comparisons: report.comparisons }, null, 2));
if (report.errors.length) process.exitCode = 1;
