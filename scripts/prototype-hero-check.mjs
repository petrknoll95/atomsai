import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='docs/visual/prototype-hero';
await fs.mkdir(out,{recursive:true});
const results=[];
for (const [name,engine] of Object.entries({chromium,webkit})) {
 const browser=await engine.launch();
 try {
  for (const width of (process.env.HERO_WIDTHS ? process.env.HERO_WIDTHS.split(',').map(Number) : [1600,1200,900,390,320])) {
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:3001/hero-variants/nebula');
   await expect(page.locator('[data-prototype-field]')).toHaveAttribute('data-ready','true',{timeout:30000});
   await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1300);
   const geometry=await page.evaluate(()=>{
    const hero=document.querySelector('[data-section=hero]'),field=hero.querySelector('[data-prototype-field]'),stage=field.parentElement;
    const title=hero.querySelector('h1').getBoundingClientRect(),lead=hero.querySelector('p').getBoundingClientRect();
    const logo=document.querySelector('header a[aria-label="AtomsAI home"]').getBoundingClientRect();
    const menu=document.querySelector('header button[aria-label="Open site menu"]').getBoundingClientRect();
    const button=hero.querySelector('a').getBoundingClientRect();
    const css=getComputedStyle(hero),total=Number(css.getPropertyValue('--hero-scroll-length'));
    const timeline={rings:.42*Number(css.getPropertyValue('--hero-particle-length'))/total,start:Number(css.getPropertyValue('--hero-white-start'))/total,end:Number(css.getPropertyValue('--hero-white-end'))/total};
    return {range:hero.offsetHeight-stage.offsetHeight,height:hero.offsetHeight,titleX:title.x,leadX:lead.x,logoX:logo.x,buttonRight:button.right,menuRight:menu.right,overflow:document.documentElement.scrollWidth>innerWidth,timeline};
   });
   assert(!geometry.overflow); assert(Math.abs(geometry.titleX-geometry.logoX)<1); assert(Math.abs(geometry.leadX-geometry.logoX)<1);
   if(width>1100) assert(Math.abs(geometry.buttonRight-geometry.menuRight)<1);
   if([1600,390].includes(width)) await page.screenshot({path:`${out}/${name}-${width}-start.png`});
   const scroll=async t=>{await page.evaluate(y=>window.scrollTo(0,y),geometry.range*t);await expect.poll(async()=>Math.abs(Number(await page.locator('[data-section=hero]').getAttribute('data-progress'))-t),{timeout:15000}).toBeLessThan(.0015);await page.waitForTimeout(150)};
   await scroll(geometry.timeline.rings);
   assert(Math.abs(await page.locator('[data-prototype-field]').evaluate(el=>el.getBoundingClientRect().top))<2);
   if(width===1600) await page.screenshot({path:`${out}/${name}-rings.png`});
   await scroll((geometry.timeline.start+geometry.timeline.end)/2);
   const partial = page.locator('[data-hero-reveal]');
   const revealState = await partial.evaluate(el => ({
    opacity: getComputedStyle(el).opacity,
    contentOpacity: getComputedStyle(el.firstElementChild).opacity,
    offset: parseFloat(el.style.getPropertyValue('--reveal-offset')),
    headings: [...el.querySelectorAll('h2')].map(h => getComputedStyle(h).opacity),
   }));
   assert.equal(revealState.opacity, '1');
   assert.equal(revealState.contentOpacity, '1');
   assert(revealState.headings.every(opacity => opacity === '1'));
   assert(revealState.offset > 40, 'Section must begin lower in the white aperture');
   if(width===1600) await page.screenshot({path:`${out}/${name}-reveal.png`});
   await scroll(geometry.timeline.end+(1-geometry.timeline.end)*.2);
   await expect.poll(()=>partial.evaluate(el=>getComputedStyle(el).clipPath)).toBe('none');
   const held = await partial.locator('[data-section=offerings]').boundingBox();
   await scroll(geometry.timeline.end+(1-geometry.timeline.end)*.8);
   const heldAfter = await partial.locator('[data-section=offerings]').boundingBox();
   assert(Math.abs(held.y - heldAfter.y) < 1, 'Fully revealed section must remain pinned through the reading hold');
   await scroll(1);
   const reveal=page.locator('[data-hero-reveal]');
   await expect(reveal).toHaveAttribute('aria-hidden','false');
   await expect.poll(()=>reveal.evaluate(el=>getComputedStyle(el).clipPath),{timeout:5000}).toBe('none');
   assert.equal(await reveal.evaluate(el=>getComputedStyle(el.firstElementChild).opacity),'1');
   const eyebrow = await page.locator('[data-section=offerings] > .eyebrow').boundingBox();
   const header = await page.getByRole('banner').boundingBox();
   assert(eyebrow.y >= header.y + header.height + 20, 'Revealed content must clear the header');
   if(width>=768){
    const cards=await page.locator('[data-section=offerings] > :last-child').boundingBox();
    const center=(eyebrow.y+cards.y+cards.height)/2;
    assert(Math.abs(center-((900+header.y+header.height)/2-12))<2,'Desktop content should sit at the optical center below the header');
   }
   if([1600,390].includes(width)) await page.screenshot({path:`${out}/${name}-${width}-next.png`});
   const before=await reveal.boundingBox(); await page.evaluate(()=>window.scrollBy(0,120)); await page.waitForTimeout(1500);
   const after=await reveal.boundingBox(); assert(Math.abs(before.y-after.y-120)<2,'Reveal must continue into normal page scrolling');
   await scroll(0);
   await expect(page.locator('#hero-heading')).toBeVisible();
   const services=page.locator('header').getByRole('link',{name:'AI Services',exact:true});
   if(await services.isVisible()) await services.click(); else {
    await page.getByRole('button',{name:'Open site menu',exact:true}).click();
    await page.getByRole('dialog').getByRole('link',{name:'AI Services',exact:true}).click();
   }
   await expect.poll(async()=>Number(await page.locator('[data-section=hero]').getAttribute('data-progress')),{timeout:15000}).toBe(1);
   await expect(reveal).toHaveAttribute('aria-hidden','false');
   assert.deepEqual(errors,[]);
   results.push({name,width,geometry,scroll:true,reveal:true,alignment:true,errors});
   console.log(`${name} ${width}: alignment, reveal and section navigation passed`);
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:3001/hero-variants/nebula');
  await expect(page.locator('[data-prototype-field]')).toHaveAttribute('data-ready','true',{timeout:30000});
  await page.evaluate(()=>scrollTo(0,480)); await page.waitForTimeout(600);
  await expect(page.locator('[data-hero-reveal]')).toHaveAttribute('aria-hidden','false');
  assert.equal(await page.locator('[data-hero-reveal]').evaluate(el=>getComputedStyle(el.firstElementChild).opacity),'1');
  results.push({name,reducedMotion:true});
  await page.close();
 } finally { await browser.close(); }
}
await fs.writeFile(`${out}/${process.env.HERO_WIDTHS ? 'clearance-checks' : 'checks'}.json`,JSON.stringify(results,null,2));
console.log('Prototype hero passed in Chromium and WebKit.');
