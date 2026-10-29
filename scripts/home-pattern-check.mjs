import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit, expect } from '@playwright/test';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const output = path.resolve('docs/patterns/homepage');
const deviceScaleFactor = Number(process.env.VISUAL_DPR || 1);
assert([1, 2].includes(deviceScaleFactor), 'VISUAL_DPR must be 1 or 2.');
const suffix = deviceScaleFactor === 1 ? '' : '-dpr2';
const applications = [
  'offerings-drift', 'offerings-concentric', 'offerings-band',
  'applications-drift', 'applications-band', 'applications-concentric', 'applications-offset',
  'preview-drift', 'preview-concentric', 'cta-pattern',
];
const legacyPaths = new Set(applications.map(application => `/assets/figma/${application}.png`));
const widths = deviceScaleFactor === 1 ? [1600, 1200, 768, 390, 320] : [1600, 390];
const report = {
  date: new Date().toISOString(), base, deviceScaleFactor, viewportHeight: 960,
  method: 'Fresh homepage at each width; legacy pattern PNG requests are blocked and fail the check. Each nonzero-size canvas is scrolled into view and must render before capture.',
  results: [], errors: [],
};

await fs.mkdir(output, { recursive: true });

async function settleFrames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function canvasState(page) {
  return page.locator('canvas[data-pattern]').evaluateAll(canvases => canvases.map(canvas => {
    const rect = canvas.getBoundingClientRect();
    return {
      application: canvas.closest('[data-home-pattern]')?.getAttribute('data-home-pattern') ?? null,
      state: canvas.dataset.renderState,
      decorative: !!canvas.parentElement?.closest('[aria-hidden="true"]'),
      width: rect.width, height: rect.height, top: rect.top, left: rect.left,
      bitmapWidth: canvas.width, bitmapHeight: canvas.height,
    };
  }));
}

async function waitReady(canvas) {
  // Stop promptly on a renderer failure instead of waiting out a ready-only assertion.
  await expect(canvas).toHaveAttribute('data-render-state', /^(ready|error|lost)$/, { timeout: 30_000 });
  await expect(canvas).toHaveAttribute('data-render-state', 'ready');
}

