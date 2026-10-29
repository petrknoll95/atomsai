import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const b=await engine.launch();
 for(const width of [1440,768,390,320]){
  const p=await b.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:3001/trust',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  const managed=p.getByRole('button',{name:'Your cloud, managed',exact:true});await managed.focus();await p.keyboard.press('Enter');
  const managedText=await p.locator('#deployment-detail').textContent();const managedSelected=await managed.getAttribute('aria-pressed');
  const hosted=p.getByRole('button',{name:'Hosted pilot',exact:true});await hosted.click();const hostedText=await p.locator('#deployment-detail').textContent();
  await p.getByRole('button',{name:'Your cloud',exact:true}).click();
  const documents=await p.locator('#documents li a').evaluateAll(links=>links.map(a=>({text:a.textContent,href:a.getAttribute('href')})));
  const validDocumentLinks=documents.length===9&&documents.every(d=>{const url=new URL(d.href);return url.protocol==='mailto:'&&url.pathname==='security@atomsai.com'&&url.searchParams.get('subject')?.startsWith('Request: ')});
  await p.getByRole('link',{name:'Request security documents'}).click();await p.waitForTimeout(250);const documentJump=await p.evaluate(()=>Math.abs(document.querySelector('#documents').getBoundingClientRect().top-112)<40||Math.abs(document.querySelector('#documents').getBoundingClientRect().top-96)<40);
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:`docs/redesign/trust/${name}-${width}.png`,fullPage:true});
  const geometry=await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,headings:document.querySelectorAll('h1').length}));
  results.push({browser:name,width,errors,geometry,managedSelected,managedCopy:managedText.includes('Scoped service account')&&managedText.includes('Controlled by your team'),hostedCopy:hostedText.includes('AtomsAI infrastructure')&&hostedText.includes('Controlled by AtomsAI'),validDocumentLinks,documentJump});await p.close();
  if(name==='chromium')await sharp(`docs/redesign/trust/${name}-${width}.png`).resize({width:width>500?600:width}).toFile(`docs/redesign/trust/final-overview-${width}.png`);
 }
 await b.close();
}
await fs.writeFile('docs/redesign/trust/checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.errors.length||r.geometry.scroll>r.width||r.geometry.headings!==1||r.managedSelected!=='true'||!r.managedCopy||!r.hostedCopy||!r.validDocumentLinks||!r.documentJump))process.exitCode=1;
