import { chromium, webkit, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const url = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const out = process.env.VISUAL_OUTPUT || 'docs/visual/kinetic-carousel';
const useCases = ['Book service calls', 'Coordinate patient visits', 'Follow up with customers', 'Answer admissions inquiries'];
await fs.mkdir(out, { recursive: true });
const results = [];
const frames = [];

for (const [engineName, browserType] of [['Chromium', chromium], ['WebKit', webkit]]) {
  const browser = await browserType.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  const gallery = page.locator('#industry-gallery');
  await gallery.scrollIntoViewIfNeeded();
  const expectedDiameter = ((await gallery.boundingBox()).width - 32) * 5 / 11;
  await page.evaluate(async () => {
    document.querySelectorAll('#industry-gallery img').forEach(image => { image.loading = 'eager'; });
    await Promise.all([...document.querySelectorAll('#industry-gallery img')].map(image => image.decode()));
  });
  const dimensions = await page.locator('[data-industry-circle]').evaluateAll(slides => slides.map(slide => ({
    width: slide.getBoundingClientRect().width, height: slide.getBoundingClientRect().height,
    circles: slide.querySelectorAll('[data-industry-image]').length, images: slide.querySelectorAll('img').length,
  })));
  expect(dimensions).toHaveLength(8);
  for (const slide of dimensions) {
    expect(slide.images).toBe(1);
    expect(slide.circles).toBe(1);
    expect(Math.abs(slide.width - expectedDiameter)).toBeLessThan(.02);
    expect(Math.abs(slide.height - slide.width)).toBeLessThan(.01);
  }
  if (engineName === 'Chromium') {
    await gallery.screenshot({ path: `${out}/rest.png` });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const next = page.getByRole('button', { name: 'Next use case', exact: true });
    await next.evaluate(button => {
      window.kineticSamples = [];
      const end = performance.now() + 1400;
      const slides = [...document.querySelectorAll('[data-industry-circle]')];
      const sample = () => {
        window.kineticSamples.push(slides.map(slide => ({ width: slide.getBoundingClientRect().width, clip: slide.style.clipPath })));
        if (performance.now() < end) requestAnimationFrame(sample);
      };
      button.click();
      requestAnimationFrame(sample);
    });
    await expect(page.locator('#use-case-title')).toHaveText(useCases[1]);
    await page.waitForTimeout(180);
    await gallery.screenshot({ path: `${out}/transition.png` });
    await page.waitForTimeout(1600);
    await gallery.screenshot({ path: `${out}/next.png` });
    const samples = await page.evaluate(() => window.kineticSamples);
    expect(samples.length).toBeGreaterThan(20);
    const distinctMasks = new Set(samples.map(sample => sample.map(slide => slide.clip).join('|'))).size;
    expect(distinctMasks).toBeGreaterThan(15);
    const maxDiameterChange = Math.max(...samples.flat().map(slide => Math.abs(slide.width - dimensions[0].width)));
    expect(maxDiameterChange).toBeLessThan(.01);
    frames.push({ samples: samples.length, distinctMasks, maxDiameterChange });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Previous use case', exact: true }).click();
  }
  // Cross both DOM-cycle boundaries with the arrow controls.
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Next use case', exact: true }).click();
    await expect(page.locator('#industries h3')).toHaveText(useCases[(i + 1) % useCases.length]);
  }
  for (const width of [1600, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await page.waitForTimeout(100);
    const geometry = await gallery.evaluate(element => ({
      pageWidth: document.documentElement.scrollWidth,
      circles: [...element.querySelectorAll('[data-industry-circle]')].filter(slide => getComputedStyle(slide).visibility === 'visible').map(slide => ({ width: slide.getBoundingClientRect().width, height: slide.getBoundingClientRect().height })),
      trackTransform: getComputedStyle(element.firstElementChild).transform,
    }));
    expect(geometry.pageWidth).toBe(width);
    expect(geometry.circles).toHaveLength(width < 768 ? 3 : 5);
    expect(geometry.trackTransform).toBe('none');
    for (const circle of geometry.circles) expect(Math.abs(circle.width - circle.height)).toBeLessThan(.01);
    results.push({ engine: engineName, width, ...geometry });
  }
  for (const width of [320, 1600]) {
    await page.setViewportSize({ width, height: 960 });
    await gallery.scrollIntoViewIfNeeded();
    const selected = gallery.locator('button[aria-pressed="true"]');
    const box = await selected.boundingBox();
    await page.mouse.click(box.x + box.width + 22, box.y + box.height / 2);
    const next = width === 320 ? 3 : 0;
    await expect(page.locator('#use-case-title')).toHaveText(useCases[next]);
    await expect(selected).toHaveAccessibleName(useCases[next]);
  }
  const selected = gallery.locator('button[aria-pressed="true"]');
  await selected.focus();
  await page.keyboard.press('ArrowRight');
  await expect(selected).toBeFocused();
  await expect(page.locator('#use-case-title')).toHaveText(useCases[1]);
  await page.keyboard.press('Enter');
  await expect(page.locator('#use-case-details')).toBeFocused();
  expect(errors).toEqual([]);
  await browser.close();
}

for (const reducedMotion of ['reduce', 'no-preference']) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion });
  await page.goto(url, { waitUntil: 'networkidle' });
  const gallery = page.locator('#industry-gallery');
  await gallery.scrollIntoViewIfNeeded();
  const box = await gallery.boundingBox();
  const client = await page.context().newCDPSession(page);
  const start = box.x + box.width * .85, end = box.x + box.width * .15, y = box.y + box.height / 2;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] });
  for (let step = 1; step <= 8; step++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start + (end - start) * step / 8, y }] });
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#use-case-title')).toHaveText(useCases[1]);
  await gallery.scrollIntoViewIfNeeded();
  const selected = gallery.locator('button[aria-pressed="true"]');
  await expect.poll(async () => {
    const [active, viewport] = await Promise.all([selected.boundingBox(), gallery.boundingBox()]);
    return Math.abs(active.x + active.width / 2 - viewport.x - viewport.width / 2);
  }).toBeLessThan(1);
  const active = await selected.boundingBox();
  await page.touchscreen.tap(active.x + active.width + 22, active.y + active.height / 2);
  await expect(page.locator('#use-case-title')).toHaveText(useCases[2]);
  results.push({ engine: 'Chromium touch', width: 390, reducedMotion, selection: useCases[2] });
  await browser.close();
}

