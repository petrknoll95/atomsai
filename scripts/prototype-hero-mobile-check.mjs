import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const results = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]) {
      const page = await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:3});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:3001/hero-variants/nebula');
      const field=page.locator('[data-prototype-field]'), hero=page.locator('[data-section=hero]');
      await expect(field).toHaveAttribute('data-ready','true',{timeout:30000});
      const geometry=await hero.evaluate(el=>{
        const css=getComputedStyle(el),field=el.querySelector('[data-prototype-field]');
        return {range:el.offsetHeight-field.parentElement.offsetHeight,length:Number(css.getPropertyValue('--hero-scroll-length')),end:Number(css.getPropertyValue('--hero-white-end'))/Number(css.getPropertyValue('--hero-scroll-length'))};
      });
      assert(geometry.length<=270);
      assert(await field.locator('canvas').evaluate(el=>Math.abs(el.width-el.clientWidth*devicePixelRatio)<=1 && Math.abs(el.height-el.clientHeight*devicePixelRatio)<=1),'Particles render at native screen resolution');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const scroll=async t=>{await page.evaluate(y=>scrollTo(0,y),geometry.range*t);await expect.poll(async()=>Math.abs(Number(await hero.getAttribute('data-progress'))-Math.min(t,1)),{timeout:15000}).toBeLessThan(.0015);await page.waitForTimeout(100);};
      await scroll(geometry.end+(1-geometry.end)*.3);
      const first=page.locator('[data-offering]').first();
      const rect=await first.boundingBox();
      const header=await page.getByRole('banner').boundingBox();
      assert(rect.y>header.y+header.height+40);
      if(viewport.height>=500) assert(rect.y+rect.height<viewport.height-20,'First card fits during the mobile hold');
      assert(await first.evaluate(el=>[...el.querySelectorAll('h2,span')].every(child=>child.getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom+1)),'Card copy fits');
      await page.screenshot({path:`docs/visual/prototype-hero/${name}-mobile-${viewport.width}x${viewport.height}.png`});
      await scroll(1);
      const before=await first.boundingBox();
      await page.evaluate(()=>scrollBy(0,150));await page.waitForTimeout(300);
      assert(Math.abs(before.y-(await first.boundingBox()).y-150)<2,'Mobile pin releases into native scrolling');
      const last=page.locator('[data-offering]').last();
      await last.evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-120));await page.waitForTimeout(300);
      assert((await last.boundingBox()).y>=119,'Last card remains reachable');
      await expect(page.locator('[data-hero-reveal]')).toHaveCSS('clip-path','none');
      if(name==='chromium'&&viewport.width===390){
        await scroll(0);
        const cdp=await page.context().newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:650}]});
        for(let y=620;y>=300;y-=40){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});await page.waitForTimeout(25);}
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);
      }
      if(viewport.width===390){
        await page.setViewportSize({width:844,height:390});
        await expect(field.locator('canvas')).toHaveJSProperty('clientWidth',844);
        await page.waitForTimeout(300);
        const rotatedRange=await hero.evaluate(el=>el.offsetHeight-el.querySelector('[data-prototype-field]').parentElement.offsetHeight);
        await page.evaluate(y=>scrollTo(0,y),rotatedRange);
        await expect(page.locator('[data-hero-reveal]')).toHaveCSS('clip-path','none');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      }
      assert.deepEqual(errors,[]);
      results.push({name,...viewport,...geometry,nativeRelease:true,allCardsReachable:true,errors});
      console.log(`${name} ${viewport.width}x${viewport.height}: mobile pin and card flow passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
await fs.writeFile('docs/visual/prototype-hero/mobile-checks.json',JSON.stringify(results,null,2));
