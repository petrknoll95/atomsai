import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const results=[];
for (const [name,engine] of Object.entries({chromium,webkit})) {
 const browser=await engine.launch();
 try {
  const page=await browser.newPage({viewport:{width:1440,height:960}, reducedMotion:'reduce'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3001/');
  const nav=page.getByRole('navigation',{name:'Main navigation',exact:true,includeHidden:true});
  assert.equal(await nav.locator('[data-menu-chevron], [data-menu-dot]').count(),0);
  const apps=nav.locator('[data-menu="Applications"] > summary');
  await apps.hover(); await expect(apps).toHaveAttribute('aria-expanded','true');
  const panel=page.locator('[data-applications-panel]');
  await expect(panel).toBeVisible();
  const triggerBox=await apps.boundingBox(), panelBox=await panel.boundingBox();
  await page.mouse.move(triggerBox.x+20,triggerBox.y+triggerBox.height+5);
  await page.waitForTimeout(100);
  await page.mouse.move(panelBox.x+80,panelBox.y+30);
  await page.waitForTimeout(400);
  await expect(apps).toHaveAttribute('aria-expanded','true');
  await apps.click(); await expect(apps).toHaveAttribute('aria-expanded','true');
  await page.mouse.move(1100,600); await page.waitForTimeout(450);
  await expect(apps).toHaveAttribute('aria-expanded','false');
  for (const label of ['Infrastructure','Industries','Applications']) {
   const item=nav.locator(`[data-menu="${label}"] > summary`);
   await item.hover(); await expect(item).toHaveAttribute('aria-expanded','true');
   assert.equal(await nav.locator('[data-expanded="true"]').count(),1);
  }
  await nav.getByRole('link',{name:'Company',exact:true}).hover();
  await expect(apps).toHaveAttribute('aria-expanded','false');
  await page.mouse.move(1100,600);
  await apps.focus(); await page.keyboard.press('Enter');
  await expect(apps).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press(name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
  assert(await panel.evaluate(el=>el.contains(document.activeElement)), await page.evaluate(()=>document.activeElement.outerHTML));
  await page.keyboard.press('Escape');
  await expect(apps).toHaveAttribute('aria-expanded','false'); await expect(apps).toBeFocused();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await apps.hover(); await page.waitForTimeout(350);
  await expect(panel).toBeVisible();
  await page.screenshot({path:`docs/visual/header-dot-pill/${name}-dropdown-hover.png`});
  for (const width of [1920,1600,1440,1280,1200,1199,1024,768,390,320]) {
   await page.setViewportSize({width,height:960});
   assert(await nav.evaluate(el => {
    if (getComputedStyle(el).display === 'none') return true;
    const last=el.lastElementChild.getBoundingClientRect();
    const actions=el.nextElementSibling.getBoundingClientRect();
    return last.right <= actions.left;
   }), `Header overlaps at ${width}`);
  }
  assert.deepEqual(errors,[]); results.push({name,hover:true,gapCrossing:true,switching:true,keyboard:true,arrowsRemoved:true,errors});
 } finally {await browser.close();}
}
await fs.writeFile('docs/visual/header-dot-pill/hover-checks.json',JSON.stringify(results,null,2));
console.log('Hover, gap crossing, switching, click confirmation and keyboard checks passed in both browsers.');
