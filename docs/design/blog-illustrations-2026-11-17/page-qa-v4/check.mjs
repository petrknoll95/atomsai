import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const out=path.resolve('docs/design/blog-illustrations-2026-11-17/page-qa-v4');
const preliminary=process.argv.includes('--preliminary');
const views=preliminary?[{width:320,dpr:1}]:[{width:1440,dpr:2},{width:390,dpr:1},{width:320,dpr:1}];
const posts=JSON.parse(await fs.readFile('src/content/blog/posts.json','utf8'));
const routes=preliminary?['/blog']:['/blog',...posts.map(p=>'/blog/'+p.slug)];
const browser=await chromium.launch();
// Hide fixed site chrome only in isolated evidence captures; full-page screenshots retain it.
const isolatedStyle='header[data-responsive-menu-open], [data-feedback] { visibility: hidden !important; }';
const errors=[],results=[];
for(const {width,dpr} of views){
 const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:dpr,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push({width,error:e.message}));
 for(const route of routes){
  const response=await page.goto('http://127.0.0.1:3001'+route,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  const measurement=await page.evaluate(()=>{
   const box=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
   return{viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.querySelector('h1')?.textContent,images:[...document.querySelectorAll('main img')].map(i=>({src:i.currentSrc||i.src,loaded:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,objectFit:getComputedStyle(i).objectFit,ratio:i.getBoundingClientRect().width/i.getBoundingClientRect().height,srcset:i.srcset,...box(i)})),overflow:[...document.querySelectorAll('main *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.right>innerWidth+.5&&!e.closest('.article-table-scroll');}).slice(0,10).map(e=>({tag:e.tagName,class:e.className,...box(e)}))};
  });
  for(const image of measurement.images){
   const asset=await page.request.get(image.src);
   const svg=await asset.text();
   image.contentType=asset.headers()['content-type'];
   image.svgHash=createHash('sha256').update(svg).digest('hex');
   const local=await fs.readFile(path.resolve('public'+new URL(image.src).pathname));
   image.localHash=createHash('sha256').update(local).digest('hex');
   image.matchesCurrentFile=image.svgHash===image.localHash;
   image.vectorOnly=!/<(?:image|script|foreignObject|text)\b/i.test(svg);
   image.strokes=[...new Set([...svg.matchAll(/stroke-width="([\d.]+)"/g)].map(m=>Number(m[1])))];
   image.effectiveStrokeCssPx=image.strokes.map(s=>s*image.width/512);
  }
  const record={route,width,dpr,status:response.status(),...measurement};results.push(record);
  const suffix=`${width}-dpr${dpr}`;
  if(route==='/blog'){
   await page.screenshot({path:path.join(out,`blog-${suffix}.png`),fullPage:true,animations:'disabled'});
   await page.locator('#all').screenshot({path:path.join(out,`grid-${suffix}.png`),animations:'disabled',style:isolatedStyle});
   const thumbnails=[];
   const images=page.locator('main img');
   for(let i=0;i<await images.count();i++){
    const slug=new URL(measurement.images[i].src).pathname.split('/').at(-1).replace('.svg','');
    const file=path.join(out,`thumbnail-${slug}-${suffix}.png`);
    await images.nth(i).screenshot({path:file,animations:'disabled',style:isolatedStyle});
    if(width!==1440)thumbnails.push(file);
   }
   if(thumbnails.length){
    const w=width-40,h=Math.round(w*.75),gap=12;
    const layers=await Promise.all(thumbnails.map(async(file,i)=>({input:await sharp(file).resize(w,h).png().toBuffer(),left:(i%3)*(w+gap),top:Math.floor(i/3)*(h+gap)})));
    await sharp({create:{width:w*3+gap*2,height:h*Math.ceil(thumbnails.length/3)+gap*(Math.ceil(thumbnails.length/3)-1),channels:3,background:'#fafafa'}}).composite(layers).png().toFile(path.join(out,`thumbnail-sheet-${suffix}.png`));
   }
   if(!preliminary){
    record.filters={};
    for(const topic of ['Technical','Insights']){
     const button=page.getByRole('button',{name:topic,exact:true});
     if(await button.count()){
      await button.click();
      await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
      record.filters[topic]=await page.locator('#all').evaluate(e=>({titles:[...e.querySelectorAll('h3')].map(h=>h.textContent),images:[...e.querySelectorAll('img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0}))}));
     }
    }
   }
  }else{
   const slug=route.split('/').at(-1);
   await page.screenshot({path:path.join(out,`${slug}-hero-${suffix}.png`),animations:'disabled'});
   await page.locator('main article img').first().screenshot({path:path.join(out,`${slug}-cover-${suffix}.png`),animations:'disabled',style:isolatedStyle});
   await page.locator('section[aria-labelledby="next-up-title"]').screenshot({path:path.join(out,`${slug}-recommendations-${suffix}.png`),animations:'disabled',style:isolatedStyle});
  }
 }
 await page.close();
}
await browser.close();
await fs.writeFile(path.join(out,preliminary?'preliminary-results.json':'results.json'),JSON.stringify({timestamp:new Date().toISOString(),preliminary,errors,results},null,2)+'\n');
console.log(JSON.stringify({preliminary,errors,pages:results.map(r=>({route:r.route,width:r.width,dpr:r.dpr,status:r.status,scrollWidth:r.scrollWidth,images:r.images.length,allDecoded:r.images.every(i=>i.loaded),directSVG:r.images.every(i=>i.src.endsWith('.svg')&&!i.src.includes('/_next/image')),allFourThree:r.images.every(i=>Math.abs(i.ratio-4/3)<.001),allThinStroke:r.images.every(i=>i.strokes.length===1&&i.strokes[0]===1.6),currentHashes:r.images.every(i=>i.matchesCurrentFile),overflow:r.overflow.length}))},null,2));
