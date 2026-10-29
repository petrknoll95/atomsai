import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
await fs.mkdir('docs/visual/button-clip', { recursive: true });
for (const [name, engine] of Object.entries({ chromium, webkit })) {
 const browser = await engine.launch();
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  for (const route of ['/approach', '/capabilities/voice', '/trust', '/company/contact']) {
   await page.goto(`http://localhost:3001${route}`);
   await page.evaluate(()=>document.fonts.ready);
   const button=page.locator('main .button').first();
   const before=await button.boundingBox();
   const read=()=>button.evaluate(el=>({clip:getComputedStyle(el,'::before').clipPath,fill:getComputedStyle(el,'::before').backgroundColor,background:getComputedStyle(el).backgroundColor,outline:getComputedStyle(el).outlineColor}));
   assert.equal((await read()).background,'rgba(0, 0, 0, 0)');
   await button.hover(); assert.match((await read()).clip,/inset\(3px/);
   assert.deepEqual(await button.boundingBox(),before,'Hover preserves bounds');
   await button.focus(); assert.notEqual((await read()).outline,'rgba(0, 0, 0, 0)');
   await page.mouse.move(0,0); await button.evaluate(el=>el.blur());
   assert.match((await read()).clip,/inset\(0px/);
   const solid=await page.locator('button,.button,.eyebrow').evaluateAll(els=>els.filter(el=>getComputedStyle(el).backgroundColor!=='rgba(0, 0, 0, 0)').map(el=>({text:el.textContent.slice(0,30),class:el.className,bg:getComputedStyle(el).backgroundColor})));
   assert.deepEqual(solid,[],`All painted buttons use their clipped surface: ${route}`);
  }
  await page.goto('http://localhost:3001/approach');
  const menu=page.locator('button[data-menu="site"]');await menu.hover();
  assert.match(await menu.evaluate(el=>getComputedStyle(el,'::before').clipPath),/inset\(3px/);
  await menu.click();await expect(page.locator('dialog[open]')).toBeVisible();await menu.click();
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(300);
  const cta=page.locator('header .button').first();await page.mouse.move(0,0);
  await cta.hover();await page.waitForTimeout(90);
  const middle=await cta.evaluate(el=>getComputedStyle(el,'::before').clipPath);
  assert.notEqual(middle,'inset(0px round 999px)');
  await page.waitForTimeout(500);assert.match(await cta.evaluate(el=>getComputedStyle(el,'::before').clipPath),/inset\(3px/);
  await page.screenshot({path:`docs/visual/button-clip/${name}-hover.png`});
  assert.deepEqual(errors,[]);
  console.log(`${name}: CTAs, outline buttons, icon controls, focus, reduced motion and animated clip passed`);
 } finally {await browser.close();}
}
