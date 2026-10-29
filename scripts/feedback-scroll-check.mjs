import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
const configText = await fs.readFile('src/components/feedback/firebase.ts','utf8');
const config = Object.fromEntries(['apiKey','projectId'].map(key => [key,configText.match(new RegExp(`${key}: '([^']+)'`))[1]]));
const app = initializeApp(config,'scroll-verification');
const uid = (await signInAnonymously(getAuth(app))).user.uid;
const id = crypto.randomUUID();
const ref = doc(getFirestore(app),'pages',encodeURIComponent('preview:atomsai-site:/'),'comments',id);
const now = new Date().toISOString();
const anchor = {selector:'#hero-heading',offsetX:.5,offsetY:.5,viewportX:.5,viewportY:.5};
await setDoc(ref,{id,ownerUid:uid,author:'Scroll verification',text:'Temporary smooth-scroll verification',anchor,createdAt:now,updatedAt:now,resolved:false,resolvedBy:'',resolvedAt:''});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  page.setDefaultTimeout(20000);
  await page.goto('http://127.0.0.1:3001');
  await expect(page.locator('html')).toHaveAttribute('data-smooth-scroll','true');
  await page.getByRole('button',{name:'Feedback',exact:true}).click();
  const pin = page.locator(`[data-comment-id="${id}"]`);
  await expect(pin).toBeVisible();
  for (const destination of [450,100]) {
    const samples = await page.evaluate(async ({id,destination}) => {
      window.scrollTo({top:destination,behavior:'instant'});
      const values=[];
      for (let i=0;i<70;i++) {
        await new Promise(resolve=>requestAnimationFrame(resolve));
        const pin=document.querySelector(`[data-comment-id="${id}"]`);
        const target=document.querySelector('#hero-heading').getBoundingClientRect();
        values.push({error:Math.abs(parseFloat(pin.style.top)-(target.top+scrollY+target.height*.5)),lag:Math.abs(scrollY+document.querySelector('#smooth-content').getBoundingClientRect().top)});
      }
      return values;
    },{id,destination});
    assert(samples.some(s=>s.lag>5),'Must test actual smooth-scroll catch-up');
    assert(Math.max(...samples.map(s=>s.error))<2,`Pin detached: ${JSON.stringify(samples)}`);
  }
  await page.getByRole('button',{name:'Close feedback',exact:true}).click();
  await expect(page.locator('#pindrop-web-pins')).toBeHidden();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Feedback',exact:true}).click();
  await expect(pin).toBeVisible();
  console.log('PASS: pins track animated scrolling in both directions within 2px; close/reopen and reduced motion work');
} finally {
  await browser.close();
  await deleteDoc(ref);
  await deleteApp(app);
}
