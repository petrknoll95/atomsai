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
      await page.addInitScript(() => {
        window.entryFrames = [];
        let start;
        function sample(now) {
          const header = document.querySelector('header');
          const targets = [document.querySelector('[data-hero-entry="badge"]'), document.querySelector('[data-hero-entry="lead"]'), ...document.querySelectorAll('[data-hero-entry="buttons"] > a')];
          if (header && targets.length === 4 && targets.every(Boolean) && (start !== undefined || header.getAnimations().length)) {
            start ??= now;
            const box = header.getBoundingClientRect();
            window.entryFrames.push({ time: now - start, top: box.top, bottom: box.bottom, opacity: targets.map(el => Number(getComputedStyle(el).opacity)) });
          }
          if (start === undefined || now - start < 2200) requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      await page.goto('http://127.0.0.1:3001/', { waitUntil: 'domcontentloaded' });
      await expect.poll(() => page.evaluate(() => window.entryFrames.at(-1)?.time || 0)).toBeGreaterThan(2100);
      const frames = await page.evaluate(() => window.entryFrames);
      await fs.writeFile(`docs/visual/page-entry/${name}-${width}-frames.json`, JSON.stringify(frames));
      assert(frames.some(f => f.bottom <= 0), 'Header starts fully above the viewport');
      assert.equal(frames.at(-1).top, 0);
      // Initial shader setup can block JS sampling in headless browsers while
      // compositor animations continue. Seek the actual CSS animations after
      // load as well, to measure their intermediate geometry deterministically.
      const samples = await page.evaluate(() => {
        const header = document.querySelector('header');
        const targets = [header, document.querySelector('[data-hero-entry="badge"]'), document.querySelector('[data-hero-entry="lead"]'), ...document.querySelectorAll('[data-hero-entry="buttons"] > a')];
        targets.forEach(el => { el.style.animation = 'none'; });
        void header.offsetHeight;
        targets.forEach(el => el.style.removeProperty('animation'));
        const animations = targets.map(el => el.getAnimations()[0]);
        animations.forEach(animation => animation.pause());
        const samples = [0, 250, 500, 1000, 1900].map(time => {
          animations.forEach(animation => { animation.currentTime = time; });
          const box = header.getBoundingClientRect();
          return { time, top: box.top, bottom: box.bottom, opacity: targets.slice(1).map(el => Number(getComputedStyle(el).opacity)) };
        });
        animations.forEach(animation => animation.finish());
        return samples;
      });
      assert(samples.some(f => f.top < -1 && f.bottom > 1), 'Header travels through intermediate positions');
      assert(samples[2].opacity[0] > samples[2].opacity[1], 'Badge leads supporting copy');
      assert(samples[3].opacity[1] > samples[3].opacity[2] && samples[3].opacity[2] > samples[3].opacity[3], 'Copy and buttons are staggered');
      assert(samples.at(-1).opacity.every(v => v === 1));
      await expect(page.getByRole('banner')).toHaveCSS('transform', 'none');
      await expect(page.locator('#hero-heading')).toHaveAttribute('data-text-reveal-state', 'visible');
      await page.screenshot({ path: `docs/visual/page-entry/${name}-${width}.png` });
      await page.getByRole('button', { name: 'Open site menu' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      // Restart only the CSS entrances to test interruption by keyboard focus.
      await page.evaluate(() => {
        const header = document.querySelector('header');
        delete header.dataset.entryComplete; header.style.animation = 'none'; void header.offsetHeight; header.style.animation = '';
        header.querySelector('a').focus({ preventScroll: true });
      });
      await expect(page.getByRole('banner')).toHaveCSS('transform', 'none');
      await page.locator('[data-hero-entry="buttons"] a').first().focus();
      await expect(page.getByRole('banner')).toHaveCSS('transform', 'none');
      for (const element of await page.locator('[data-hero-entry="badge"], [data-hero-entry="lead"], [data-hero-entry="buttons"] > a').all()) await expect(element).toHaveCSS('opacity', '1');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await expect(page.getByRole('banner')).toHaveCSS('animation-name', 'none');
      await expect(page.locator('[data-hero-entry="lead"]')).toHaveCSS('animation-name', 'none');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      results.push({ browser: name, width, samples, frames, focusReveals: true, menuWorks: true, reducedMotion: true, errors });
      console.log(`${name}/${width}: header descent, staggered hero, focus and reduced motion passed`);
      await page.close();
    }
    const noJS = await browser.newPage({ javaScriptEnabled: false });
    await noJS.goto('http://127.0.0.1:3001/');
    await expect(noJS.getByRole('banner')).toHaveCSS('transform', 'none');
    await expect(noJS.locator('[data-hero-entry="lead"]')).toHaveCSS('opacity', '1');
    await noJS.close();
  } finally { await browser.close(); }
}
await fs.writeFile('docs/visual/page-entry/results.json', JSON.stringify(results, null, 2) + '\n');
