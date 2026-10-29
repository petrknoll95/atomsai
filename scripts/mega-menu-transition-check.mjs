import { chromium, webkit, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const output = 'docs/visual/mega-menu-transition';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3001/');
  const viewport = page.locator('[data-desktop-menu-viewport]');
  const trigger = label => page.locator(`[data-menu="${label}"] > summary`);
  await trigger('Applications').hover();
  await expect(viewport).toBeVisible();
  await page.waitForTimeout(500);

  for (const [from, to, direction] of [['Applications', 'Industries', 1], ['Industries', 'Applications', -1]]) {
    await page.evaluate(() => {
      const surface = document.querySelector('[data-desktop-menu-viewport]');
      window.menuSurface = surface;
      window.menuFrames = [];
      window.menuSampling = true;
      const sample = () => {
        window.menuFrames.push({ sameSurface: surface === document.querySelector('[data-desktop-menu-viewport]'), opacity: Number(getComputedStyle(surface).opacity), height: surface.getBoundingClientRect().height,
          panes: [...surface.querySelectorAll('[data-dropdown-pane]')].map(pane => ({ name: pane.dataset.dropdownPane, active: pane.dataset.dropdownActive === 'true', x: new DOMMatrix(getComputedStyle(pane).transform).m41, opacity: Number(getComputedStyle(pane).opacity), inert: pane.inert })) });
        if (window.menuSampling) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await trigger(to).hover();
    await page.waitForTimeout(650);
    const frames = await page.evaluate(() => { window.menuSampling = false; return window.menuFrames; });
    if (!frames.every(frame => frame.sameSurface && frame.opacity === 1)) throw Error(`${name}: background changed or faded`);
    if (!frames.some(frame => frame.panes.some(pane => pane.name === to && pane.x * direction > 1))) throw Error(`${name}: incoming slide direction missing`);
    if (!frames.some(frame => frame.panes.some(pane => pane.name === from && pane.x * direction < -1))) throw Error(`${name}: outgoing slide direction missing`);
    const heights = frames.map(frame => frame.height);
    const min = Math.min(...heights), max = Math.max(...heights);
    if (max - min < 2 || !heights.some(height => height > min + 1 && height < max - 1)) throw Error(`${name}: height did not interpolate`);
    if (frames.some(frame => frame.panes.some(pane => !pane.active && !pane.inert))) throw Error(`${name}: inactive content is focusable`);
    await expect(page.locator('[data-dropdown-pane]')).toHaveCount(1);
    results.push({ browser: name, from, to, frames });
  }

  // Interrupted transitions must converge to one active pane and one opaque surface.
  for (const label of ['Infrastructure', 'Company', 'Industries', 'Applications', 'Resources']) {
    await trigger(label).hover(); await page.waitForTimeout(55);
  }
  await page.waitForTimeout(550);
  await expect(page.locator('[data-dropdown-pane]')).toHaveCount(1);
  await expect(page.locator('[data-dropdown-pane="Resources"]')).toBeVisible();
  await expect(viewport).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${output}/${name}-settled.png` });

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'AI Services' }).hover();
  await expect(viewport).toBeHidden();
  await trigger('Industries').hover();
  await page.waitForTimeout(300);
  await page.mouse.move(10, 850);
  await expect(viewport).toBeHidden();
  await trigger('Company').hover();
  await page.waitForTimeout(300);
  await page.mouse.move(10, 850);
  await page.waitForTimeout(220);
  await trigger('Applications').hover();
  await expect(viewport).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator('[data-dropdown-pane]')).toHaveCount(1);
  await trigger('Applications').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-dropdown-pane="Applications"] a').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(trigger('Applications')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(viewport).toBeHidden();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger('Industries').hover();
  await trigger('Company').hover();
  await expect(page.locator('[data-dropdown-pane]')).toHaveCount(1);
  await expect(viewport).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-dropdown-pane="Company"]')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  if (errors.length) throw Error(errors.join('\n'));
  console.log(`${name}: persistent background, directional slides, interpolated height, rapid switching, close/reopen, keyboard and reduced motion passed`);
  await browser.close();
}
await fs.writeFile(`${output}/frames.json`, JSON.stringify(results, null, 2));
