import { chromium, webkit, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { prepareHomepagePatterns } from './wait-for-patterns.mjs';

const url = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const results = [];
await fs.mkdir('docs/visual/rendered', { recursive: true });
for (const width of [1600, 390, 320]) {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width, height: 960 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(image => image.loading = 'eager');
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => {})));
  });
  const geometry = await page.evaluate(() => ({
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    sections: Array.from(document.querySelectorAll('section,footer')).map(section => ({ name: section.id || section.getAttribute('data-section') || 'footer', height: section.getBoundingClientRect().height })),
    brokenAssets: Array.from(document.images).filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc),
  }));
  if (geometry.scrollWidth > width || geometry.brokenAssets.length || errors.length) throw new Error(JSON.stringify({ geometry, errors }));
  await prepareHomepagePatterns(page);
  await page.screenshot({ path: `docs/visual/rendered/webkit-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Next industry', exact: true }).click();
  await expect(page.locator('#industries h3')).toHaveText('Logistics');
  await page.getByRole('button', { name: 'Previous industry', exact: true }).click();
  await expect(page.locator('#industries h3')).toHaveText('Insurance');
  await page.locator('#faq details').first().locator('summary').press('Enter');
  await expect(page.locator('#faq details[open]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Read Story', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  results.push({ engine: 'WebKit', width, geometry, errors, checks: ['Embla previous/next', 'keyboard FAQ', 'dialog Escape'] });
  await browser.close();
}

// A real touch sequence, independent of the component's button handlers.
for (const reducedMotion of ['reduce', 'no-preference']) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion });
  await page.goto(url, { waitUntil: 'networkidle' });
  const gallery = page.locator('#industry-gallery');
  await gallery.scrollIntoViewIfNeeded();
  const box = await gallery.boundingBox();
  const client = await page.context().newCDPSession(page);
  const startX = box.x + box.width * .85, endX = box.x + box.width * .15, y = box.y + box.height / 2;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
  for (let step = 1; step <= 8; step++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + (endX - startX) * step / 8, y }] });
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#industries h3')).toHaveText('Logistics');
  results.push({ engine: 'Chromium', width: 390, reducedMotion, checks: ['real touch swipe Insurance → Logistics'] });
  await browser.close();
}
await fs.writeFile('docs/visual/browser-checks.json', JSON.stringify({ date: new Date().toISOString(), results }, null, 2) + '\n');
console.log('WebKit at1600/390/320 and real Embla touch swipes in both motion modes passed.');