for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  try {
    for (const width of widths) {
      const page = await browser.newPage({
        viewport: { width, height: report.viewportHeight },
        deviceScaleFactor: report.deviceScaleFactor, reducedMotion: 'reduce',
      });
      const result = {
        engine: engineName, width, passed: false, checks: [],
        legacyRequests: [], browserErrors: [], contextEvents: [],
      };
      report.results.push(result);
      page.setDefaultTimeout(30_000);
      page.on('pageerror', error => result.browserErrors.push({ type: 'page', message: error.message }));
      page.on('console', message => {
        if (message.type() === 'error' || /context.*lost|too many active webgl/i.test(message.text())) {
          result.browserErrors.push({ type: `console:${message.type()}`, message: message.text() });
        }
      });
      page.on('requestfailed', request => {
        result.browserErrors.push({ type: 'request', url: request.url(), message: request.failure()?.errorText });
      });
      await page.route(url => legacyPaths.has(url.pathname), async route => {
        result.legacyRequests.push(route.request().url());
        await route.abort('blockedbyclient');
      });
      await page.addInitScript(() => {
        window.__homePatternContextEvents = [];
        for (const type of ['webglcontextlost', 'webglcontextrestored']) {
          document.addEventListener(type, event => {
            window.__homePatternContextEvents.push({
              type, application: event.target.closest?.('[data-home-pattern]')?.getAttribute('data-home-pattern') ?? null,
              time: performance.now(),
            });
          }, true);
        }
      });

      try {
        await page.goto(base, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await settleFrames(page);

        const placements = await page.locator('[data-home-pattern]').evaluateAll(wrappers => wrappers.map(wrapper => ({
          application: wrapper.getAttribute('data-home-pattern'),
          canvasCount: wrapper.querySelectorAll('canvas').length,
          hidden: wrapper.getAttribute('aria-hidden'),
        })));
        assert.deepEqual([...new Set(placements.map(placement => placement.application))].sort(), [...applications].sort(), 'All ten homepage applications must be present.');
        assert.equal(placements.length, 11, 'The ten placements and one WebKit backdrop duplicate must be present.');
        assert.equal(placements.filter(placement => placement.application === 'preview-concentric').length, 2);
        assert(placements.every(placement => placement.canvasCount === 1 && placement.hidden === 'true'), 'Each decorative placement must contain exactly one canvas.');
        result.initialCanvases = await canvasState(page);
        assert.equal(result.initialCanvases.length, 12, 'No missing or unexpected homepage canvases.');
        assert(result.initialCanvases.every(canvas => canvas.decorative), 'Every canvas must have an aria-hidden ancestor.');
        result.checks.push('Ten unique applications, twelve decorative canvases including glass fallbacks');

        result.initialLazyCanvases = ['preview-drift', 'preview-concentric', 'cta-pattern'].map(application => {
          const canvas = result.initialCanvases.find(candidate => candidate.application === application && candidate.width > 0 && candidate.height > 0);
          assert(canvas, `Missing nonzero-size ${application} canvas.`);
          assert(canvas.top > report.viewportHeight + 400, `${application} should begin beyond the lazy-loading margin.`);
          assert.equal(canvas.state, 'pending', `${application} rendered before scrolling near its section.`);
          return canvas;
        });
        result.checks.push('Below-fold preview and CTA canvases remain pending initially');

        const canvases = page.locator('canvas[data-pattern]');
        for (let index = 0; index < await canvases.count(); index++) {
          const canvas = canvases.nth(index);
          const box = await canvas.boundingBox();
          if (!box || !box.width || !box.height) continue;
          await canvas.scrollIntoViewIfNeeded();
          await waitReady(canvas);
        }
        result.checks.push('Every nonzero-size canvas renders after scrolling into view');

        const chatPatterns = page.locator('[data-home-pattern="preview-concentric"]');
        result.chatBackdrop = await chatPatterns.nth(1).evaluate(wrapper => {
          const backdrop = wrapper.parentElement;
          const widget = wrapper.closest('#property-preview');
          return {
            rect: wrapper.getBoundingClientRect().toJSON(), widget: widget.getBoundingClientRect().toJSON(),
            display: getComputedStyle(backdrop).display, position: getComputedStyle(backdrop).position,
            blur: getComputedStyle(backdrop).filter,
            blend: getComputedStyle(backdrop.parentElement, '::after').mixBlendMode,
            state: wrapper.querySelector('canvas').dataset.renderState,
          };
        });
        const backdrop = result.chatBackdrop;
        if (engineName === 'webkit') {
          assert.notEqual(backdrop.display, 'none', 'WebKit requires the visible procedural glass backdrop.');
          assert.equal(backdrop.state, 'ready');
          assert.equal(backdrop.position, 'absolute');
          assert.equal(backdrop.blur, 'blur(32px)');
          assert.equal(backdrop.blend, 'plus-darker');
          for (const dimension of ['x', 'y', 'width', 'height']) {
            assert(Math.abs(backdrop.rect[dimension] - backdrop.widget[dimension]) <= 0.5, `WebKit backdrop ${dimension} must align with the full chat widget.`);
          }
          result.checks.push('WebKit glass backdrop renders, aligns with the full widget, and preserves blur/blending');
        } else {
          assert.equal(backdrop.display, 'none');
          assert.equal(backdrop.rect.width, 0);
          assert.equal(backdrop.rect.height, 0);
          assert.equal(backdrop.state, 'pending', 'The hidden fallback must not create a renderer.');
          result.checks.push('Hidden WebKit-only fallback stays zero-size and pending');
        }

        // Load normal photography/icons before the full-page captures, without
        // interfering with the earlier observation of lazy procedural canvases.
        await page.evaluate(async () => {
          document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
          await Promise.all(Array.from(document.images, image => image.decode().catch(() => {})));
          window.scrollTo(0, 0);
        });
        await settleFrames(page);
        result.finalCanvases = await canvasState(page);
        assert(result.finalCanvases.filter(canvas => canvas.width > 0 && canvas.height > 0).every(canvas => canvas.state === 'ready' && canvas.bitmapWidth > 0 && canvas.bitmapHeight > 0), 'All nonzero-size canvases must remain ready after returning to the top.');
        result.geometry = await page.evaluate(() => ({
          viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth, height: document.documentElement.scrollHeight,
          scrollX, scrollY,
        }));
        assert(result.geometry.documentWidth <= width && result.geometry.bodyWidth <= width, 'Homepage must not overflow horizontally.');
        assert.equal(result.geometry.scrollX, 0);
        assert.equal(result.geometry.scrollY, 0);
        result.checks.push('No horizontal overflow; rendered stills remain ready at the page top');

        if (width === 1600 || width === 390) {
          result.screenshot = `docs/patterns/homepage/integrated-${engineName}-${width}${suffix}.png`;
          await page.screenshot({ path: path.join(output, `integrated-${engineName}-${width}${suffix}.png`), fullPage: true, animations: 'disabled' });
        }
      } catch (error) {
        result.failure = error.message;
      } finally {
        result.contextEvents = await page.evaluate(() => window.__homePatternContextEvents ?? []).catch(() => []);
        if (result.legacyRequests.length) result.failure ??= 'The homepage requested legacy pattern PNGs.';
        if (result.browserErrors.length) result.failure ??= 'The browser reported errors.';
        if (result.contextEvents.some(event => event.type === 'webglcontextlost')) result.failure ??= 'A WebGL context was lost.';
        result.passed = !result.failure;
        if (result.passed) result.checks.push('No legacy PNG requests, browser errors, or context loss');
        else report.errors.push({ engine: engineName, width, message: result.failure });
        await page.close();
        console.log(`${engineName} ${width}: ${result.passed ? 'passed' : result.failure}`);
      }
    }
  } finally {
    await browser.close();
  }
}

await fs.writeFile(path.join(output, deviceScaleFactor === 1 ? 'integration-checks.json' : 'retina-checks.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checks: report.results.length, passed: report.results.filter(result => result.passed).length, errors: report.errors }, null, 2));
if (report.errors.length) process.exitCode = 1;
