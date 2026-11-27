import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const out='docs/design/blog-illustrations-2026-11-17/page-qa-v2';
const browser=await chromium.launch(),results=[];
for(const width of [1440,390,768,1101]){
const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'});
for(const route of ['/blog','/blog/who-answers-at-7pm']){
await page.goto('http://127.0.0.1:3001'+route,{waitUntil:'networkidle'});
await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
const images=await page.evaluate(()=>[...document.querySelectorAll('main img')].map(i=>{const b=i.getBoundingClientRect();return{src:i.currentSrc,width:b.width,height:b.height,ratio:b.width/b.height,objectFit:getComputedStyle(i).objectFit,loaded:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,srcset:i.srcset}}));
const doc=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth}));
results.push({width,dpr:2,route,...doc,images});
if(width===1440||width===390){
 if(route==='/blog'){
 await page.screenshot({path:`${out}/blog-${width}-dpr2.png`,fullPage:true,animations:'disabled'});
 await page.locator('#all').screenshot({path:`${out}/grid-${width}-dpr2.png`,animations:'disabled'});
 }else{
 await page.locator('main article img').first().screenshot({path:`${out}/after-hours-cover-${width}-dpr2.png`,animations:'disabled'});
 await page.locator('section[aria-labelledby="next-up-title"]').screenshot({path:`${out}/after-hours-recommendations-${width}-dpr2.png`,animations:'disabled'});
 }
}
}
await page.close();
}
await browser.close();await fs.writeFile(`${out}/density-results.json`,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results.map(r=>({width:r.width,route:r.route,scrollWidth:r.scrollWidth,loaded:r.images.every(i=>i.loaded),directSVG:r.images.every(i=>i.src.endsWith('.svg')&&!i.src.includes('/_next/image')),allFourThree:r.images.every(i=>Math.abs(i.ratio-4/3)<.001),boxes:r.images.map(i=>[i.width,i.height])})),null,2));
