import {chromium,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const width of [1600,390]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.addInitScript(()=>{
    window.copyMaskFrames=[];
    const sample=()=>{const bg=document.querySelector('[data-menu-hero-background]'),copy=document.querySelector('[data-hero-copy]');if(bg&&copy){const b=getComputedStyle(bg),c=getComputedStyle(copy),h=getComputedStyle(copy.querySelector('h1'));if(copy.dataset.heroCopyState==='opening')window.copyMaskFrames.push({background:b.maskImage,copy:c.maskImage,size:b.maskSize===c.maskSize,position:b.maskPosition===c.maskPosition,opacity:h.opacity,transform:h.transform,progress:parseFloat(b.getPropertyValue('--hero-slit-4'))||0,copyProgress:parseFloat(c.getPropertyValue('--hero-slit-4'))||0});if(copy.dataset.heroCopyState==='open')return;}requestAnimationFrame(sample)};requestAnimationFrame(sample);
   });
   await page.goto('http://localhost:3001/');const copy=page.locator('[data-hero-copy]');
   await expect(copy).toHaveAttribute('data-hero-copy-state','open',{timeout:15000});
   const frames=await page.evaluate(()=>window.copyMaskFrames);
   assert(frames.length>0);
   assert(frames.some(f=>f.progress>0&&f.progress<100),'Text has intermediate clipped reveal frames');
   assert(frames.every(f=>f.size&&f.position&&Math.abs(f.copyProgress-f.progress)<.001),'Text masks share background coordinates and exactly match its progress');
   assert(frames.some(f=>f.copyProgress>0&&f.copyProgress<100),'Copy and background reveal together');
   assert(frames.every(f=>f.opacity==='1'&&f.transform==='none'),'Text no longer fades or translates in');
   await expect(copy).toHaveCSS('mask-image','none');await expect(page.locator('#hero-heading')).toBeVisible();
   await expect(copy).not.toHaveAttribute('inert','');
   console.log(`${name} ${width}: synchronized text/background masks, no copy fade, readable final content passed`);
   await page.close();
  }
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});
  await fallback.goto('http://localhost:3001/');await expect(fallback.locator('[data-hero-copy]')).toHaveAttribute('data-hero-copy-state','open',{timeout:15000});await expect(fallback.locator('#hero-heading')).toBeVisible();console.log(`${name}: readable fallback without WebGL passed`);await fallback.close();
 }finally{await browser.close();}
}
