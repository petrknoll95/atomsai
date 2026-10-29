import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const output = process.env.NAV_CHECK_OUTPUT || '/tmp/atoms-responsive-nav';
const base = process.env.BASE_URL || 'http://localhost:3001';
await fs.mkdir(output, { recursive: true });
const groups = ['Applications', 'Infrastructure', 'Industries', 'Resources', 'Company'];
const industries = ['Manufacturing', 'Insurance', 'Healthcare', 'Logistics', 'Lending', 'Real estate', 'Auto dealers', 'Retail & e-commerce'];
const sizes = [[320,568],[360,800],[375,812],[390,844],[430,932],[599,850],[600,850],[767,900],[768,1024],[899,900],[900,900],[1024,768],[1199,900],[1200,900],[1440,900],[1920,1080],[844,390],[667,375]];
const results = [];
const label = (panel, name) => panel.locator('[data-section-trigger]').filter({hasText:name});
async function checkBounds(panel) {
 const result = await panel.evaluate(root => {
  const bounds = root.getBoundingClientRect();
  const interactive = [...root.querySelectorAll('a, button')].filter(el=>el.getClientRects().length && !el.closest('[hidden], [inert]'));
  return { overflow:root.scrollWidth>root.clientWidth+1,
   clipped:interactive.filter(el=>{const r=el.getBoundingClientRect();return r.left<bounds.left-1||r.right>bounds.right+1;}).map(el=>el.textContent.trim()),
   small:interactive.filter(el=>el.getBoundingClientRect().height<43.5).map(el=>({text:el.textContent.trim(),height:el.getBoundingClientRect().height}))};
 });
 assert.equal(result.overflow,false,JSON.stringify(result)); assert.deepEqual(result.clipped,[]); assert.deepEqual(result.small,[]);
}
for (const [engineName, engine] of Object.entries({chromium,webkit})) {
 const browser = await engine.launch();
 const tabKey = engineName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
 try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const panel=page.locator('[data-responsive-panel]');
  for (const [width,height] of sizes) {
   await page.setViewportSize({width,height});
   if(width>=1200){
    await expect(page.locator('[data-responsive-trigger]')).toBeHidden();
    const nav=page.getByRole('navigation',{name:'Main navigation',exact:true});await expect(nav).toBeVisible();
    for(const group of groups){await nav.locator(`[data-menu="${group}"] > summary`).hover();await expect(page.locator(`[data-dropdown-pane="${group}"]`)).toBeVisible();}
    const overlap=await nav.evaluate(el=>el.getBoundingClientRect().right>el.nextElementSibling.getBoundingClientRect().left+1);assert.equal(overlap,false);
    await page.keyboard.press('Escape');
   }else{
    await page.getByRole('button',{name:'Open navigation',exact:true}).click();
    await expect(panel).toBeVisible();await expect(page.getByRole('dialog',{name:'Site navigation'})).toBeVisible();
    await checkBounds(panel);
    for(const group of groups){
     await label(panel,group).click();await expect(label(panel,group)).toHaveAttribute('aria-expanded','true');
     assert.equal(await panel.locator('[data-section-trigger][aria-expanded="true"]').count(),1);
     await checkBounds(panel);
     if(group==='Industries')for(const industry of industries)await expect(panel.getByRole('link',{name:industry,exact:true})).toBeVisible();
     if(group==='Applications')for(const name of ['JustCall','Helpwise','ServiceAgent','CallPage']){
      await panel.getByRole('button',{name:new RegExp(`^${name} `)}).click();
      await expect(panel.locator(`[data-responsive-preview="${name}"]`)).toBeVisible();
      await expect(panel.getByRole('link',{name:`Explore ${name}`,exact:true})).toBeVisible();await checkBounds(panel);
     }
     if([320,390,768,1024,1199].includes(width)&&['Industries','Company','Infrastructure'].includes(group)){
      await panel.evaluate(el=>{const row=el.querySelector('[data-section-trigger][aria-expanded="true"]');el.scrollTop+=row.getBoundingClientRect().top-el.getBoundingClientRect().top;});
      await panel.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));
      await page.screenshot({path:`${output}/${engineName}-${width}-${group.toLowerCase()}.png`});
     }
    }
    await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(page.getByRole('button',{name:'Open navigation',exact:true})).toBeFocused();
    assert.notEqual(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
    assert.equal(await page.locator('main').evaluate(el=>!!el.closest('[inert]')),false);
   }
   results.push({engine:engineName,width,height,passed:true});
  }
  // Keyboard containment, collapsed focus order, and no background wheel scrolling.
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Open navigation',exact:true}).focus();await page.keyboard.press('Enter');
  const home=page.getByRole('link',{name:'AtomsAI home',exact:true});await home.focus();await page.keyboard.press('Shift+Tab');
  await expect(panel.getByRole('link',{name:'Privacy Policy',exact:true})).toBeFocused();await page.keyboard.press(tabKey);await expect(home).toBeFocused();
  await page.getByRole('button',{name:'Close navigation',exact:true}).focus();await page.keyboard.press(tabKey);await expect(label(panel,'Applications')).toBeFocused();
  await page.keyboard.press('Enter');await expect(label(panel,'Applications')).toHaveAttribute('aria-expanded','true');
  await label(panel,'Industries').click();const scrollBefore=await page.evaluate(()=>window.scrollY);
  await page.mouse.move(300,500);await page.mouse.wheel(0,650);await page.waitForTimeout(150);
  assert((await panel.evaluate(el=>el.scrollTop))>0);assert.equal(await page.evaluate(()=>window.scrollY),scrollBefore);
  // Resize out of the mobile navigation must release modal state and focus.
  await page.setViewportSize({width:1200,height:900});await expect(panel).toBeHidden();await expect(page.locator('header[data-responsive-menu-open]')).not.toHaveAttribute('aria-modal','true');
  await expect(page.locator('[data-menu="Applications"] > summary')).toBeFocused();
  assert.notEqual(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
  // Hash navigation unlocks before scrolling and hands focus to the destination.
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await label(panel,'Industries').click();await panel.getByRole('link',{name:'All industries',exact:true}).click();
  await expect(panel).toBeHidden();await expect(page).toHaveURL(/#industries$/);
  assert(await page.evaluate(()=>document.getElementById('industries').contains(document.activeElement)));
  const anchorTop=await page.locator('#industries').evaluate(el=>el.getBoundingClientRect().top);assert(anchorTop>=0&&anchorTop<200,`Anchor offset ${anchorTop}`);
  // Reopening and closing from a scrolled page must preserve scroll position.
  const position=await page.evaluate(()=>window.scrollY);await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.keyboard.press('Escape');
  assert(Math.abs(await page.evaluate(()=>window.scrollY)-position)<2);
  // Non-reduced motion, rapid toggles, and resizing while open on a touch device.
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('button',{name:'Close navigation',exact:true}).click();}
  await expect(panel).toBeHidden();assert.notEqual(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
  assert.deepEqual(errors,[]);
  await page.close();
  const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await touch.goto(base);await touch.getByRole('button',{name:'Open navigation',exact:true}).tap();
  const touchPanel=touch.locator('[data-responsive-panel]');await label(touchPanel,'Industries').tap();
  await touch.setViewportSize({width:844,height:390});await expect(touchPanel).toBeVisible();await checkBounds(touchPanel);
  await touch.getByRole('button',{name:'Close navigation',exact:true}).tap();await expect(touchPanel).toBeHidden();
  results.push({engine:engineName,keyboard:true,scrollLock:true,resize:true,anchors:true,rapidToggles:true,touch:true});
 } finally {await browser.close();}
}
await fs.writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
