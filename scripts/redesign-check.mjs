import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.REDESIGN_URL || 'http://127.0.0.1:3001';
const out = 'docs/redesign/qa/integration';
await fs.mkdir(out, { recursive: true });
const paths = ['/approach', '/capabilities/voice', '/industries/healthcare', '/trust', '/company/contact'];
const results = [];
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  const browser = await launcher.launch();
  for (const width of [1440, 768, 390, 320]) {
    for (const route of paths) {
      const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode().catch(() => {}))); });
      const audit = await page.evaluate(() => {
        const allIds = [...document.querySelectorAll('[id]')].map(e => e.id);
        const duplicates = allIds.filter((id, i) => allIds.indexOf(id) !== i);
        const brokenHashes = [...document.querySelectorAll('a[href^="#"]')].filter(a => a.hash && !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a => a.getAttribute('href'));
        const missingImages = [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src);
        return { title: document.title, canonical: document.querySelector('link[rel="canonical"]')?.href, h1s: document.querySelectorAll('h1').length, main: document.querySelectorAll('main').length, viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, duplicates, brokenHashes, missingImages, bodyFont: getComputedStyle(document.body).fontFamily, displayFont: getComputedStyle(document.querySelector('h1')).fontFamily };
      });
      const result = { engine, width, route, status: response.status(), errors, ...audit };
      results.push(result);
      assert.equal(result.status, 200, `${route}: response`);
      assert.equal(result.h1s, 1, `${route}: H1`);
      assert.equal(result.main, 1, `${route}: main`);
      assert.equal(result.scrollWidth, width, `${route}: overflow at ${width}`);
      assert.deepEqual(errors, [], `${route}: console`);
      assert.deepEqual(result.duplicates, [], `${route}: duplicate IDs`);
      assert.deepEqual(result.brokenHashes, [], `${route}: anchor targets`);
      assert.deepEqual(result.missingImages, [], `${route}: images`);
      assert.equal(result.canonical, 'https://atomsai.com' + route, `${route}: canonical`);
      // WebKit on macOS follows Safari's links-skipped Tab preference.
      // Assert sequential Tab in Chromium, and the skip-link behavior directly in WebKit.
      if (engine === 'chromium') {
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').innerText(), 'Skip to content', `${route}: first keyboard target`);
      } else await page.locator('.skip-link').focus();
      await page.keyboard.press('Enter');
      if (width === 1440 || width === 390) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: `${out}/${engine}-${route.slice(1).replaceAll('/', '-')}-${width}.png`, fullPage: true });
      }
      await page.close();
    }
  }
  // Shared compact menu and page discovery from a secondary page.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(base + '/trust', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
  const menu = page.getByRole('navigation', { name: 'Site menu' });
  assert(await menu.isVisible(), `${engine}: compact menu`);
  await menu.getByRole('link', { name: 'AI Services', exact: true }).click();
  await page.waitForURL(base + '/approach');
  assert(await page.locator('#hero-heading').isVisible(), `${engine}: menu navigation`);
  await page.close();
  await browser.close();
}
await fs.writeFile(out + '/results.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log(`${results.length} integrated route/viewport/browser checks passed, plus compact menu navigation in both engines.`);
