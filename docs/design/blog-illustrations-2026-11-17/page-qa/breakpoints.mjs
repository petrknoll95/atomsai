import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch(),results=[];
for(const width of [768,1101]){
const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
for(const route of ['/blog','/blog/who-answers-at-7pm']){
await page.goto('http://127.0.0.1:3001'+route,{waitUntil:'networkidle'});
results.push({width,route,...await page.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));return{scrollWidth:document.documentElement.scrollWidth,images:[...document.querySelectorAll('main img')].map(i=>{const b=i.getBoundingClientRect();return{src:new URL(i.currentSrc,location.href).searchParams.get('url'),width:b.width,height:b.height,strokePx:Math.max(b.width/1600,b.height/900)*3.6,loaded:i.complete&&i.naturalWidth>0}})}})});
}
await page.close();
}
await browser.close();await fs.writeFile('docs/design/blog-illustrations-2026-11-17/page-qa/breakpoints.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