// Compare the circle geometry with the original reference at rest. The photos
// and the controls use the current launch content.
const reference = await sharp('docs/visual/comparison/industries-reference.png').extract({ left: 48, top: 256, width: 1504, height: 669 }).toColourspace('srgb').removeAlpha().raw().toBuffer();
const rendered = await sharp(`${out}/rest.png`).resize(1504, 669, { fit: 'fill' }).removeAlpha().raw().toBuffer();
const overlay = Buffer.alloc(reference.length);
for (let i = 0; i < overlay.length; i++) overlay[i] = Math.round((reference[i] + rendered[i]) / 2);
await sharp(overlay, { raw: { width: 1504, height: 669, channels: 3 } }).png().toFile(`${out}/figma-overlay.png`);
await sharp({ create: { width: 1504, height: 669 * 3, channels: 3, background: '#fafafa' } }).composite(await Promise.all(['rest', 'transition', 'next'].map(async (name, i) => ({ input: await sharp(`${out}/${name}.png`).resize(1504, 669, { fit: 'fill' }).toBuffer(), top: 669 * i, left: 0 })))).png().toFile(`${out}/filmstrip.png`);
await fs.writeFile(`${out}/results.json`, JSON.stringify({ date: new Date().toISOString(), source: '186:4407', sourceDiameter: 669.0908813476562, sourceWindowRatios: [0.2, 0.4, 1, 0.4, 0.2], gap: 8, frames, results }, null, 2) + '\n');
console.log('Kinetic circles: fixed diameter, continuous masks, looping, direct selection, touch and both browser engines passed.');
