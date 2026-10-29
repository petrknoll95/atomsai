import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit, expect } from '@playwright/test';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const output = path.resolve('docs/motion/section-reveals');
const report = { date: new Date().toISOString(), base, results: [], errors: [] };
await fs.mkdir(output, { recursive: true });
const opacity = section => section.evaluate(element => Number(getComputedStyle(element).opacity));
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function load(page, url = base) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await expect(page.locator('#top')).toHaveAttribute('data-reveals-ready', 'true');
  await page.evaluate(async () => { await document.fonts.ready; document.documentElement.style.scrollBehavior = 'auto'; });
  await frame(page);
}

async function enter(section) {
  await section.evaluate(element => {
    window.__revealSamples = [];
    const sample = () => {
      window.__revealSamples.push(Number(getComputedStyle(element).opacity));
      if (element.dataset.revealState !== 'visible') requestAnimationFrame(sample);
    };
    sample();
    window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight * .65, behavior: 'instant' });
  });
}

for (const [engine, launcher] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await launcher.launch();
  const result = { engine, checks: [], errors: [], responsive: [] };
  report.results.push(result);
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, reducedMotion: 'no-preference' });
    page.on('pageerror', error => result.errors.push(error.message));
    await load(page);
    const hero = page.locator('[data-section="hero"]');
    const offerings = page.locator('[data-section="offerings"]');
    await expect(page.locator('section, footer')).toHaveCount(9);
    assert.equal(await opacity(hero), 1, 'Initial viewport content must never be hidden.');
    assert.equal(await opacity(offerings), 0, 'Below-fold sections wait for their scroll entry.');
    result.checks.push('Initial content visible; nine outer sections discovered; below-fold content waits');

    const geometry = await offerings.evaluate(element => ({ width: element.offsetWidth, height: element.offsetHeight }));
    await enter(offerings);
    await expect(offerings).toHaveAttribute('data-reveal-state', 'visible', { timeout: 30000 });
    const samples = await page.evaluate(() => window.__revealSamples);
    assert(samples.some(value => value > 0 && value < 1), 'The reveal must fade through intermediate opacity values.');
    assert(samples.every((value, index) => value >= 0 && value <= 1 && (!index || value >= samples[index - 1])), 'The fade must be monotonic and bounded.');
    assert.equal(await offerings.evaluate(element => element.style.opacity), '', 'Final opacity must be released to CSS.');
    assert.deepEqual(await offerings.evaluate(element => ({ width: element.offsetWidth, height: element.offsetHeight })), geometry, 'A fade must not change section geometry.');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await frame(page);
    assert.equal(await opacity(offerings), 1, 'Revisiting a section must not hide or replay it.');
    result.samples = samples;
    result.checks.push('1100ms reveal has intermediate frames, preserves layout, releases opacity, and runs once');

    const faq = page.locator('#faq');
    assert.equal(await opacity(faq), 0);
    await faq.locator('summary').first().evaluate(summary => summary.focus({ preventScroll: true }));
    assert.equal(await opacity(faq), 1, 'Keyboard focus must reveal content immediately, even before scrolling.');
    await page.evaluate(() => { location.hash = 'technology'; });
    await expect(page.locator('#technology')).toHaveAttribute('data-reveal-state', 'visible', { timeout: 30000 });
    assert.equal(await opacity(page.locator('#technology')), 1);
    result.checks.push('Focus reveals offscreen controls immediately; anchor targets are visible');

    await page.emulateMedia({ media: 'print' });
    assert((await page.locator('section, footer').evaluateAll(elements => elements.map(element => getComputedStyle(element).opacity))).every(value => value === '1'));
    await page.emulateMedia({ media: 'screen' });
    result.checks.push('Printing includes every section, including unrevealed content');

    await load(page);
    await enter(offerings);
    await expect.poll(() => opacity(offerings), { intervals: [10] }).toBeGreaterThan(0);
    const topBeforePreference = await offerings.evaluate(el => el.getBoundingClientRect().top);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => page.locator('section, footer').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1'))).toBe(true);
    await expect.poll(() => offerings.evaluate(element => element.style.opacity)).toBe('');
    assert(Math.abs(await offerings.evaluate(el => el.getBoundingClientRect().top) - topBeforePreference) < 16, 'Changing motion preferences must preserve the visible scroll position.');
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await frame(page);
    assert.equal(await opacity(offerings), 1, 'Changing motion preferences must not rehide currently visible content.');
    result.checks.push('Live reduced-motion changes reveal everything and clean up in-flight animation');

    for (const section of await page.locator('section, footer').all()) {
      const name = await section.evaluate(element => element.id || element.dataset.section || element.getAttribute('aria-labelledby') || element.tagName);
      await section.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
      // Software WebGL can block Chromium's first frames while source shaders
      // compile. Wait for real artwork readiness before judging the fade endpoint.
      for (const canvas of await section.locator('canvas[data-pattern]').all()) {
        const box = await canvas.boundingBox();
        if (box?.width && box.height) await expect(canvas).toHaveAttribute('data-render-state', 'ready', { timeout: 30_000 });
      }
      await expect.poll(() => opacity(section), { timeout: 15_000, message: `${name} must reveal when scrolled into view` }).toBe(1);
    }
    await page.screenshot({ path: path.join(output, `${engine}-revealed.png`), fullPage: true });
    for (const width of [1200, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 }); await frame(page);
      const widthState = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth }));
      assert(widthState.documentWidth <= width, `Overflow at ${width}px.`);
      result.responsive.push(widthState);
    }
    result.checks.push('All sections reveal, including the footer; responsive widths have no overflow');

    await page.emulateMedia({ reducedMotion: 'reduce' }); await load(page);
    assert((await page.locator('section, footer').evaluateAll(elements => elements.map(element => getComputedStyle(element).opacity))).every(value => value === '1'));
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await load(page, `${base.replace(/\/$/, '')}/#faq`);
    assert.equal(await opacity(page.locator('#faq')), 1, 'Direct deep links must start visible.');
    result.checks.push('Initial reduced-motion preference and direct deep links preserve visibility');
    await page.close();

    const noScript = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 1600, height: 900 } });
    await noScript.goto(base);
    assert((await noScript.locator('section, footer').evaluateAll(elements => elements.map(element => getComputedStyle(element).opacity))).every(value => value === '1'));
    await noScript.close();
    result.checks.push('Server HTML remains fully visible without JavaScript');
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    await browser.close();
    if (result.errors.length) report.errors.push({ engine, errors: result.errors });
    console.log(`${engine}: ${result.errors.length ? result.errors.join('\n') : 'passed'}`);
  }
}
await fs.writeFile(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
