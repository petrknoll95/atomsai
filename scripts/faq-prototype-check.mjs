import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:3001/#faq');
      await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll', 'true');
      const input = page.getByRole('textbox', { name: 'Ask a question' });
      const submit = page.getByRole('button', { name: 'Submit question', exact: true });
      await expect(submit).toBeDisabled();
      await input.fill('   ');
      await input.press('Enter');
      await expect(page.locator('[data-generated-question]')).toHaveCount(0);
      await input.fill('Where should our team start with AI?');
      await input.press('Enter');
      const added = page.locator('[data-generated-question]');
      await expect(added).toHaveCount(1);
      await expect(added.locator('details')).toHaveAttribute('open', '');
      await expect(added.locator('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
      await expect(input).toHaveValue('');
      // Prevent duplicate submissions while allowing the next question to be drafted.
      await input.fill('Can we try a small pilot first?');
      await input.press('Enter');
      await expect(added).toHaveCount(1);
      const logo = added.locator('[data-animated-logo]');
      await expect(logo).toHaveCSS('width', '20px');
      const cycleSeconds = await logo.locator('animate').first().getAttribute('dur');
      const threeLoopsMs = parseFloat(cycleSeconds) * 3 * 1000;
      await page.waitForTimeout(threeLoopsMs - 500);
      await expect(added.locator('[data-thinking]')).toHaveCSS('opacity', '1');
      await expect(added.locator('[data-answer-word]').first()).toHaveCSS('opacity', '0');
      const frames = await added.evaluate(async el => {
        const frames = [];
        const start = performance.now();
        while (performance.now() - start < 3400) {
          await new Promise(requestAnimationFrame);
          frames.push({ height: el.getBoundingClientRect().height,
            visible: [...el.querySelectorAll('[data-answer-word]')].filter(word => Number(getComputedStyle(word).opacity) > .8).length });
        }
        return frames;
      });
      assert(frames.some(f => f.visible > 0 && f.visible < 50), 'Answer should reveal progressively');
      await expect(added.locator('[aria-busy]')).toHaveAttribute('aria-busy', 'false');
      await expect(added.locator('[data-generated-slot]')).toHaveAttribute('aria-hidden', 'false');
      await added.screenshot({ path: `docs/visual/faq-prototype/${name}-${width}.png` });
      await submit.click();
      await expect(added).toHaveCount(2);
      await expect(added.nth(0).locator('details')).not.toHaveAttribute('open', '');
      await expect(added.nth(1).locator('details')).toHaveAttribute('open', '');
      await expect(added.nth(1).locator('[aria-busy]')).toHaveAttribute('aria-busy', 'false', { timeout: 20000 });
      await added.nth(1).locator('summary').click();
      await expect(added.nth(1).locator('details')).not.toHaveAttribute('open', '');
      await added.nth(1).locator('summary').press('Enter');
      await expect(added.nth(1).locator('details')).toHaveAttribute('open', '');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await input.fill('A'.repeat(200));
      await input.press('Enter');
      await expect(added).toHaveCount(3);
      await expect(added.nth(2).locator('[aria-busy]')).toHaveAttribute('aria-busy', 'false');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      assert.deepEqual(errors, []);
      results.push({ browser: name, width, frames, blankInput: true, repeatedSubmissions: true, accordion: true, reducedMotion: true, errors });
      await page.close();
      console.log(`${name} ${width}: passed`);
    }
  } finally { await browser.close(); }
}
await fs.writeFile('docs/visual/faq-prototype/results.json', JSON.stringify(results, null, 2) + '\n');
