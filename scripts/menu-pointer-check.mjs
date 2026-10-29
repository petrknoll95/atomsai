import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';

// Exercise real pointer paths, including travel that takes longer than the
// stationary-hover grace period. No synthetic React events or forced clicks.
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 1024]) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      await page.goto('http://127.0.0.1:3001/');
      await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
      const menu = page.getByRole('dialog', { name: 'Site menu' });
      await expect(menu).toHaveAttribute('data-menu-state', 'open', { timeout: 30000 });
      const group = label => menu.locator(`[data-menu-group="${label}"]`);
      const trigger = label => group(label).locator(':scope > button, :scope > a');
      const start = async label => {
        const box = await trigger(label).boundingBox();
        const point = { x: box.x + 40, y: box.y + box.height / 2 };
        await page.mouse.move(point.x, point.y);
        await expect(group(label)).toHaveAttribute('data-expanded', 'true');
        await page.waitForTimeout(500);
        return point;
      };
      for (const [label, destination] of [['Industries', 'Insurance'], ['Applications', 'CallPage']]) {
        const from = await start(label);
        const box = await menu.getByRole('link', { name: destination, exact: true }).boundingBox();
        const to = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        for (let step = 1; step <= 35; step++) {
          const progress = step / 35;
          await page.mouse.move(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress);
          await page.waitForTimeout(18);
          assert.equal(await group(label).getAttribute('data-expanded'), 'true', `${name}/${width}: ${label} lost along diagonal step ${step}`);
        }
        await page.waitForTimeout(450);
        await expect(group(label)).toHaveAttribute('data-expanded', 'true');
      }
      // Moving straight up the primary column must switch without a grace delay.
      await start('Industries');
      const infra = await trigger('Infrastructure').boundingBox();
      await page.mouse.move(infra.x + 40, infra.y + infra.height / 2);
      await expect(group('Infrastructure')).toHaveAttribute('data-expanded', 'true', { timeout: 200 });
      // Pausing over a crossed row indicates a new intent; do not lock it out.
      const from = await start('Industries');
      const insurance = await menu.getByRole('link', { name: 'Insurance', exact: true }).boundingBox();
      const services = await trigger('AI Services').boundingBox();
      const y = services.y + services.height / 2;
      const fraction = (y - from.y) / (insurance.y + insurance.height / 2 - from.y);
      const x = from.x + (insurance.x + 10 - from.x) * fraction;
      await page.mouse.move(x, y);
      await expect(group('Industries')).toHaveAttribute('data-expanded', 'true');
      await expect(group('AI Services')).toHaveAttribute('data-expanded', 'true', { timeout: 900 });
      // Explicit keyboard selection bypasses any pending pointer delay.
      await start('Industries');
      await page.mouse.move(x, y);
      await trigger('Applications').press('Enter');
      await page.waitForTimeout(450);
      await expect(group('Applications')).toHaveAttribute('data-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(menu).not.toBeVisible();
      console.log(`${name}/${width}: diagonals, vertical switching, dwell and keyboard passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
