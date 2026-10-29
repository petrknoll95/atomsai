import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const points={'nested-cube':[248,160],'layered-planes':[200,94]};
const paths=svg=>svg.locator('path').evaluateAll(els=>els.map(el=>el.getAttribute('d')).join('|'));
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:3001/');
  const offerings=page.locator('[data-section="offerings"]');
  await offerings.scrollIntoViewIfNeeded();await page.waitForTimeout(1400);
  for(const [context,root] of [['home',offerings],['header',page.locator('[data-mega-menu="Infrastructure"]')]]){
   if(context==='header'){
    await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(1200);
    await page.locator('[data-menu="Infrastructure"] > summary').hover();await page.waitForTimeout(1000);
   }
   for(const [figureName,point] of Object.entries(points)){
    const figure=root.locator(`[data-infrastructure-figure="${figureName}"]`);
    await expect(figure).toHaveAttribute('data-ready','true');
    const svg=figure.locator('svg'),stage=figure.locator('[data-hairline]');
    const box=await stage.boundingBox();
    await page.mouse.move(5,900);await page.waitForTimeout(1000);
    // Keep desktop dropdown open while moving out of the artwork.
    if(context==='header'){
     await page.locator('[data-menu="Infrastructure"] > summary').hover();await page.waitForTimeout(400);
    }
    const rest=await paths(svg);
    const liveBox=await stage.boundingBox();
    await page.mouse.move(liveBox.x+point[0]/400*liveBox.width,liveBox.y+point[1]/320*liveBox.height);
    await page.waitForTimeout(1000);
    const expanded=await paths(svg);
    assert.notEqual(expanded,rest,`${name} ${context} ${figureName}: geometry must move`);
    await page.waitForTimeout(200);assert.equal(await paths(svg),expanded,'Hover must settle');
    assert(await svg.evaluate(el=>{const b=el.getBBox();return b.x>0&&b.y>0&&b.x+b.width<400&&b.y+b.height<320;}),'Expanded geometry stays in frame');
    await root.screenshot({path:`docs/design/infrastructure-hairline/${name}-${context}-${figureName}-hover.png`});
    if(context==='header')await page.locator('[data-menu="Infrastructure"] > summary').hover();else await page.mouse.move(5,900);
    await page.waitForTimeout(1000);assert.equal(await paths(svg),rest,'Returns to exact rest pose');
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);
    const reducedBox=await stage.boundingBox();
    await page.mouse.move(reducedBox.x+point[0]/400*reducedBox.width,reducedBox.y+point[1]/320*reducedBox.height);
    await page.waitForTimeout(150);const reduced=await paths(svg);
    await page.waitForTimeout(200);assert.equal(await paths(svg),reduced,'Reduced motion settles immediately');
    await page.emulateMedia({reducedMotion:'no-preference'});
    if(context==='header')await page.locator('[data-menu="Infrastructure"] > summary').hover();else await page.mouse.move(5,900);
    await page.waitForTimeout(1000);
    console.log(`${name} ${context} ${figureName}: hover, settle, bounds, return, reduced motion passed`);
   }
  }
  assert.deepEqual(errors,[]);await page.close();
 }finally{await browser.close();}
}
