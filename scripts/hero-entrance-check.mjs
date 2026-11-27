import { chromium, expect } from '@playwright/test';

const url = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const browser = await chromium.launch();
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    // Keep hydration and custom fonts pending while checking the first paint.
    let resume;
    const hold = new Promise(resolve => { resume = resolve; });
    await page.route('**/*', async route => {
      if (['script', 'font'].includes(route.request().resourceType())) await hold;
      await route.continue();
    });
    await page.goto(url, { waitUntil: 'commit' });
    const copy = page.locator('[data-hero-copy-entrance]');
    try {
      await expect(copy.getByRole('heading', { level: 1 })).toBeInViewport();
      await expect(copy.locator('p')).toBeVisible();
      await expect(copy.getByRole('link', { name: 'Talk to AtomsAI' })).toHaveAttribute('href', /company\/contact/);
      await expect(copy).toHaveCSS('opacity', '1');
      await expect(copy.getByRole('heading')).toHaveCSS('opacity', '1');
      await expect(page.locator('[data-hero-pattern-entrance] canvas')).toHaveCount(0);
    } finally { resume(); }
    await expect(page.locator('[data-hero-pattern-entrance]')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
    await expect(copy.getByRole('heading')).toBeVisible();
    await page.close();
  }
} finally { await browser.close(); }
