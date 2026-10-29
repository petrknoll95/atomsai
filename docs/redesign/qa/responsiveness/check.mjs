import {chromium,webkit} from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const out='docs/redesign/qa/responsiveness';
const routes=['/approach','/capabilities/voice','/industries/healthcare','/trust','/company/contact'];
const results=[];
for(const [engine,launcher] of Object.entries({chromium,webkit})){
 const browser=await launcher.launch();
 for(const width of [320,390,768,1024,1440,1920]){
  for(const route of routes){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:width===1024?'no-preference':'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:3001'+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   const g=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,unloaded:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),outside:[...document.querySelectorAll('main *')].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.position!=='absolute'&&s.visibility!=='hidden'&&r.width&&r.height&&(r.right>innerWidth+1||r.left< -1)}).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,70)})).slice(0,10),smallControls:[...document.querySelectorAll('main a,main button,main summary,main input,main textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<24||r.width<24)}).map(e=>({text:e.getAttribute('aria-label')||e.textContent.slice(0,70),w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))}));
   results.push({engine,route,width,errors,...g});
   if([320,768,1024,1920].includes(width)&&engine==='chromium'){
    const file=`${out}/${route.slice(1).replaceAll('/','-')}-${width}.png`;
    await page.screenshot({path:file,fullPage:true});await sharp(file).resize({width:width>1000?700:width}).toFile(file.replace('.png','-overview.png'));
   }
   await page.close();
  }
 }
 await browser.close();
}
await fs.writeFile(out+'/matrix.json',JSON.stringify(results,null,2));console.log(JSON.stringify({cases:results.length,overflow:results.filter(x=>x.scrollWidth!==x.width||x.outside.length),errors:results.filter(x=>x.errors.length||x.unloaded.length),smallControls:results.filter(x=>x.width===320&&x.engine==='chromium').map(x=>({route:x.route,controls:x.smallControls}))},null,2));
