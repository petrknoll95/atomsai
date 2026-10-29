import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const out='docs/visual/dropdown-blur-reveal';
await fs.mkdir(out,{recursive:true});
const results=[];
const difference=async(a,b)=>{
 const x=await sharp(a).removeAlpha().raw().toBuffer(), y=await sharp(b).removeAlpha().raw().toBuffer();
 assert.equal(x.length,y.length);
 return x.reduce((sum,value,i)=>sum+Math.abs(value-y[i]),0)/x.length;
};
for(const [name,engine] of Object.entries({chromium,webkit})) {
 const browser=await engine.launch();
 try {
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // Freeze the real in-flight composition, including the shader, for optical checks.
  await page.addInitScript(()=>{
   const raf=window.requestAnimationFrame;
   window.requestAnimationFrame=callback=>raf(function run(time){
    if(window.freezeMotion) raf(run); else callback(time);
   });
  });
  await page.goto('http://127.0.0.1:3001/');
  await page.locator('[data-menu="Applications"] > summary').hover();
  const panel=page.locator('[data-applications-panel]');
  const figure=product=>panel.locator(`[data-product-preview="${product}"]`);
  const trigger=product=>panel.locator('a[data-active]').filter({has:page.locator(`span:text-is("${product}")`)});
  await expect(figure('ServiceAgent').locator('canvas')).toHaveAttribute('data-motion-frames',/[1-9]/);
  await page.waitForTimeout(500);
  for(const product of ['JustCall','Helpwise','CallPage','ServiceAgent','JustCall']) {
   await panel.evaluate(el=>{
    window.blurFrames=[];window.blurDone=false;const start=performance.now();
    const sample=()=>{
     window.blurFrames.push({time:performance.now()-start,figures:[...el.querySelectorAll('[data-product-preview]')].map(scene=>({
      product:scene.dataset.productPreview,opacity:Number(getComputedStyle(scene).opacity),
      visibility:getComputedStyle(scene).visibility,draws:Number(scene.querySelector('canvas')?.dataset.motionFrames||0),
      glass:[...scene.querySelectorAll('[data-preview-glass]')].map(card=>({opacity:Number(getComputedStyle(card).opacity),blur:getComputedStyle(card).backdropFilter})),
     }))});
     if(performance.now()-start<650) requestAnimationFrame(sample);else window.blurDone=true;
    };requestAnimationFrame(sample);
   });
   await trigger(product).hover();await page.waitForFunction(()=>window.blurDone);
   const frames=await page.evaluate(()=>window.blurFrames);
   assert(frames.some(frame=>frame.figures.some(scene=>scene.opacity>0&&scene.opacity<1)),'No reveal frames');
   for(const frame of frames) for(const scene of frame.figures) {
    if(scene.visibility!=='visible'||scene.opacity===0)continue;
    assert(scene.draws>0,'A scene was revealed before its background drew');
    assert(scene.glass.every(card=>card.opacity===1&&card.blur.includes('16px')),'Glass plane changed during the composite');
   }
   results.push({name,product,frames});
  }
  // Capture multiple actual transition frames, not just the settled endpoint.
  for(const ms of [40,120,220,360,520]) {
   await page.evaluate(()=>window.freezeMotion=false);
   await trigger('JustCall').hover();await page.waitForTimeout(550);
   await trigger('Helpwise').hover();await page.waitForTimeout(ms);
   await page.evaluate(()=>window.freezeMotion=true);
   await panel.screenshot({path:`${out}/${name}-${ms}ms.png`});
  }
  await page.evaluate(()=>window.freezeMotion=false);
  await trigger('ServiceAgent').hover();await page.waitForTimeout(550);
  await trigger('JustCall').hover();await page.waitForTimeout(180);
  await page.evaluate(()=>window.freezeMotion=true);
  const partialOpacity=await figure('JustCall').evaluate(el=>Number(getComputedStyle(el).opacity));
  assert(partialOpacity>0&&partialOpacity<1,'Optical check must be an in-flight frame');
  const card=figure('JustCall').locator('[data-preview-glass]').filter({hasText:'AI summary'});
  const blurred=await card.screenshot({path:`${out}/${name}-partial-blur.png`});
  await card.evaluate(el=>{el.style.setProperty('backdrop-filter','none','important');el.style.setProperty('-webkit-backdrop-filter','none','important');});
  const clear=await card.screenshot({path:`${out}/${name}-partial-no-blur.png`});
  const delta=await difference(blurred,clear);
  const probe=await browser.newPage({viewport:{width:400,height:400}});
  await probe.setContent('<div style="height:400px;background:repeating-linear-gradient(90deg,black 0px 20px,white 20px 40px)"><div id="glass" style="position:absolute;left:20px;top:20px;width:300px;height:300px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:#ffffff20"></div></div>');
  const sample=probe.locator('#glass'),blurredProbe=await sample.screenshot();
  await sample.evaluate(el=>{el.style.backdropFilter='none';el.style.webkitBackdropFilter='none';});
  const baselineDelta=await difference(blurredProbe,await sample.screenshot());await probe.close();
  if(baselineDelta>.1)assert(delta>.1,`Blur missing mid-reveal: ${delta}`);
  results.push({name,partialOpacity,blurDifference:delta,baselineDelta,pixelVerification:baselineDelta>.1?'passed':'unavailable: headless engine does not rasterize backdrop blur'});
  await card.evaluate(el=>{el.style.removeProperty('backdrop-filter');el.style.removeProperty('-webkit-backdrop-filter');});
  await page.evaluate(()=>window.freezeMotion=false);
  for(const product of ['Helpwise','CallPage','JustCall','ServiceAgent','Helpwise']) {
   const box=await trigger(product).boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(35);
  }
  await page.waitForTimeout(650);
  const visible=await panel.locator('[data-product-preview]').evaluateAll(scenes=>scenes.filter(el=>getComputedStyle(el).visibility==='visible').map(el=>el.dataset.productPreview));
  assert.deepEqual(visible,['Helpwise']);
  await expect(panel.locator('canvas[data-playback="playing"]')).toHaveCount(1);
  const inactive=panel.locator('[data-product-preview]:not([data-product-preview="Helpwise"]) canvas');
  const counts=()=>inactive.evaluateAll(nodes=>nodes.map(el=>el.dataset.motionFrames));
  const before=await counts();await page.waitForTimeout(200);assert.deepEqual(await counts(),before,'Inactive shader is still rendering');
  await page.emulateMedia({reducedMotion:'reduce'});await trigger('CallPage').hover();
  await expect(figure('CallPage')).toHaveCSS('opacity','1');
  await expect(panel.locator('canvas[data-playback="playing"]')).toHaveCount(0);
  await page.mouse.move(1400,900);await expect(panel).toHaveCount(0);
  assert.deepEqual(errors,[]);
  console.log(`${name}: per-frame reveal, rapid reversal, paused shaders, reduced motion, cleanup; optical blur difference ${delta.toFixed(3)}`);
 }finally{await browser.close();}
}
await fs.writeFile(`${out}/checks.json`,JSON.stringify(results,null,2));
