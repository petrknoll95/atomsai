import { chromium, webkit, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const directory = 'docs/visual/mega-menu';
await fs.mkdir(directory, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [width, height] of [[1600, 1000], [1200, 800], [1440, 600]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:3001/approach');
    await page.evaluate(() => document.fonts.ready);
    for (const label of ['Applications', 'Infrastructure', 'Industries', 'Resources', 'Company']) {
      const trigger = page.locator(`[data-menu="${label}"] > summary`);
      await trigger.hover();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const panel = page.locator(`[data-mega-menu="${label}"]`);
      await expect(panel).toBeVisible();
      await expect.poll(() => page.locator('[data-desktop-menu-viewport]').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return Math.abs(bounds.x) < 1 && Math.abs(bounds.width - innerWidth) < 1 && bounds.bottom <= innerHeight + 1 && element.scrollWidth <= element.clientWidth;
      })).toBe(true);
      await expect.poll(() => panel.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await panel.locator('a').first().hover();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // Keyboard can reopen the panel and move straight into its links.
      await trigger.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await trigger.press('ArrowDown');
      await expect(panel.locator('a').first()).toBeFocused();
      await page.keyboard.press('Escape');
      results.push({ browser: name, width, height, menu: label, passed: true });
    }
    await page.locator('[data-menu="Industries"] > summary').hover();
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${directory}/${name}-${width}x${height}.png` });
    if (height > 600) {
      await page.mouse.click(width / 2, height - 20);
      await expect(page.locator('[data-menu="Industries"] > summary')).toHaveAttribute('aria-expanded', 'false');
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001/approach');
  await page.locator('[data-menu="Industries"] > summary').hover();
  await page.locator('[data-mega-menu="Industries"] a').filter({ hasText: 'Healthcare' }).first().click();
  await expect(page).toHaveURL(/\/industries\/healthcare$/);
  await expect(page.locator('[data-mega-menu]')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open site menu', exact: true })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`${name}: five menus at three desktop sizes, hover, keyboard, Escape, outside click, navigation and mobile menu passed`);
  await browser.close();
}
await fs.writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2));
