import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prepareHomepagePatterns } from './wait-for-patterns.mjs';
const out=path.resolve('docs/visual');
const referenceMetadata=await sharp(`${out}/reference/homepage.png`).metadata();
await fs.mkdir(`${out}/rendered`,{recursive:true});
await fs.mkdir(`${out}/comparison`,{recursive:true});
const browser=await chromium.launch();
const results=[];
const errors=[];
for(const width of [1600,1200,1024,768,390,320]){
 const page=await browser.newPage({viewport:{width,height:width===1600?referenceMetadata.height:960},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',err=>errors.push({width,error:err.message}));
 await page.goto(process.env.VISUAL_URL||'http://127.0.0.1:3000',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));});
 await prepareHomepagePatterns(page);
 // The original desktop frame shows ServiceAgent's active card; responsive
 // captures retain the page's default state with all four cards inactive.
 if(width===1600){
  const card=page.locator('[data-application="ServiceAgent"]');
  await card.hover();
  await page.waitForFunction(()=>{
   const card=document.querySelector('[data-application="ServiceAgent"]');
   return card?.dataset.active==='true'&&Number(getComputedStyle(card).getPropertyValue('--application-progress'))===1;
  });
 }
 await page.screenshot({path:`${out}/rendered/homepage-${width}.png`,fullPage:true,animations:'disabled'});
 const geometry=await page.evaluate(()=>({
  viewport:innerWidth,viewportHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
  sections:Array.from(document.querySelectorAll('section,footer')).map(e=>{const r=e.getBoundingClientRect();return{name:e.getAttribute('data-section')||e.getAttribute('aria-labelledby')||e.id||e.tagName,x:r.x,y:r.y,width:r.width,height:r.height};}),
  assets:Array.from(document.images).map(e=>{const r=e.getBoundingClientRect();return{src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,x:r.x,y:r.y,width:r.width,height:r.height};}),
  fonts:{body:getComputedStyle(document.body).fontFamily,headline:getComputedStyle(document.querySelector('h1')).fontFamily},
  overflowing:Array.from(document.querySelectorAll('body *')).filter(e=>{const r=e.getBoundingClientRect();return !e.closest('#industry-gallery')&&r.right>innerWidth+.5&&getComputedStyle(e).position!=='absolute'&&r.width>0;}).map(e=>({tag:e.tagName,className:e.className})).slice(0,15)
 }));
 results.push({width,applicationsState:width===1600?'ServiceAgent hover (Figma target)':'default',...geometry});
 if(width===390){
  await page.keyboard.press('Tab');
  const focus=await page.evaluate(()=>({text:document.activeElement?.textContent,outline:getComputedStyle(document.activeElement).outlineStyle}));
  results.at(-1).keyboardFocus=focus;
  await page.getByRole('button',{name:'Open site menu',exact:true}).press('Enter');
  results.at(-1).menuOpens=await page.getByRole('navigation',{name:'Site menu'}).isVisible();
  if(!results.at(-1).menuOpens)errors.push({width,error:'Full-screen site menu did not open by keyboard.'});
 }
 await page.close();
}
await browser.close();
const ref=await sharp(`${out}/reference/homepage.png`).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
const actual=await sharp(`${out}/rendered/homepage-1600.png`).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
const width=1600,height=Math.min(ref.info.height,actual.info.height);
const overlay=Buffer.alloc(width*height*3),diff=Buffer.alloc(width*height*3);
const bands=[['hero',0,960],['offerings',960,1661],['applications',1661,2564],['preview',2564,3737],['industries',3737,4918],['stories',4918,5802],['faq',5802,6656],['cta',6656,7184],['footer',7184,7965]];
const comparison=[];
for(const [name,start,end] of bands){let sum=0,changed=0,pixels=0;
 for(let y=start;y<Math.min(end,height);y++)for(let x=0;x<width;x++){let delta=0;for(let c=0;c<3;c++){const i=(y*width+x)*3+c,d=Math.abs(ref.data[i]-actual.data[i]);sum+=d;delta=Math.max(delta,d);overlay[i]=Math.round((ref.data[i]+actual.data[i])/2);diff[i]=Math.min(255,d*4);}if(delta>32)changed++;pixels++;}
 comparison.push({section:name,meanAbsoluteChannelError:sum/(pixels*3),pixelsOver32Percent:100*changed/pixels});
}
// The fractional source frame produces one extra export row. Include it in
// the full images, while keeping section metrics within the measured bands.
for(let i=bands.at(-1)[2]*width*3;i<overlay.length;i++){
 const d=Math.abs(ref.data[i]-actual.data[i]);
 overlay[i]=Math.round((ref.data[i]+actual.data[i])/2);
 diff[i]=Math.min(255,d*4);
}
await sharp(overlay,{raw:{width,height,channels:3}}).png().toFile(`${out}/comparison/overlay.png`);
await sharp(diff,{raw:{width,height,channels:3}}).png().toFile(`${out}/comparison/difference-x4.png`);
for(const [name,start,end] of bands) {
 for(const [kind,source] of [['reference','reference/homepage.png'],['rendered','rendered/homepage-1600.png'],['overlay','comparison/overlay.png'],['difference','comparison/difference-x4.png']]) {
  await sharp(`${out}/${source}`).extract({left:0,top:start,width:1600,height:end-start}).png().toFile(`${out}/comparison/${name}-${kind}.png`);
 }
}
const expectedHeights=[960,701,903,1173,1181.0908203125,884,854,528,781];
results[0].sections.forEach((section,index)=>{
 section.expectedHeight=expectedHeights[index];
 section.heightError=section.height-section.expectedHeight;
});
await fs.writeFile(`${out}/results.json`,JSON.stringify({date:'2026-10-26',browser:'Playwright Chromium',deviceScaleFactor:1,reference:{width:ref.info.width,height:ref.info.height,node:'185:3428'},renderedHeight:actual.info.height,comparison,errors,viewports:results},null,2)+'\n');
console.log(JSON.stringify({referenceHeight:ref.info.height,renderedHeight:actual.info.height,comparison,errors,viewports:results.map(({width,height,scrollWidth,assets})=>({width,height,scrollWidth,brokenAssets:assets.filter(a=>!a.loaded).length}))},null,2));
if(errors.length||results.some(r=>r.scrollWidth>r.width||r.assets.some(a=>!a.loaded))||results[0].sections.some(s=>Math.abs(s.heightError)>1))process.exitCode=1;
