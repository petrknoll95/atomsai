import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';
for (const [name, engine] of Object.entries({ chromium, webkit })) {
 const browser = await engine.launch();
 const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
 const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
 try {
  await page.goto('http://localhost:3001/#integrations', { waitUntil: 'networkidle' });
  const root = page.locator('[data-integration-orbits]');
  await root.scrollIntoViewIfNeeded();
  await expect(root).toHaveAttribute('data-running', 'true');
  const sample = () => root.evaluate(el => [...el.querySelectorAll('[data-orbit]')].map(ring => {
   const angle = node => { const m = new DOMMatrix(getComputedStyle(node).transform); return Math.atan2(m.b,m.a) * 180 / Math.PI; };
   return { ring: angle(ring), upright: angle(ring.firstElementChild.firstElementChild) };
  }));
  const a = await sample(); await page.waitForTimeout(1000); const b = await sample();
  b.forEach((current, i) => {
   const delta = current.ring - a[i].ring;
   assert(i % 2 ? delta < -.1 : delta > .1, `Ring ${i} counter rotation: ${delta}`);
   assert(Math.abs(current.ring + current.upright) < .1, 'Logos stay upright');
  });
  const logos = () => root.locator('img').evaluateAll(imgs => imgs.map(img => img.src).sort());
  const before = await logos(); await page.waitForTimeout(6500); const after = await logos();
  assert.notDeepEqual(after, before, 'Logo swaps continue');
  assert.equal(after.length, new Set(after).size, 'No duplicate logos');
  await root.screenshot({ path: `docs/visual/integrations/${name}-orbits-moving.png` });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root).toHaveAttribute('data-running', 'false');
  assert(await root.evaluate(el => el.getAnimations({ subtree: true }).length === 0), 'Reduced motion removes orbit and swap animations');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(root).toHaveAttribute('data-running', 'true');
  await page.mouse.wheel(0, -16000); await page.waitForTimeout(1600);
  await expect(root).toHaveAttribute('data-running', 'false');
  assert.deepEqual(errors, []);
  console.log(`${name}: alternating rotation, upright logos, independent swaps, reduced motion, offscreen pause, clean hydration passed`);
 } finally { await browser.close(); }
}
