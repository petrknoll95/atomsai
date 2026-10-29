import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = 'docs/visual/story-content';
await fs.mkdir(out, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:3001/#customer-stories');
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#customer-stories');
    const active = section.locator('[aria-roledescription="slide"][aria-hidden="false"]');
    await expect(active).toContainText('Aaron Vasquez');
    const companies = ['Northwind Logistics', 'Linden Commerce', 'Fieldwork Services', 'Clearpath Assurance'];
    const quotes = new Set();
    const sources = new Set();
    for (const width of [1600, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      for (let i = 0; i < 4; i++) {
        await section.getByRole('button', { name: `Go to story ${i + 1}`, exact: true }).evaluate(el => el.click());
        await expect(section.locator('[data-story-portraits]')).toHaveAttribute('data-portrait-index', String(i));
        await expect.poll(() => section.locator('[data-portrait-still] img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(active.getByText('Demo story', { exact: true })).toHaveCount(i === 0 ? 0 : 1);
        quotes.add(await active.locator('blockquote').innerText());
        sources.add(await section.locator('[data-portrait-still] img').getAttribute('src'));
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const overflow = await active.evaluate(el => [...el.querySelectorAll('blockquote, p, button, [class*="companyRow"], [class*="metricValues"]')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent));
        assert.deepEqual(overflow, [], `${name} ${width} slide ${i}: content overflow`);
        if (width === 1600 || width === 390) await section.screenshot({ path: `${out}/${name}-${width}-${i}.png`, style: 'header, .skip-link, [data-feedback-widget] { visibility: hidden !important; }' });
        await active.getByRole('button', { name: 'Read Story' }).evaluate(el => el.click());
        const dialog = section.getByRole('dialog');
        await expect(dialog.getByRole('heading')).toHaveText(companies[i]);
        await expect(dialog.locator('blockquote')).toHaveText(await active.locator('blockquote').innerText());
        // Detail content must remain tied to the opened story even if selection changes.
        await section.getByRole('button', { name: `Go to story ${(i + 1) % 4 + 1}`, exact: true }).evaluate(el => el.click());
        await expect(dialog.getByRole('heading')).toHaveText(companies[i]);
        await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      }
    }
    assert.equal(quotes.size, 4); assert.equal(sources.size, 4);
    results.push({ browser: name, uniqueQuotes: quotes.size, uniqueImages: sources.size, widths: [1600, 1024, 390, 320], dialogSynchronization: true, overflow: false });
    console.log(`${name}: distinct content/images, original first, dialog synchronization and responsive fit passed`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${out}/results.json`, JSON.stringify(results, null, 2) + '\n');
