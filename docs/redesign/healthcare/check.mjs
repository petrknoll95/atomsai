import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const b=await engine.launch();
 for(const width of [1440,768,390,320]){
  const p=await b.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:3001/industries/healthcare',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  const tabs=p.getByRole('tab');await tabs.nth(0).focus();await p.keyboard.press('ArrowDown');const second=await tabs.nth(1).getAttribute('aria-selected');
  const billing=await p.getByRole('tabpanel').textContent();await p.keyboard.press('End');const third=await tabs.nth(2).getAttribute('aria-selected');await p.keyboard.press('Home');
  const question=p.locator('main details summary').filter({hasText:'Which practice systems can you connect?'});await question.click();const faq=await p.locator('main details[open]').count();await question.click();
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:`docs/redesign/healthcare/${name}-${width}.png`,fullPage:true});await p.screenshot({path:`docs/redesign/healthcare/${name}-${width}-hero.png`});
  const geometry=await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,headings:document.querySelectorAll('h1').length,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
  results.push({browser:name,width,errors,geometry,billingSelection:second,billingPanel:billing.includes('Secure'),handoffSelection:third,faqOpened:faq===1});await p.close();
  if(name==='chromium')await sharp(`docs/redesign/healthcare/${name}-${width}.png`).resize({width:width>500?600:width}).toFile(`docs/redesign/healthcare/final-overview-${width}.png`);
 }
 await b.close();
}
await fs.writeFile('docs/redesign/healthcare/checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.errors.length||r.geometry.scroll>r.width||r.geometry.brokenImages||r.geometry.headings!==1||r.billingSelection!=='true'||!r.billingPanel||r.handoffSelection!=='true'||!r.faqOpened))process.exitCode=1;
