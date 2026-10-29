import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const output = 'docs/visual/reload';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 815, height: 990 } });
    const errors = [], failedAssets = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) failedAssets.push(response.url());
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll(nodes => nodes.map(node => node.href));
    assert(stylesheets.length > 0, 'Run against a production build for split-CSS failure checks.');

    // A real stylesheet request failure used to turn an absolute shader into
    // a page-sized purple layer. Exercise each chunk independently and all CSS.
    const failures = [];
    for (const blocked of [...stylesheets, 'all']) {
      let intercepted = 0;
      const route = async route => {
        if (blocked === 'all' || route.request().url() === blocked) {
          intercepted++;
          await route.abort();
        } else await route.continue();
      };
      await page.route('**/*.css', route);
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('Powerful AI.');
      const boundaries = await page.locator('[data-home-pattern]').evaluateAll(nodes => nodes.map(node => {
        const style = getComputedStyle(node);
        return { contain: style.contain, overflow: style.overflow, height: node.clientHeight };
      }));
      assert(intercepted > 0);
      assert(boundaries.every(item => item.contain === 'strict' && item.overflow === 'hidden'));
      if (blocked === 'all') {
        assert(boundaries.every(item => item.height === 0), 'An unstyled decorative shader escaped its zero-height slot');
        await page.screenshot({ path: `${output}/${name}-css-unavailable.png` });
      }
      failures.push({ blocked, intercepted, contained: true });
      await page.unroute('**/*.css', route);
    }

    // Normal reloads at both widths, including a restored mid-page position.
    let reloads = 0;
    for (const width of [390, 815, 1600]) {
      await page.setViewportSize({ width, height: 990 });
      for (const hash of ['', '#technology']) {
        await page.goto(`${base}/${hash}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.reload({ waitUntil: 'networkidle' });
        await expect(page.getByRole('button', { name: 'Open site menu' })).toBeVisible();
        await expect(page.locator('h1')).toContainText('Powerful AI.');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        reloads++;
      }
    }
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/${name}-reloaded.png` });
    assert.deepEqual(failedAssets, []);
    assert.deepEqual(errors, []);
    results.push({ browser: name, failures, reloads, failedAssets, errors });
    console.log(`${name}: CSS failure contained; ${reloads} reloads passed at three widths`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ base, results }, null, 2) + '\n');
