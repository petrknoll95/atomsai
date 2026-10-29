import {chromium,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const width of [1600,390]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.slitFrames=[];
    const sample=()=>{const el=document.querySelector('[data-menu-hero-background]');if(el){const css=getComputedStyle(el),tiles=Array.from(el.querySelectorAll('[data-hero-slit-content]')),strips=Array.from(el.querySelectorAll('[data-hero-slit-strip]'));window.slitFrames.push({open:el.dataset.heroPatternState==='open',widths:strips.map(strip=>strip.parentElement.getBoundingClientRect().width),cellWidths:Array.from(el.querySelectorAll('[data-hero-slit-cell]')).map(cell=>cell.getBoundingClientRect().width),values:strips.map((_,i)=>parseFloat(css.getPropertyValue(`--hero-slit-${i}`))||0),scales:tiles.map(tile=>new DOMMatrixReadOnly(getComputedStyle(tile).transform).a),shifts:strips.map(strip=>new DOMMatrixReadOnly(getComputedStyle(strip).transform).e),vertical:tiles.map(tile=>new DOMMatrixReadOnly(getComputedStyle(tile).transform).f)});if(el.dataset.heroPatternState==='open')return;}requestAnimationFrame(sample)};requestAnimationFrame(sample);
   });
   await page.goto('http://localhost:3001/');
   const bg=page.locator('[data-menu-hero-background]');await expect(bg).toHaveAttribute('data-hero-pattern-state','open',{timeout:15000});
   const frames=await page.evaluate(()=>window.slitFrames);const last=frames.at(-1),middle=last.values.length/2;
   assert(frames.some(f=>f.scales.every(s=>s>1.199)), 'Every tile starts at 120%');
   assert(frames.some(f=>f.scales.some(s=>s>1.01&&s<1.19)),'Zoom interpolates throughout each reveal');
   assert(frames.some(f=>f.values[middle]>10&&f.values[middle]<90&&f.values[0]<f.values[middle]),'Each pair follows the center-out stagger');
   assert(frames.every(f=>f.values.every((v,i)=>Math.abs(v-f.values.at(-1-i))<.01)),'Symmetric pairs reveal together');
   assert(frames.some(f=>f.values[middle]>f.values[0]),'Center reveals first');
   const start=frames.find(f=>f.scales.every(s=>s>1.199)&&f.shifts.at(-1)<0);
   assert(frames.filter(f=>f.values.some(v=>v>5&&v<95)).every(f=>f.values.every((v,i)=>Math.abs((i<middle?-f.shifts[i]/f.widths[i]:1+f.shifts[i]/f.widths[i])*100-v)<.2)),'Each strip shift matches its own eased mask progress');
   assert(start.cellWidths.every((w,i)=>Math.abs(w-start.widths[Math.floor(i/2)])<.1),'Each mask holds two equally sized pattern slits');
   assert(last.shifts.every((x,i)=>Math.abs(Math.abs(x-start.shifts[i])-last.widths[i])<.2),'Every strip travels exactly one full pattern slit');
   assert(last.shifts[middle-1]<start.shifts[middle-1]&&last.shifts[middle]>start.shifts[middle],'Both halves travel outward with their expanding masks');
   assert(frames.some(f=>f.vertical.every((y,i)=>Math.floor(i/2)%2===0?y<0:y>0)),'Adjacent slits alternate vertical directions');
   assert(last.vertical.every(y=>y===0),'Vertical movement settles at zero');
   assert(last.shifts.every((x,i)=>Math.abs(x-(i<middle?-last.widths[i]:0))<.2),'Final slit aligns with the live pattern');
   assert(last.scales.every(s=>s===1)&&last.values.every(v=>v===100),'All tiles finish at 100%');
   const masks=await bg.evaluate(el=>getComputedStyle(el).getPropertyValue('--hero-slit-masks'));assert(masks.includes('to left')&&masks.includes('to right'));
   const source=bg.locator('[data-hero-pattern-source] canvas');const phase=await source.getAttribute('data-phase');await page.waitForTimeout(300);assert.notEqual(await source.getAttribute('data-phase'),phase,'Live tide resumes after reveal');
   await page.screenshot({path:`docs/visual/menu-hero/${name}-${width}-center-zoom.png`});
   await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(bg).toHaveAttribute('data-hero-pattern-state','open',{timeout:20000});
   assert.deepEqual(errors,[]);console.log(`${name} ${width}: paired pattern slits, full-width opposing travel, zoom, zigzag, center-out masks and reduced motion passed`);await page.close();
  }
 }finally{await browser.close();}
}
