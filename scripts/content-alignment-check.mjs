import { chromium, webkit } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const posts=JSON.parse(await readFile('src/content/blog/posts.json','utf8'));
const routes=['/','/approach','/capabilities/voice','/industries/healthcare','/trust','/company/contact','/blog','/hero-variants/nebula','/hero-variants/particles','/integration-variants/marquee','/application-variants/original',...posts.map(p=>`/blog/${p.slug}`)];
await mkdir('docs/visual/content-alignment',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  for(const width of [390,1200,2048]){
   await page.setViewportSize({width,height:1000});
   for(const route of routes){
    await page.goto(`http://localhost:3001${route}`,{waitUntil:'load'});
    const result=await page.evaluate(()=>{
     const header=document.querySelector('header[data-responsive-menu-open]');
     const logo=header.querySelector('a[aria-label="AtomsAI home"]').getBoundingClientRect();
     const inner=header.querySelector('[class*="headerInner"]'),box=inner.getBoundingClientRect(),style=getComputedStyle(inner);
     const left=logo.left,right=box.right-parseFloat(style.paddingRight);
     const containers=[...document.querySelectorAll('.page-container')].filter(el=>el.getBoundingClientRect().width>0);
     const errors=containers.flatMap(el=>{
      const b=el.getBoundingClientRect(),s=getComputedStyle(el),l=b.left+parseFloat(s.paddingLeft),r=b.right-parseFloat(s.paddingRight);
      return Math.abs(l-left)>1||Math.abs(r-right)>1?[{element:el.id||el.className,left:l,right:r,expected:[left,right]}]:[];
     });
     return {errors,count:containers.length,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert(result.count>0,`${route}: shared content containers`);
    assert.deepEqual(result.errors,[],`${name} ${width} ${route}: content rails`);
    assert(!result.overflow,`${name} ${width} ${route}: no horizontal overflow`);
   }
   console.log(`${name} ${width}px: all ${routes.length} routes align with the header; no horizontal overflow.`);
  }
  for(const width of [768,1199,1600]){
   await page.setViewportSize({width,height:1000});await page.goto('http://localhost:3001/');
   const result=await page.evaluate(()=>{
    const logo=document.querySelector('a[aria-label="AtomsAI home"]').getBoundingClientRect();
    const section=document.querySelector('[data-section="offerings"]');const b=section.getBoundingClientRect(),s=getComputedStyle(section);
    return {left:b.left+parseFloat(s.paddingLeft),expected:logo.left};
   });
   assert(Math.abs(result.left-result.expected)<1,`${width}: breakpoint aligns`);
  }
  await page.locator('[data-section="offerings"]').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
  await page.screenshot({path:`docs/visual/content-alignment/${name}-offerings-1600.png`});
  await page.locator('[data-menu="Infrastructure"] > summary').hover();await page.waitForTimeout(400);
  const menu=page.locator('[data-mega-menu="Infrastructure"]');
  const menuAligned=await menu.evaluate(el=>{
   const inner=el.querySelector('[class*="inner"]');const b=inner.getBoundingClientRect(),s=getComputedStyle(inner);
   const logo=document.querySelector('a[aria-label="AtomsAI home"]').getBoundingClientRect();
   return Math.abs(b.left+parseFloat(s.paddingLeft)-logo.left)<1;
  });
  assert(menuAligned,`${name}: desktop menu aligns`);
  console.log(`${name}: intermediate breakpoints and dropdown alignment passed.`);
 }finally{await browser.close();}
}
