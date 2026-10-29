import {chromium,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='docs/visual/dropdown-glass'; await fs.mkdir(out,{recursive:true});
const results=[];
for(const [name,engine] of Object.entries({chromium,webkit})) {
 const browser=await engine.launch();
 try {
  const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3001/'); await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-menu="Applications"] > summary').hover();
  const panel=page.locator('[data-applications-panel]');

  for(const [product,kind,count] of [['JustCall','drift',3],['Helpwise','drift',5],['ServiceAgent','single-band',3],['CallPage','offset',8]]) {
   await panel.locator('a').filter({has:page.locator(`span:text-is("${product}")`)}).hover();
   const canvas=panel.locator(`[data-product-preview="${product}"] canvas`);
   await expect(canvas).toHaveAttribute('data-pattern',kind);
   await expect(canvas).toHaveAttribute('data-count',String(count));
   await expect(canvas).toHaveAttribute('data-motion-frames',/[1-9]/);
   await expect(canvas).not.toHaveAttribute('data-render-state','error');
   assert.equal(await canvas.count(),1);
   const figure=panel.locator(`[data-product-preview="${product}"]`);
   const cards=await figure.evaluate(el=>[...el.querySelectorAll('*')].filter(node=>getComputedStyle(node).backdropFilter.includes('blur')).map(node=>({blur:getComputedStyle(node).backdropFilter,border:getComputedStyle(node).borderWidth,background:getComputedStyle(node).backgroundColor})));
   assert(cards.length>0); assert(cards.every(card=>card.border==='0px'));
   await panel.screenshot({path:`${out}/${name}-${product}.png`});
   results.push({name,product,kind,count,cards});
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(panel.locator('[data-product-preview="CallPage"] canvas')).toHaveAttribute('data-playback','playing');
  await expect(panel.locator('canvas[data-playback="playing"]')).toHaveCount(1);
  await page.mouse.move(1200,700); await expect(panel).toHaveCount(0);
  assert.deepEqual(errors,[]);
 } finally {await browser.close();}
}
await fs.writeFile(`${out}/checks.json`,JSON.stringify(results,null,2));
console.log('Four glass previews, shader configurations, playback, teardown and browser errors checked in Chromium and WebKit.');
