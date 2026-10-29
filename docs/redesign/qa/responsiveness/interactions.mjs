import {chromium,webkit} from '@playwright/test';import fs from 'node:fs/promises';
const out='docs/redesign/qa/responsiveness';const results=[];
for(const [engine,launcher] of Object.entries({chromium,webkit})){
 const browser=await launcher.launch();
 for(const motion of ['reduce','no-preference']){
  const page=await browser.newPage({viewport:{width:320,height:568},reducedMotion:motion});
  await page.goto('http://127.0.0.1:3001/trust',{waitUntil:'networkidle'});
  await page.evaluate(()=>window.scrollTo({top:800,behavior:'instant'}));
  await page.getByRole('button',{name:'Open site menu',exact:true}).click();
  const menu=page.getByRole('navigation',{name:'Site menu',exact:true});
  await menu.getByRole('button',{name:'Company',exact:true}).click();
  const contact=menu.getByRole('link',{name:'Contact us',exact:true});await contact.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/menu-${engine}-${motion}.png`});
  const menuData=await menu.evaluate(e=>({width:e.getBoundingClientRect().width,scrollWidth:e.scrollWidth,links:[...e.querySelectorAll('a')].filter(a=>!a.closest('[inert]')).map(a=>({text:a.textContent,rect:a.getBoundingClientRect().toJSON()}))}));
  const focus=[];for(let i=0;i<18;i++){await page.keyboard.press(engine==='webkit'?'Alt+Tab':'Tab');focus.push(await page.evaluate(()=>({inHeader:!!document.activeElement.closest('header'),inDialog:!!document.activeElement.closest('dialog'),trigger:document.activeElement.getAttribute('aria-label')==='Close site menu',text:document.activeElement.textContent.slice(0,40)})));}
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  await page.getByRole('button',{name:'Open site menu',exact:true}).waitFor();
  const restored=await page.evaluate(()=>({scrollY,focused:document.activeElement.getAttribute('aria-label')}));
  await page.goto('http://127.0.0.1:3001/capabilities/voice',{waitUntil:'networkidle'});
  await page.getByRole('tab',{name:'A viewing'}).focus();await page.keyboard.press('End');
  const voiceTab=await page.getByRole('tab',{name:'A demo'}).getAttribute('aria-selected');
  await page.getByRole('button',{name:'Play voice sample'}).click();await page.waitForFunction(()=>!document.querySelector('audio').paused);await page.getByRole('button',{name:'Pause voice sample'}).click();
  const slider=page.getByRole('slider',{name:'Audio position'});await slider.focus();await page.keyboard.press('ArrowRight');const audioTime=await slider.inputValue();
  await page.getByText('Read the transcript',{exact:false}).click();const transcript=await page.getByText('Read the transcript',{exact:false}).evaluate(e=>e.closest('details').open);
  await page.goto('http://127.0.0.1:3001/industries/healthcare',{waitUntil:'networkidle'});await page.getByRole('tab',{name:/Move an appointment/}).focus();await page.keyboard.press('End');const healthTab=await page.getByRole('tab',{name:/Bring in your team/}).getAttribute('aria-selected');
  await page.goto('http://127.0.0.1:3001/trust',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Hosted pilot',exact:true}).click();const trust=await page.locator('#deployment-detail').innerText();
  await page.goto('http://127.0.0.1:3001/company/contact',{waitUntil:'networkidle'});await page.getByLabel('Your name',{exact:true}).fill('Alex Example');await page.getByLabel('Company',{exact:true}).fill('Example Corp');await page.getByLabel('Business email',{exact:true}).fill('alex@example.com');await page.getByLabel('What would you like to explore?',{exact:true}).fill('Scheduling across several locations. '.repeat(35));await page.getByRole('button',{name:'Prepare email'}).click();
  const form=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,focused:document.activeElement.textContent,previewScroll:[...document.querySelectorAll('main div')].filter(e=>getComputedStyle(e).overflowY==='auto').map(e=>({h:e.clientHeight,sh:e.scrollHeight}))}));await page.screenshot({path:`${out}/contact-long-${engine}-${motion}.png`,fullPage:true});
  results.push({engine,motion,tabKey:engine==='webkit'?'Option+Tab (Safari full navigation)':'Tab',menuData,focusTrap:focus.every(x=>x.inHeader),focus,restored,voiceTab,audioTime,transcriptOpen:transcript,healthTab,hostedCopy:trust.includes('AtomsAI account'),form});await page.close();
 }
 await browser.close();
}
await fs.writeFile(out+'/interactions.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({menuData,...x})=>x),null,2));
