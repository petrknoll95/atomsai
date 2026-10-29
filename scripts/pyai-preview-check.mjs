import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const dir='docs/visual/pyai-redesign';
const dialogue=JSON.parse(await fs.readFile('src/components/home/voice-audio.json','utf8'));
// Every bin wholly outside a speaker's turns must be a flat silence bar.
dialogue.speakers.forEach((speaker,index)=>{
 assert.equal(speaker.duration,dialogue.duration);
 let silenceBins=0;
 speaker.heights.forEach((height,bin)=>{
  const start=bin/106*dialogue.duration,end=(bin+1)/106*dialogue.duration;
  if(!dialogue.turns.some(turn=>turn.speaker===index&&turn.start<end&&turn.end>start)){
   assert.equal(height,3);
   silenceBins++;
  }
 });
 assert(silenceBins>20);
});
await fs.mkdir(dir,{recursive:true});
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]) {
 const browser=await type.launch();
 const page=await browser.newPage({viewport:{width:1598,height:1000},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:3001/');
 const play=page.getByRole('button',{name:'Play PyAI demo',exact:true});
 await play.scrollIntoViewIfNeeded();
 await page.waitForTimeout(1800);
 const capsule=page.locator('audio').locator('..');
 const audio=capsule.locator('audio');
 assert.equal(await audio.count(),1);
 await play.click();
 await page.waitForTimeout(1200);
 await expect.poll(()=>audio.evaluate(a=>a.currentTime>0&&!a.paused)).toBe(true);
 await page.getByRole('button',{name:'Pause PyAI demo',exact:true}).click();
 const paused=await audio.evaluate(a=>a.currentTime);
 await page.waitForTimeout(250);
 assert.equal(await audio.evaluate(a=>a.currentTime),paused);
 await play.click();
 // Check all six speaker handoffs against the generated audio timeline.
 for(const turn of dialogue.turns){
  await audio.evaluate((a,time)=>{a.currentTime=time},turn.start+.3);
  await expect(capsule.locator('[data-speaking="true"]')).toHaveCount(1);
  await expect(capsule.locator('[data-wave]').nth(turn.speaker).locator('..')).toHaveAttribute('data-speaking','true');
  await page.waitForTimeout(180);
  assert(await audio.evaluate(a=>!a.paused));
  const progress=await capsule.locator('[data-wave]').evaluateAll(waves=>waves.map(w=>parseFloat(w.style.getPropertyValue('--played'))));
  assert.equal(progress[0],progress[1]);
  assert(Math.abs(progress[0]-(await audio.evaluate(a=>a.currentTime))/dialogue.duration*100)<1);
 }
 await audio.evaluate(a=>{a.currentTime=a.duration-.2});
 await expect(play).toBeVisible();
 assert(await audio.evaluate(a=>a.ended));
 await play.click();
 await page.waitForTimeout(300);
 assert(await audio.evaluate(a=>a.currentTime<2&&!a.paused));
 await page.getByRole('button',{name:'Pause PyAI demo',exact:true}).click();
 await capsule.screenshot({path:`${dir}/${name}-capsule.png`});
 for(const width of [1024,390]){
  await page.setViewportSize({width,height:900});
  await play.scrollIntoViewIfNeeded();
  await capsule.screenshot({path:`${dir}/${name}-${width}.png`});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 console.log(`${name}: playback, pause, resume, end, replay and responsive widths passed`);
 await browser.close();
}
