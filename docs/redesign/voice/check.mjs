import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs/promises';
const results=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  for(const width of [1440,768,390,320]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    let audioRequests=0;page.on('request',r=>{if(r.url().includes('conversation.mp3'))audioRequests++;});
    await page.goto('http://127.0.0.1:3001/capabilities/voice',{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    const audioBeforePlay=audioRequests;
    const initial=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,h1Count:document.querySelectorAll('h1').length,headingFont:getComputedStyle(document.querySelector('h1')).fontFamily}));
    await page.getByRole('tab',{name:'A viewing'}).focus();
    await page.keyboard.press('ArrowRight');
    const tabs=await page.getByRole('tab',{name:'A callback'}).getAttribute('aria-selected')==='true'&&await page.getByRole('tabpanel').getByRole('heading',{name:'Give an enquiry a clear next step.'}).isVisible();
    await page.keyboard.press('End');
    const endKey=await page.getByRole('tab',{name:'A demo'}).getAttribute('aria-selected')==='true';
    await page.getByRole('tab',{name:'A viewing'}).click();
    await page.locator('summary').filter({hasText:'Read the transcript'}).click();
    const transcript=await page.locator('details[open] ol li').count()===6;
    await page.locator('summary').filter({hasText:'Read the transcript'}).click();
    await page.getByRole('button',{name:'Play voice sample'}).click();
    await page.waitForFunction(()=>document.querySelector('audio')?.currentTime>0.5);
    const plays=await page.getByRole('button',{name:'Pause voice sample'}).getAttribute('aria-pressed')==='true';
    await page.getByRole('button',{name:'Pause voice sample'}).click();
    const pauses=await page.evaluate(()=>document.querySelector('audio').paused);
    await page.getByRole('slider',{name:'Audio position'}).fill('15');
    const seeks=await page.evaluate(()=>Math.abs(document.querySelector('audio').currentTime-15)<0.5);
    await page.getByRole('button',{name:'Play voice sample'}).click();
    await page.locator('#context-heading').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('audio').paused);
    const pausesOffscreen=await page.evaluate(()=>document.querySelector('audio').paused);
    await page.evaluate(()=>{const a=document.querySelector('audio');a.currentTime=0;});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`docs/redesign/voice/${engineName}-${width}.png`,fullPage:true});
    const pass=initial.scrollWidth===width&&initial.h1Count===1&&audioBeforePlay===0&&tabs&&endKey&&transcript&&plays&&pauses&&seeks&&pausesOffscreen&&errors.length===0;
    results.push({engine:engineName,width,...initial,audioBeforePlay,tabs,endKey,transcript,plays,pauses,seeks,pausesOffscreen,errors,pass});
    await page.close();
  }
  await browser.close();
}
await fs.writeFile('docs/redesign/voice/checks.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
