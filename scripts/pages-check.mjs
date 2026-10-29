import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const origin = process.env.PAGES_URL ?? 'http://127.0.0.1:3187/atomsai/';
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: name === 'webkit' ? 390 : 1600, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('response', response => {
    if (response.url().startsWith(new URL(origin).origin) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['', 'approach/', 'blog/', 'blog/quotes-go-quiet/', 'capabilities/voice/', 'industries/healthcare/', 'company/contact/', 'trust/', 'patterns/render/?kind=concentric']) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    const invalidLinks = await page.locator('a[href^="/"]').evaluateAll(elements => elements.filter(element => !element.getAttribute('href').startsWith('/atomsai/')).map(element => element.getAttribute('href')));
    assert.deepEqual(invalidLinks, [], route);
  }
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.locator('#property-preview').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Buy a house', exact: true }).click();
  await expect(page.locator('#property-preview [data-speaker]')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled();
  await page.locator('footer').getByRole('link', { name: 'Our approach', exact: true }).click();
  await expect(page).toHaveURL(/\/atomsai\/approach\//);
  assert.deepEqual(errors, []);
  console.log(`${name}: Pages routes, assets, links, navigation, and Nora chat passed.`);
  await browser.close();
}
