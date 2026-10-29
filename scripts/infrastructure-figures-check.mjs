import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const out='docs/design/infrastructure-hairline';
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try {
  for(const width of [1600,1200]){
   const page=await browser.newPage({viewport:{width,height:950}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://localhost:3001/approach');
   await page.locator('[data-menu="Infrastructure"] > summary').hover();
   const menu=page.locator('[data-mega-menu="Infrastructure"]');
   await expect(menu.locator('[data-infrastructure-figure][data-ready="true"]')).toHaveCount(3,{timeout:15000});
   await expect(menu.locator('img[src*="menu-"]')).toHaveCount(0);
   await expect(menu.locator('img[src*="offerings-"]')).toHaveCount(0);
   await page.waitForTimeout(700);
   const points=[[172,144],[228,107],[200,159]];
   for(const [index,figure] of (await menu.locator('[data-infrastructure-figure]').all()).entries()){
    const svg=figure.locator('svg');
    const before=await svg.innerHTML();
    const box=await figure.boundingBox();
    await page.mouse.move(box.x+points[index][0]/400*box.width,box.y+points[index][1]/320*box.height);
    await page.waitForTimeout(950);
    assert.notEqual(await svg.innerHTML(),before,'Figure responds to hover');
    const stable=await svg.innerHTML();await page.waitForTimeout(150);assert.equal(await svg.innerHTML(),stable,'Figure settles');
    assert(await svg.evaluate(el=>{const b=el.getBBox();return b.x>=0&&b.y>=0&&b.x+b.width<=400&&b.y+b.height<=320;}));
   }
   await page.locator('[data-menu="Infrastructure"] > summary').hover();
   await page.waitForTimeout(950);
   await menu.screenshot({path:`${out}/${name}-${width}-menu.png`});
   await page.locator('[data-menu="Company"] > summary').hover();
   await page.waitForTimeout(500);
   await page.locator('[data-menu="Infrastructure"] > summary').hover();
   await expect(menu.locator('[data-ready="true"]')).toHaveCount(3);
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForTimeout(100);
   await menu.locator('[data-infrastructure-figure]').first().hover();
   await page.waitForTimeout(100);
   const stopped=await menu.locator('svg').first().innerHTML();await page.waitForTimeout(200);
   assert.equal(await menu.locator('svg').first().innerHTML(),stopped);
   assert.deepEqual(errors,[]);
   console.log(`${name} ${width}: three illustrations, pointer motion, stable rest, bounds, remount, reduced motion passed`);
   await page.close();
  }
 }finally{await browser.close();}
}
