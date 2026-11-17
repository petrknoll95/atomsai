import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const browser=await chromium.launch(), results=[];
for(const [width,dpr] of [[1440,1],[1440,2],[390,1],[390,2]]){
const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:dpr,reducedMotion:'reduce'});
for(const route of ['/blog','/blog/who-answers-at-7pm']){
await page.goto('http://127.0.0.1:3001'+route,{waitUntil:'networkidle'});
await page.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
const images=await page.evaluate(()=>[...document.querySelectorAll('main img')].map(i=>{const b=i.getBoundingClientRect();return{currentSrc:i.currentSrc,src:i.getAttribute('src'),sizes:i.sizes,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:b.width,height:b.height,objectFit:getComputedStyle(i).objectFit}}));
for(const i of images){const resp=await page.request.get(i.currentSrc);const bytes=await resp.body();try{const m=await sharp(bytes).metadata();i.decodedWidth=m.width;i.decodedHeight=m.height;i.bytes=bytes.length;i.actualPixelsPerCssPixel=Math.min(m.width/i.width,m.height/i.height);i.requiredPixelsPerCssPixel=dpr;}catch(e){i.decodeError=e.message}}
results.push({width,dpr,route,images});
}
await page.close();
}
await browser.close();await fs.writeFile('docs/design/blog-illustrations-2026-11-17/page-qa/resolution.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results.map(r=>({...r,images:r.images.map(i=>({src:i.currentSrc,width:i.width,height:i.height,decodedWidth:i.decodedWidth,decodedHeight:i.decodedHeight,actualPixelsPerCssPixel:i.actualPixelsPerCssPixel}))})),null,2));
