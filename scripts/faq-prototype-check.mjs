import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/#faq`, { waitUntil: 'networkidle' });

      const faq = page.locator('#faq');
      const input = faq.getByRole('textbox', { name: 'Ask a question' });
      const submit = faq.getByRole('button', { name: 'Submit question' });
      const results = faq.locator('[data-generated-question]');
      await input.fill('   ');
      await expect(submit).toBeDisabled();
      await input.press('Enter');
      await expect(results).toHaveCount(0);

      for (const [query, text, link, destination] of [
        ['How is our data protected?', 'product-specific documentation', 'Trust Center', '/trust'],
        ['What can the front desk agent do?', 'handle calls, bookings, and office work', 'Listen to the ServiceAgent demos', '#applications'],
        ['Can we integrate PyAI into our product?', 'PyAI infrastructure', 'PyAI infrastructure', 'https://pyai.com/'],
        ['What is the weather tomorrow?', 'We don’t have a published answer', 'Ask the AtomsAI team', '/company/contact'],
      ]) {
        await input.fill(query);
        await input.press('Enter');
        await expect(input).toHaveValue('');
        await expect(faq.locator('details[open]')).toHaveCount(1);
        const answer = results.last().locator('[data-faq-answer]');
        await expect(answer).toBeVisible();
        await expect(answer).toContainText(text);
        await expect(answer.getByRole('link', { name: link, exact: true })).toHaveAttribute('href', destination);
      }
      await expect(results).toHaveCount(4);
      await results.first().locator('summary').press('Enter');
      await expect(results.first().locator('[data-faq-answer]')).toBeVisible();
      await expect(results.last().locator('[data-faq-answer]')).toBeHidden();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`${name} ${width}: FAQ answers, fallback, and accordion passed`);
    }
  } finally { await browser.close(); }
}
