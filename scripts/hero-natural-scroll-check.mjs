import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const check = expect.configure({ timeout: 20000 });
for (const [name, engine] of Object.entries({ chromium, webkit })) {
 const browser = await engine.launch();
 try {
  for (const width of [1600, 390]) {
   const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
   const errors=[]; page.on('pageerror', e=>errors.push(e.message));
   await page.goto('http://localhost:3001/');
   await check(page.locator('[data-hero-copy]')).toHaveAttribute('data-hero-copy-state','open');
   const read = () => page.evaluate(() => {
    const stage=document.querySelector('[data-hero-stage]'), copy=document.querySelector('[data-hero-copy]'), field=document.querySelector('[data-menu-hero-field]'), next=document.querySelector('[data-hero-reveal]');
    return { scroll:scrollY, stage:stage.getBoundingClientRect().top, height:stage.offsetHeight, copy:copy.getBoundingClientRect().top, field:field.getBoundingClientRect().top, next:next.getBoundingClientRect().top, mask:getComputedStyle(next).maskImage, inert:next.inert, hidden:next.getAttribute('aria-hidden'), pin:stage.parentElement.className.includes('pin-spacer') };
   });
   const start=await read();
   assert.equal(start.pin,false,'No pinned hero wrapper');
   assert(Math.abs(start.next-start.height)<2,'Next section starts immediately after one hero viewport');
   const distance=start.height*.4;
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),distance);
   await check.poll(async()=>Math.abs((await read()).stage+distance)).toBeLessThan(2);
   await page.waitForTimeout(2300);
   const middle=await read();
   assert(Math.abs(middle.scroll-distance)<2,'Scroll stays where the user stops, with no takeover');
   assert(Math.abs(middle.next-(start.height-distance))<2,'Next section enters at natural scroll speed');
   assert(Math.abs(middle.copy+distance*.8)<2,'Hero copy scrolls upward with subtle parallax');
   assert(Math.abs(middle.field+distance*.55)<2,'Pattern scrolls upward more slowly');
   assert.equal(middle.mask,'none'); assert.equal(middle.inert,false); assert.equal(middle.hidden,null);
   await page.screenshot({path:`docs/visual/menu-hero/${name}-${width}-natural-scroll.png`});
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   await check.poll(async()=>Math.abs((await read()).copy)).toBeLessThan(2);
   await page.locator('[data-hero-copy] a[href="#applications"]').click();
   await check.poll(()=>page.locator('#applications').evaluate(el=>Math.abs(el.getBoundingClientRect().top-(innerWidth<768?96:112)))).toBeLessThan(3);
   await page.waitForTimeout(1000);
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForTimeout(500);
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),distance);
   await check.poll(async()=>Math.abs((await read()).copy+distance)).toBeLessThan(2);
   await check.poll(async()=>Math.abs((await read()).field+distance)).toBeLessThan(2);
   assert.deepEqual(errors,[]);
   console.log(`${name} ${width}: normal flow, no scroll takeover, parallax, reverse, anchor and reduced motion passed`);
   await page.close();
  }
 } finally { await browser.close(); }
}
