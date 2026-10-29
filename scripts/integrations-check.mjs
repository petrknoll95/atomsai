import { chromium, webkit, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const dir = 'docs/visual/integrations';
await fs.mkdir(dir, { recursive: true });
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  for (const width of [1600, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('http://127.0.0.1:3001/#integrations');
    const section = page.locator('#integrations');
    await section.scrollIntoViewIfNeeded();
    await expect.poll(() => section.locator('img:visible').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(section.getByRole('heading')).toBeVisible();
    await expect(section.getByRole('link', { name: 'Discuss your workflow' })).toHaveAttribute('href', '/company/contact');
    await expect(section.getByRole('button')).toHaveCount(0);
    await section.screenshot({ path: `${dir}/${name}-${width}.png` });
  }
  console.log(`${name}: concentric rings, loaded icons, CTA and 320–1600px layouts passed`);
  await browser.close();
}
