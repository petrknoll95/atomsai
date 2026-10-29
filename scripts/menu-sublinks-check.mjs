import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const [width, height] of [[1440, 960], [390, 844], [320, 568], [568, 320]]) {
      const mobile = width < 768;
      const page = await browser.newPage({ viewport: { width, height }, hasTouch: mobile, isMobile: mobile });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:3001/');
      const trigger = page.getByRole('button', { name: 'Open site menu', exact: true });
      await trigger.click();
      const menu = page.getByRole('dialog', { name: 'Site menu' });
      await expect(menu).toHaveAttribute('data-menu-state', 'open');
      const group = label => menu.getByRole('button', { name: label, exact: true });
      const panel = async label => page.locator(`[id="${await group(label).getAttribute('aria-controls')}"]`);
      await expect(group('Applications')).toHaveAttribute('aria-expanded', 'true');
      await expect(menu.getByRole('link', { name: 'JustCall', exact: true })).toBeVisible();
      const appPanel = await panel('Applications');
      const infraPanel = await panel('Infrastructure');
      const opacities = [];
      const initialRow = await group('Infrastructure').boundingBox();
      if (mobile) await group('Infrastructure').tap();
      else await group('Infrastructure').hover();
      await expect(group('Infrastructure')).toHaveAttribute('aria-expanded', 'true');
      await expect(group('Applications')).toHaveAttribute('aria-expanded', 'false');
      for (let i = 0; i < 8; i++) {
        opacities.push(await infraPanel.evaluate(el => Number(getComputedStyle(el).opacity)));
        await page.waitForTimeout(45);
      }
      assert(opacities.some(value => value > 0 && value < 1), 'Submenu crossfades through intermediate opacity');
      const finalRow = await group('Infrastructure').boundingBox();
      assert(Math.abs(initialRow.y - finalRow.y) < 1, 'Primary rows remain stationary while switching groups');
      await expect(appPanel).toHaveAttribute('inert', '');
      await expect(infraPanel).not.toHaveAttribute('inert', '');
      // Click after hover must keep the new group open, rather than immediately undoing it.
      if (!mobile) { await group('Infrastructure').click(); await expect(group('Infrastructure')).toHaveAttribute('aria-expanded', 'true'); }
      await group('Industries').focus();
      await group('Industries').press('Enter');
      await expect(group('Industries')).toHaveAttribute('aria-expanded', 'true');
      await page.waitForTimeout(500);
      await page.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(menu.getByRole('link', { name: 'Insurance', exact: true })).toBeFocused();
      // Fast reversals use keyboard activation, independently of pointer intent.
      for (const label of ['Applications', 'Infrastructure', 'Applications']) {
        await group(label).press('Enter'); await page.waitForTimeout(60);
      }
      await expect(group('Applications')).toHaveAttribute('aria-expanded', 'true');
      await page.waitForTimeout(550);
      assert.equal(await menu.locator('button[aria-expanded="true"]').count(), 1);
      assert(await menu.evaluate(el => el.scrollWidth <= el.clientWidth));
      const alignment = await menu.evaluate(el => {
        const button = el.querySelector('button[aria-expanded="true"]');
        const primary = button.closest('ul').getBoundingClientRect();
        const child = document.getElementById(button.getAttribute('aria-controls')).querySelector('a').getBoundingClientRect();
        return Math.abs(primary.right - child.left);
      });
      assert(alignment < 1, 'Sublinks align to the adjacent slit / next column boundary');
      await menu.evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: `docs/visual/menu-sublinks/${name}-${width}.png` });
      const last = menu.getByRole('link', { name: 'Privacy Policy', exact: true });
      await last.focus(); await page.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(menu.getByRole('link', { name: 'AtomsAI home' })).toBeFocused();
      await page.keyboard.press('Escape'); await expect(menu).not.toBeVisible(); await expect(trigger).toBeFocused();
      await trigger.click(); await expect(menu).toBeVisible();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await group('Industries').press('Enter');
      await expect(group('Industries')).toHaveAttribute('aria-expanded', 'true');
      await expect(await panel('Industries')).toHaveCSS('opacity', '1');
      await menu.getByRole('link', { name: 'All Industries', exact: true }).click();
      await expect(menu).not.toBeVisible();
      await expect(page.locator('#industries-title')).toBeFocused();
      assert.deepEqual(errors, []);
      results.push({ browser: name, width, height, opacities, alignment, keyboard: true, reducedMotion: true, navigation: true, errors });
      console.log(`${name}/${width}: two-column menus, animation, navigation and keyboard passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
await fs.writeFile('docs/visual/menu-sublinks/results.json', JSON.stringify(results, null, 2) + '\n');
