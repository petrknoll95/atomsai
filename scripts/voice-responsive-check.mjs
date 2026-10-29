import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const output = 'docs/visual/voice-responsive';
await fs.mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/#technology`);
    await page.evaluate(() => document.fonts.ready);
    const glass = page.getByRole('link', { name: 'Start talking in the PyAI playground (opens in a new tab)' }).locator('..');
    const widths = [];
    for (const width of [320, 360, 390, 480, 599, 600, 768, 899, 900, 960, 1024, 1100, 1199, 1200, 1440, 1600]) {
      await page.setViewportSize({ width, height: 960 });
      await glass.scrollIntoViewIfNeeded();
      const geometry = await glass.evaluate(panel => {
        const bounds = panel.getBoundingClientRect();
        const radius = Math.min(parseFloat(getComputedStyle(panel).borderTopLeftRadius), bounds.width / 2, bounds.height / 2);
        const inside = (x, y) => {
          x -= bounds.left; y -= bounds.top;
          if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) return false;
          const dx = Math.max(radius - x, 0, x - (bounds.width - radius));
          const dy = Math.max(radius - y, 0, y - (bounds.height - radius));
          return dx * dx + dy * dy <= radius * radius + 1;
        };
        const clipped = [];
        // Test glyph bounds against the actual rounded clip, not just its box.
        for (const element of panel.querySelectorAll('a, p')) {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            for (let i = 0; i < node.length; i++) {
              if (!node.textContent[i].trim()) continue;
              const range = document.createRange();
              range.setStart(node, i); range.setEnd(node, i + 1);
              const r = range.getBoundingClientRect();
              if (![[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]].every(([x, y]) => inside(x, y))) clipped.push(node.textContent[i]);
            }
          }
        }
        return { width: bounds.width, height: bounds.height, radius, clipped, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.deepEqual(geometry.clipped, [], `${name}: clipped text at ${width}px`);
      assert.equal(geometry.overflow, false, `${name}: overflow at ${width}px`);
      if ([320, 1024, 1600].includes(width)) await glass.screenshot({ path: `${output}/${name}-${width}.png` });
      widths.push({ viewport: width, ...geometry });
    }
    assert.deepEqual(errors, []);
    results.push({ browser: name, widths, errors });
    console.log(`${name}: all text inside rounded clip at ${widths.length} widths; no overflow`);
  } finally { await browser.close(); }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ base, results }, null, 2) + '\n');
