import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const out='docs/visual/story-slits';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1600,height:960},reducedMotion:'reduce'});
 await page.addInitScript(()=>{const raf=requestAnimationFrame;window.requestAnimationFrame=callback=>raf(function run(t){if(window.freezeMotion)raf(run);else callback(t);});});
 await page.goto('http://127.0.0.1:3001/#customer-stories');
 const portrait=page.locator('[data-story-portraits]');await portrait.scrollIntoViewIfNeeded();
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(300);
 await page.locator('[data-story-playback]').evaluate(el=>el.click());
 const entries=[];
 for(const time of [0,160,340,560,820,1160]) {
  await page.evaluate(()=>window.freezeMotion=false);
  await page.getByRole('button',{name:'Go to story 3',exact:true}).evaluate(el=>el.click());await page.waitForTimeout(1200);
  await page.locator('[data-story-playback]').focus();
  await portrait.scrollIntoViewIfNeeded();await page.waitForTimeout(150);
  await page.getByRole('button',{name:'Go to story 4',exact:true}).evaluate(el=>el.click());
  await page.waitForTimeout(time);await page.evaluate(()=>window.freezeMotion=true);
  const file=`${out}/chromium-${time}ms.png`;await portrait.screenshot({path:file});
  entries.push({input:await sharp(file).resize({height:420}).toBuffer(),left:entries.length*315,top:28});
 }
 await sharp({create:{width:1890,height:448,channels:3,background:'#fafafa'}}).composite(entries).png().toFile(`${out}/frames.png`);
}finally{await browser.close();}
