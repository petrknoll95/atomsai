import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = 'docs/visual/hero-loading';
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [815, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      let delayed = 0;
      const fallbackRequests = [];
      page.on('request', request => { if (request.url().includes('hero-atoms-fallback')) fallbackRequests.push(request.url()); });
      await page.route('**/*.js', async route => {
        if (/hero-atoms-sketch|node_modules_p5/.test(route.request().url())) {
          delayed++;
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        await route.continue();
      });
      await page.goto('http://127.0.0.1:3001/', { waitUntil: 'domcontentloaded' });
      const host = page.locator('[data-hero-atoms]');
      await expect(host).toHaveAttribute('data-state', 'loading');
      await expect(host.locator('img')).toHaveCount(0);
      await page.screenshot({ path: `${out}/${name}-${width}-loading.png` });
      await expect(host).toHaveAttribute('data-state', 'ready', { timeout: 20000 });
      await expect(host.locator('canvas')).toHaveCSS('opacity', '1');
      await page.screenshot({ path: `${out}/${name}-${width}-ready.png` });
      assert(delayed > 0, 'Must actually delay the lazy p5 bundle');
      for (let i = 0; i < 2; i++) {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(host.locator('img')).toHaveCount(0);
        await expect(host).toHaveAttribute('data-state', 'ready', { timeout: 20000 });
      }
      assert.equal(fallbackRequests.length, 0, 'Normal loading must not download or paint fallback artwork');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(host.locator('canvas')).toHaveCSS('transition-duration', '0s');
      results.push({ browser: name, width, delayedBundles: delayed, reloads: 2, fallbackRequests: fallbackRequests.length, reducedMotion: true });
      await page.close();
    }
    const noJS = await browser.newPage({ javaScriptEnabled: false });
    await noJS.goto('http://127.0.0.1:3001/');
    await expect(noJS.locator('[data-hero-atoms] img')).toBeVisible();
    await expect(noJS.locator('h1')).toBeVisible();
    await noJS.close();
    console.log(`${name}: delayed loading, reloads, reduced motion, no-JS fallback passed`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${out}/results.json`, JSON.stringify(results, null, 2) + '\n');
