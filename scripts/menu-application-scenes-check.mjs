import { chromium, webkit, expect } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('docs/visual/menu-application-scenes', { recursive: true });
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1600, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('http://localhost:3001/approach');
    if (response.status() !== 200) throw Error(`Preview returned ${response.status()}`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('[data-menu="Applications"] > summary').hover();
    for (const product of ['JustCall', 'Helpwise', 'ServiceAgent', 'CallPage']) {
      const item = page.locator('[data-applications-panel] a').filter({ hasText: product }).first();
      await item.hover();
      const preview = page.locator(`[data-product-preview="${product}"]`);
      await expect(preview).toHaveCSS('opacity', '1');
      const bounds = await preview.evaluate(element => {
        const frame = element.getBoundingClientRect();
        const scene = element.querySelector('[data-preview-object]').getBoundingClientRect();
        return { fits: scene.left >= frame.left && scene.right <= frame.right + 1 && scene.top >= frame.top && scene.bottom <= frame.bottom + 1, overflow: element.scrollWidth > element.clientWidth };
      });
      if (!bounds.fits || bounds.overflow) throw Error(`${name}/${width}/${product}: ${JSON.stringify(bounds)}`);
      await preview.screenshot({ path: `docs/visual/menu-application-scenes/${name}-${product.toLowerCase()}-${width}.png` });
      await item.focus();
      await expect(item).toHaveAttribute('data-active', 'true');
    }
  }
  await page.goto('http://localhost:3001/');
  await expect(page.locator('main [data-serviceagent-system] > div')).toHaveCount(3);
  await expect(page.locator('main [data-callpage-system] [data-active]')).toHaveCount(4);
  if (errors.length) throw Error(errors.join('\n'));
  console.log(`${name}: four compact previews fit at 1200/1600px, hover/focus selection works, full homepage variants preserved`);
  await browser.close();
}
