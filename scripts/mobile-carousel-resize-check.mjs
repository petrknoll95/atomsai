import { chromium, webkit, expect } from '@playwright/test';

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, reducedMotion: 'reduce' });
    await page.goto(process.env.VISUAL_URL || 'http://127.0.0.1:3002/');
    const logos = page.locator('[data-hero-products]');
    const marquee = logos.locator('[data-enhanced]');
    const story = page.locator('#customer-story-content [aria-roledescription="slide"][aria-hidden="false"]');
    const stats = story.locator('[data-story-stats]');
    await page.getByRole('button', { name: 'Go to story 2' }).click();
    const selected = page.getByRole('button', { name: 'Go to story 2' });

    for (const [mobile, desktop] of [[390, 1280], [767, 768], [320, 1440]]) {
      await page.setViewportSize({ width: mobile, height: 850 });
      await expect(marquee).toHaveCount(1);
      await expect.poll(() => stats.evaluate(row => row.scrollLeft)).toBe(0);
      await stats.evaluate(row => row.scrollTo({ left: row.scrollWidth, behavior: 'instant' }));
      await expect.poll(() => stats.evaluate(row => row.scrollLeft)).toBeGreaterThan(50);
      await page.setViewportSize({ width: desktop, height: 850 });
      await expect(marquee).toHaveCount(0);
      await expect(logos.locator('a:visible')).toHaveCount(4);
      await expect(logos.locator('[style*="translate"]')).toHaveCount(0);
      await expect.poll(() => stats.evaluate(row => row.scrollWidth - row.clientWidth)).toBe(0);
      await expect(selected).toHaveAttribute('aria-current', 'true');
    }

    await page.setViewportSize({ width: 393, height: 850 });
    await marquee.scrollIntoViewIfNeeded();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const position = () => marquee.locator(':scope > div').evaluate(track => track.style.transform);
    const initial = await position();
    await expect.poll(position).not.toBe(initial);
    console.log(engine.name(), 'passed');
  } finally {
    await browser.close();
  }
}
