import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const output = 'docs/visual/hero-intro';
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 960 }, ...(width === 390 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:3001/', { waitUntil: 'domcontentloaded' });
      const host = page.locator('[data-hero-atoms]');
      await expect(host).toHaveAttribute('data-state', 'ready');
      const frames = await host.evaluate(async el => {
        const canvas = el.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const result = [];
        const start = performance.now();
        for (const at of [0, 300, 700, 1400, 2900]) {
          await new Promise(resolve => setTimeout(resolve, Math.max(0, at - (performance.now() - start))));
          const { width: w, height: h } = canvas;
          const pixels = ctx.getImageData(0, 0, w, h).data;
          const ratio = w / canvas.clientWidth;
          const cx = w / 2, cy = Math.min(280, canvas.clientHeight * .292) * ratio;
          const radii = [];
          for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) {
            if (pixels[(y * w + x) * 4 + 3] > 20) radii.push(Math.hypot(x - cx, y - cy) / ratio);
          }
          radii.sort((a,b) => a-b);
          result.push({ at, radius95: radii[Math.floor(radii.length * .95)] || 0, inkSamples: radii.length, intro: el.dataset.intro, image: canvas.toDataURL() });
        }
        return result;
      });
      assert(frames[0].radius95 < frames.at(-1).radius95 * .35, 'Entrance starts near the nucleus');
      assert(frames[2].radius95 > frames[0].radius95 * 2, 'Burst must visibly expand');
      await expect(host).toHaveAttribute('data-intro', 'complete');
      for (let i = 0; i < frames.length; i++) {
        const image = Buffer.from(frames[i].image.split(',')[1], 'base64');
        if (width === 1440) await sharp(image).flatten({ background: '#fafafa' }).resize({ width: 600 }).png().toFile(`${output}/${name}-${i}.png`);
        delete frames[i].image;
      }
      await page.setViewportSize({ width: width === 1440 ? 1024 : 375, height: 960 });
      await expect(host).toHaveAttribute('data-intro', 'complete');
      await page.mouse.move(100, 200);
      await page.mouse.move(300, 230, { steps: 4 });
      await expect(host).toHaveAttribute('data-intro', 'complete');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(host).toHaveAttribute('data-playback', 'reduced');
      await page.reload();
      await expect(host).toHaveAttribute('data-intro', 'complete');
      const before = await host.locator('canvas').evaluate(c => c.toDataURL());
      await page.waitForTimeout(300);
      assert.equal(await host.locator('canvas').evaluate(c => c.toDataURL()), before);
      assert.deepEqual(errors, []);
      results.push({ browser: name, width, frames, resizeDoesNotReplay: true, reducedMotionSkips: true, errors });
      console.log(`${name}/${width}: radial entrance and reduced-motion checks passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
