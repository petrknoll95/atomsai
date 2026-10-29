import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = 'docs/visual/split-hero';
await fs.mkdir(out, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3001/');
    await page.evaluate(() => document.fonts.ready);
    const hero = page.locator('[data-section="hero"]');
    await expect(hero.locator('canvas')).toHaveAttribute('data-pattern', 'drift');
    await expect(hero.locator('canvas')).toHaveAttribute('data-motion-frames', /[1-9]/);
    for (const width of [1920, 1600, 1440, 1280, 1200, 1199, 1024, 900, 768, 767, 568, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      await page.waitForTimeout(150);
      const geometry = await hero.evaluate(el => {
        const heading = el.querySelector('h1'), lead = el.querySelector('[data-hero-entry="lead"]');
        const artwork = el.querySelector('canvas').getBoundingClientRect();
        const h = heading.getBoundingClientRect(), l = lead.getBoundingClientRect();
        const header = document.querySelector('header'), pill = header.firstElementChild.getBoundingClientRect();
        const actions = header.querySelector('[data-menu="site"]').parentElement.getBoundingClientRect();
        const nav = header.querySelector('nav'), navEnd = nav.lastElementChild.getBoundingClientRect();
        const text = document.createRange(); text.selectNodeContents(heading);
        const textRects = [...text.getClientRects()];
        return {
          width:innerWidth, overflow:document.documentElement.scrollWidth > innerWidth,
          artwork:artwork.toJSON(), heading:h.toJSON(), lead:l.toJSON(), pill:pill.toJSON(),
          headingFits:textRects.every(r => r.left >= h.left - 1 && r.right <= h.right + 1),
          navigationFits:getComputedStyle(nav).display === 'none' || navEnd.right < actions.left,
          pillRadius:getComputedStyle(header.firstElementChild).borderRadius,
        };
      });
      assert(!geometry.overflow && geometry.headingFits && geometry.navigationFits, JSON.stringify(geometry));
      assert.equal(geometry.pillRadius, '999px');
      assert(geometry.pill.x >= 16 && geometry.pill.right <= width - 16);
      if (width >= 768) {
        assert(Math.abs(geometry.artwork.width - width / 2) < 1);
        assert(geometry.heading.right < width / 2 && geometry.lead.left > width / 2);
        assert(Math.abs(geometry.heading.top - geometry.lead.top) < 1);
      } else {
        assert.equal(geometry.artwork.width, width);
        assert(geometry.lead.top > geometry.artwork.bottom);
      }
      results.push({ name, ...geometry });
      if ([1440, 390].includes(width)) await page.screenshot({ path: `${out}/${name}-${width}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    const applications = page.locator('header [data-menu="Applications"] > summary');
    await applications.click();
    const preview = page.locator('[data-applications-panel]');
    await expect(preview).toBeVisible();
    await preview.getByRole('link', { name: /Helpwise One shared inbox/ }).hover();
    await expect(preview.locator('[data-product-preview="Helpwise"]')).toBeVisible();
    await page.screenshot({ path: `${out}/${name}-dropdown.png` });
    await page.keyboard.press('Escape');
    const trigger = page.getByRole('button', { name: 'Open site menu', exact: true });
    const before = await trigger.boundingBox();
    const contactBefore = await page.getByRole('link', { name: 'Talk to AtomsAI', exact: true }).boundingBox();
    await trigger.click();
    const menu = page.getByRole('dialog', { name: 'Site menu' });
    const after = await menu.getByRole('button', { name: 'Close site menu', exact: true }).boundingBox();
    const contactAfter = await menu.getByRole('link', { name: 'Talk to AtomsAI', exact: true }).boundingBox();
    for (const key of ['x','y','width','height']) {
      assert(Math.abs(before[key] - after[key]) < 1);
      assert(Math.abs(contactBefore[key] - contactAfter[key]) < 1);
    }
    await page.screenshot({ path: `${out}/${name}-menu.png` });
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
    await page.waitForTimeout(1800);
    await expect(page.locator('#hero-heading')).toBeVisible();
    await expect(hero.locator('canvas')).toHaveAttribute('data-playback', 'playing');
    await page.mouse.wheel(0, 1000); await page.waitForTimeout(1200);
    const headerBox = await page.locator('header').first().boundingBox();
    assert(Math.abs(headerBox.y - 24) < 1, 'Pill stays fixed while scrolling');
    assert.deepEqual(errors, []);
    console.log(`${name}: 13 widths, dropdown, modal alignment, motion and sticky header passed`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${out}/checks.json`, JSON.stringify(results, null, 2));
