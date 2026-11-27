import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'docs/design/blog-illustrations-2026-11-17/page-qa');
const posts=JSON.parse(await fs.readFile('src/content/blog/posts.json','utf8'));
const browser=await chromium.launch();
const results=[],errors=[];
for(const width of [1440,390,320]){
 const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push({width,error:e.message}));
 for(const route of ['/blog',...posts.map(p=>'/blog/'+p.slug)]){
  const response=await page.goto('http://127.0.0.1:3001'+route,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));});
  const measurements=await page.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
   const asset=src=>{try{const u=new URL(src,location.href);return u.searchParams.get('url')||u.pathname}catch{return src}};
   return{viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.querySelector('h1')?.textContent,images:[...document.querySelectorAll('main img')].map(i=>({asset:asset(i.currentSrc||i.src),loaded:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,objectFit:getComputedStyle(i).objectFit,...box(i)})),links:[...document.querySelectorAll('main a[href^="/blog/"]')].map(a=>({text:a.textContent,href:a.getAttribute('href')})),overflow:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+.5&&r.width>0&&!e.closest('.article-table-scroll')}).slice(0,12).map(e=>({tag:e.tagName,class:e.className,...box(e)}))};
  });
  results.push({route,width,status:response.status(),...measurements});
  if(route==='/blog'){
   await page.screenshot({path:path.join(out,`blog-${width}.png`),fullPage:true,animations:'disabled'});
   for(const topic of ['Technical','Insights']){
    const button=page.getByRole('button',{name:topic,exact:true});
    if(await button.count()){
     await button.click();
     await page.evaluate(async()=>{await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));});
     const filter=await page.locator('#all').evaluate(e=>({titles:[...e.querySelectorAll('h3')].map(h=>h.textContent),images:[...e.querySelectorAll('img')].map(i=>({src:i.currentSrc||i.src,loaded:i.complete&&i.naturalWidth>0}))}));
     results.at(-1).filters??={}; results.at(-1).filters[topic]=filter;
    }
   }
  }
  if(route==='/blog/who-answers-at-7pm'){
   await page.screenshot({path:path.join(out,`after-hours-hero-${width}.png`),animations:'disabled'});
   const next=page.locator('section[aria-labelledby="next-up-title"]');
   await next.screenshot({path:path.join(out,`after-hours-recommendations-${width}.png`),animations:'disabled'});
   const cover=page.locator('main article img').first();
   await cover.screenshot({path:path.join(out,`after-hours-cover-${width}.png`),animations:'disabled'});
  }
 }
 await page.close();
}
await browser.close();
await fs.writeFile(path.join(out,'results.json'),JSON.stringify({timestamp:new Date().toISOString(),errors,results},null,2)+'\n');
console.log(JSON.stringify({errors,pages:results.map(r=>({route:r.route,width:r.width,status:r.status,scrollWidth:r.scrollWidth,images:r.images.length,unloaded:r.images.filter(i=>!i.loaded).length,newIllustrations:r.images.filter(i=>i.asset.includes('/illustrations/')).length,overflow:r.overflow.length}))},null,2));
