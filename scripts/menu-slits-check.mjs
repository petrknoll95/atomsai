import {chromium,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
await fs.mkdir('docs/visual/menu-slits',{recursive:true});
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch();const page=await browser.newPage({viewport:{width:1600,height:960},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:3001');
 for(const width of [1920,1600,1280,1024,768,390,320]){
  await page.setViewportSize({width,height:width<768?844:960});await page.getByRole('button',{name:'Open site menu'}).click();const dialog=page.getByRole('dialog',{name:'Site menu'});const canvas=dialog.locator('canvas');await expect(canvas).toHaveAttribute('data-render-state','ready');await expect(canvas).toHaveAttribute('data-count',width<768?'4':'5');await expect(canvas).toHaveAttribute('data-playback','reduced');
  const data=await dialog.evaluate(el=>{
   const canvas=el.querySelector('canvas'), c=canvas.getBoundingClientRect(),n=Number(canvas.dataset.count), pitch=c.width*840/800/n,origin=c.left-c.width*20/800;
   const nav=el.querySelector('nav'),primary=nav.querySelector('ul'),support=nav.children[1],products=support.querySelectorAll('li a');
   const targets=[el.querySelector('a[aria-label="AtomsAI home"]'),primary,support,...products];
   const alignment=targets.map(t=>{const x=t.getBoundingClientRect().left;return {x,error:Math.abs((x-origin)/pitch-Math.round((x-origin)/pitch))*pitch}});
   return {alignment,pitch,origin,count:n,overflow:el.scrollWidth>el.clientWidth,linksFit:[...primary.querySelectorAll('a')].every(a=>a.scrollWidth<=a.clientWidth),bounds:c.toJSON()};
  });assert(!data.overflow);assert(data.linksFit);assert(data.alignment.every(a=>a.error<1),JSON.stringify(data));results.push({browser:name,width,...data});
  if(width===1600||width===390)await page.screenshot({path:`docs/visual/menu-slits/${name}-${width}.png`});
  await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.locator('[data-menu-pattern]')).toHaveCount(0);await expect(page.getByRole('button',{name:'Open site menu'})).toBeFocused();
 }
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Open site menu'}).click();const canvas=page.locator('[data-menu-pattern] canvas');await expect(canvas).toHaveAttribute('data-playback','playing');const phase=await canvas.getAttribute('data-phase');await page.waitForTimeout(250);assert.notEqual(await canvas.getAttribute('data-phase'),phase);assert.deepEqual(errors,[]);await browser.close();
}
await fs.writeFile('docs/visual/menu-slits/results.json',JSON.stringify(results,null,2));console.log(results.map(r=>({browser:r.browser,width:r.width,maxAlignmentError:Math.max(...r.alignment.map(a=>a.error)),overflow:r.overflow})));
