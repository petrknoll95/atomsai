import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { chromium, webkit, expect } from '@playwright/test';
const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const out = 'docs/patterns/motion';
await fs.mkdir(out, { recursive: true });
const report = { date: new Date().toISOString(), base, results: [] };
const capture = async canvas => Buffer.from((await canvas.evaluate(c => c.toDataURL('image/png'))).split(',')[1], 'base64');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const range = async (page, name, value) => {
  await page.getByRole('slider', { name, exact: true }).evaluate((el, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
};
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, reducedMotion: 'reduce' });
  const result = { browser: name, checks: [], comparisons: [], errors: [] };
  report.results.push(result);
  page.on('pageerror', error => result.errors.push(error.message));
  await page.addInitScript(() => {
    window.__gpu = { draws: 0, allocations: 0, paletteWrites: 0, queries: 0, submitMs: [] };
    const proto = WebGL2RenderingContext.prototype;
    for (const key of ['createTexture', 'createFramebuffer', 'createProgram', 'texImage2D']) {
      const original = proto[key]; proto[key] = function(...args) { window.__gpu.allocations++; return original.apply(this, args); };
    }
    const uniform = proto.uniform3fv; proto.uniform3fv = function(...args) { window.__gpu.paletteWrites++; return uniform.apply(this, args); };
    for (const key of ['getError', 'getParameter', 'getUniformLocation']) {
      const original = proto[key]; proto[key] = function(...args) { window.__gpu.queries++; return original.apply(this, args); };
    }
    const draw = proto.drawArrays; proto.drawArrays = function(...args) {
      const start = performance.now(); const value = draw.apply(this, args);
      window.__gpu.draws++; window.__gpu.submitMs.push(performance.now() - start); return value;
    };
  });
  try {
    await page.goto(`${base}/patterns/motion`, { waitUntil: 'networkidle' });
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('data-render-state', 'ready');
    await expect(canvas).toHaveAttribute('data-playback', 'reduced');
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeDisabled();
    result.ripples = [];
    for (const count of [15, 29]) {
      await page.getByRole('button', { name: String(count), exact: true }).click();
      for (const palette of ['forest-dark', 'forest-light', 'iris']) {
        await page.getByLabel('Palette', { exact: true }).selectOption(palette);
        await range(page, 'Loop position', 0);
        const zero = await capture(canvas);
        await range(page, 'Loop position', 25);
        const quarter = await capture(canvas);
        await range(page, 'Loop position', 100);
        assert.equal(hash(zero), hash(await capture(canvas)), 'Ripple loop must close exactly');
        const { data: a, info } = await sharp(zero).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const b = await sharp(quarter).removeAlpha().raw().toBuffer();
        const displacement = Math.round((count === 15 ? 42 : 21) / 800 * Math.max(info.width, info.height) * 0.25);
        let outward = 0, inward = 0;
        // Track the lower radial ray: a crest must match farther from the center,
        // not closer. Ignore the center emergence region and the cropped edge.
        for (let y = Math.ceil(info.height / 2 + 55); y < info.height - 55; y++) {
          for (let x = Math.floor(info.width / 2 - 4); x <= info.width / 2 + 4; x++) {
            for (let k = 0; k < 3; k++) {
              const i = (y * info.width + x) * 3 + k;
              outward += Math.abs(a[i] - b[i + displacement * info.width * 3]);
              inward += Math.abs(a[i] - b[i - displacement * info.width * 3]);
            }
          }
        }
        assert(outward < inward * 0.7, `Rings must travel outward: ${outward}/${inward}`);
        await range(page, 'Loop position', 99.9); const before = await sharp(await capture(canvas)).raw().toBuffer();
        await range(page, 'Loop position', 0.1); const after = await sharp(await capture(canvas)).raw().toBuffer();
        const seamMean = before.reduce((sum, v, i) => sum + Math.abs(v - after[i]), 0) / before.length;
        assert(seamMean < 1, `No visible reset across ripple wrap: ${seamMean}`);
        result.ripples.push({ count, palette, seamIdentical: true, seamMean, outwardError: outward, inwardError: inward });
        if (count === 15 && palette === 'forest-dark') {
          await fs.writeFile(`${out}/${name}-ripple-start.png`, zero);
          await fs.writeFile(`${out}/${name}-ripple-quarter.png`, quarter);
          if (name === 'chromium') await sharp({ create: { width: 1000, height: 500, channels: 3, background: '#fff' } })
            .composite(await Promise.all([zero, quarter].map(async (buffer, i) => ({ input: await sharp(buffer).resize(500, 500).toBuffer(), left: i * 500, top: 0 }))))
            .png().toFile(`${out}/ripple-comparison.png`);
        }
      }
    }
    await page.getByLabel('Palette', { exact: true }).selectOption('forest-dark');
    for (const family of ['drift', 'offset', 'single-band', 'concentric']) {
      await page.getByLabel('Pattern family').selectOption(family);
      for (const [id, label] of [['breath', 'Tonal breath'], ['tide', 'Light tide'], ['orbit', 'Orbiting sheen'], ['silk', 'Silk interference']]) {
        await page.getByRole('button', { name: new RegExp(label) }).click();
        await range(page, 'Loop position', 0);
        const zero = await capture(canvas);
        await range(page, 'Loop position', 25);
        const quarter = await capture(canvas);
        assert.notEqual(hash(zero), hash(quarter), `${family}/${id} must visibly change`);
        await range(page, 'Loop position', 100);
        const end = await capture(canvas);
        assert.equal(hash(zero), hash(end), `${family}/${id} must have a pixel-identical seam`);
        await range(page, 'Loop position', 25);
        await page.getByRole('button', { name: 'Compare still', exact: true }).click();
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        assert.equal(hash(zero), hash(await capture(canvas)), 'Compare must restore source still at any phase');
        await page.getByRole('button', { name: 'Compare still', exact: true }).click();
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const a = await sharp(zero).removeAlpha().raw().toBuffer(), b = await sharp(quarter).removeAlpha().raw().toBuffer();
        let sum = 0, maximum = 0, changedPixels = 0;
        for (let i = 0; i < a.length; i++) { const delta = Math.abs(a[i] - b[i]); sum += delta; maximum = Math.max(maximum, delta); }
        for (let i = 0; i < a.length; i += 3) {
          if (Math.max(...[0, 1, 2].map(k => Math.abs(a[i + k] - b[i + k]))) >= 8) changedPixels++;
        }
        const meanChange = sum / a.length, changedPixelFraction = changedPixels / (a.length / 3);
        // Guard against the previous imperceptible, mutually cancelling blend.
        // Numeric thresholds complement visual review; unequal PNGs alone are insufficient.
        assert(meanChange >= 3, `${family}/${id}: insufficient tonal movement (${meanChange})`);
        assert(changedPixelFraction >= 0.2, `${family}/${id}: movement covers too little of the field`);
        result.comparisons.push({ family, motion: id, seamIdentical: true, meanChange, maxChange: maximum, changedPixelFraction });
        if (family === 'concentric') {
          await fs.writeFile(`${out}/${name}-${id}-still.png`, zero);
          await fs.writeFile(`${out}/${name}-${id}-quarter.png`, quarter);
          if (name === 'chromium' && id === 'tide') {
            await sharp({ create: { width: 1000, height: 500, channels: 3, background: '#fff' } })
              .composite(await Promise.all([zero, quarter].map(async (buffer, i) => ({
                input: await sharp(buffer).resize(500, 500).toBuffer(), left: i * 500, top: 0,
              }))))
              .png().toFile(`${out}/tide-comparison.png`);
          }
        }
      }
    }
    result.checks.push('All 16 family/motion combinations meet tonal-change thresholds (mean >= 3/255; >= 20% of pixels change by >= 8/255 in at least one channel); phase 0 equals 1 exactly; still comparison matches phase 0');
    for (const palette of ['forest-light', 'iris', 'forest-dark']) {
      await page.getByLabel('Palette', { exact: true }).selectOption(palette);
      await expect(canvas).toHaveAttribute('data-render-state', 'ready');
    }
    await page.getByRole('button', { name: /Expanding waves/ }).click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(canvas).toHaveAttribute('data-playback', 'playing');
    await page.waitForTimeout(250);
    const start = await page.evaluate(() => ({ ...window.__gpu, now: performance.now() }));
    await page.waitForTimeout(2000);
    const end = await page.evaluate(() => ({ ...window.__gpu, now: performance.now() }));
    assert.equal(end.allocations, start.allocations, 'No GPU allocation during playback');
    assert.equal(end.paletteWrites, start.paletteWrites, 'Palette uniforms must remain fixed');
    assert.equal(end.queries, start.queries, 'No blocking GL queries during playback');
    const draws = end.draws - start.draws;
    assert(draws > 5 && draws <= (end.now - start.now) / 1000 * 31 + 2, 'Composite submission must be active and capped at 30fps');
    result.performance = { compositeDraws: draws, seconds: (end.now - start.now) / 1000, submissionsPerSecond: draws / ((end.now - start.now) / 1000), allocations: 0, paletteWrites: 0, blockingQueries: 0, retainedMaskBytes: Number(await canvas.getAttribute('data-retained-mask-bytes')) };
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await canvas.getAttribute('data-motion-frames');
    await page.waitForTimeout(200);
    assert.equal(await canvas.getAttribute('data-motion-frames'), paused);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(canvas).toHaveAttribute('data-playback', 'reduced');
    const frozen = await canvas.getAttribute('data-motion-frames');
    await page.waitForTimeout(200);
    assert.equal(await canvas.getAttribute('data-motion-frames'), frozen);
    result.checks.push('Playback has no per-frame allocations, palette writes or blocking GL queries; capped at 30fps; pause and live reduced motion stop draws');
    await range(page, 'Loop position', 25);
    const beforeLoss = hash(await capture(canvas));
    const canLose = await canvas.evaluate(canvas => {
      const ext = canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
      if (!ext) return false;
      ext.loseContext(); setTimeout(() => ext.restoreContext(), 150); return true;
    });
    if (canLose) { await page.waitForTimeout(350); await expect(canvas).toHaveAttribute('data-render-state', 'ready'); assert.equal(hash(await capture(canvas)), beforeLoss); result.checks.push('Context restoration reconstructs the exact paused frame'); }
    await page.screenshot({ path: `${out}/${name}-desktop.png`, fullPage: true });
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 390) await page.screenshot({ path: `${out}/${name}-mobile.png`, fullPage: true });
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.locator('footer').scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
    const offscreen = await canvas.getAttribute('data-motion-frames');
    await page.waitForTimeout(200); assert.equal(await canvas.getAttribute('data-motion-frames'), offscreen);
    await canvas.scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
    assert(Number(await canvas.getAttribute('data-motion-frames')) > Number(offscreen));
    result.checks.push('No overflow at 768/390/320px; offscreen preview stops and resumes');
  } catch (error) { result.errors.push(error.stack); }
  await browser.close();
  console.log(`${name}: ${result.errors.length ? result.errors.join('\n') : 'passed'}`);
}
await fs.writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
if (report.results.some(result => result.errors.length)) process.exitCode = 1;
