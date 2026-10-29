import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const check=expect.configure({timeout:15000});
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const width of [1600,390]){
   const page=await browser.newPage({viewport:{width,height:900},isMobile:width<768,hasTouch:width<768});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(() => {
    window.heroRevealFrames = [];
    const sample = () => {
     const background = document.querySelector('[data-menu-hero-background]');
     const stage = document.querySelector('[data-hero-stage]');
     if (background && stage) {
      const css = getComputedStyle(background);
      window.heroRevealFrames.push({ slits: Array.from({ length: Number(css.getPropertyValue('--menu-columns')) + 2 }, (_, index) => parseFloat(css.getPropertyValue(`--hero-slit-${index}`)) || 0), mask: css.maskImage, base: getComputedStyle(stage).backgroundColor, light: getComputedStyle(stage, '::before').opacity });
     }
     if (!background || background.dataset.heroPatternState !== 'open') requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
   });
   await page.goto('http://localhost:3001/');
   const hero=page.locator('[data-variant="menu"]'),background=page.locator('[data-menu-hero-background]'),canvas=background.locator('[data-hero-pattern-source] canvas');
   await check(hero).toHaveAttribute('data-enhanced','true');
   await check(canvas).toHaveAttribute('data-render-state','ready');
   await check(background).toHaveAttribute('data-hero-pattern-state', 'open');
   await page.waitForTimeout(1000);
   const frames = await page.evaluate(() => window.heroRevealFrames);
   assert(frames.some(frame => frame.slits[Math.floor(frame.slits.length / 2)] > frame.slits[0] && frame.mask !== 'none'), 'Slits reveal from the center toward the edges');
   assert(frames.some(frame => frame.mask.includes('to left') && frame.mask.includes('to right') && frame.mask.includes('0%') && !frame.mask.includes('calc(50%')), 'Masks expand outward on each side');
   assert(frames.every(frame => frame.slits.every((value, index) => Math.abs(value - frame.slits.at(-1 - index)) < .01)), 'Symmetric slit pairs reveal together');
   assert(frames.every(frame => frame.base !== 'rgba(0, 0, 0, 0)' && frame.base !== 'rgb(255, 255, 255)'), 'Reveal has a flat dark base, no light layer');
   await check(page.locator('#hero-heading')).toBeVisible();
   await check(page.locator('[data-starfield]')).toHaveCount(0);
   assert.equal(await canvas.getAttribute('data-pattern'),'offset');
   assert.equal(await canvas.getAttribute('data-motion'),'tide');
   assert.equal(await canvas.getAttribute('data-count'),width<768?'6':'10');
   await check(background).toHaveCSS('opacity','1');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const phase=await canvas.getAttribute('data-phase');await page.waitForTimeout(250);assert.notEqual(await canvas.getAttribute('data-phase'),phase);
   await page.screenshot({path:`docs/visual/menu-hero/${name}-${width}.png`});
   const range=await hero.locator('[data-hero-stage]').evaluate(el=>el.offsetHeight);
   await page.evaluate(y=>scrollTo(0,y),range*.55);
   await check(page.locator('[data-hero-reveal]')).toHaveCSS('mask-image','none');
   await check(background).toHaveCSS('opacity','1');
   await page.evaluate(y=>scrollTo(0,y),range);
   await check(page.locator('[data-hero-reveal]')).not.toHaveAttribute('aria-hidden');
   await check(page.locator('[data-hero-reveal]')).toHaveCSS('transform','none');
   await page.screenshot({path:`docs/visual/menu-hero/${name}-${width}-revealed.png`});
   await check(hero).not.toHaveAttribute('data-auto-flight','true');await page.waitForTimeout(300);
   if(width<768)await page.evaluate(()=>scrollTo(0,0));else await page.mouse.wheel(0,-range);
   await check(background).toHaveCSS('opacity','1');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(800);
   const still=await canvas.getAttribute('data-phase');await page.waitForTimeout(250);assert.equal(await canvas.getAttribute('data-phase'),still);
   await page.locator('[data-menu="site"]').click();
   await check(page.locator('[data-menu-pattern] canvas')).toHaveAttribute('data-render-state','ready');
   assert(Number(await canvas.getAttribute('data-count')) > Number(await page.locator('[data-menu-pattern] canvas').getAttribute('data-count')), 'Hero has a denser pattern than the menu');
   assert.deepEqual(errors,[]);
   console.log(`${name} ${width}: menu shader, preserved copy, natural scroll/reverse, reduced motion, menu compatibility passed`);
   await page.close();
  }
  const saved=await browser.newPage({reducedMotion:'reduce'});await saved.goto('http://localhost:3001/hero-variants/particles');
  await check(saved.locator('[data-starfield]')).toHaveAttribute('data-ready','true');
  await check(saved.locator('[data-menu-hero-background]')).toHaveCount(0);await saved.close();
 }finally{await browser.close();}
}
