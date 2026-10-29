import {chromium,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='docs/visual/starfield-hero',results=[];
await fs.mkdir(out,{recursive:true});
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const viewport of [{width:1600,height:900},{width:390,height:844},{width:320,height:568}]){
   const mobile=viewport.width<768;
   const page=await browser.newPage({viewport,deviceScaleFactor:mobile?3:2,isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:3001/');
   const field=page.locator('[data-starfield]'),hero=page.locator('[data-variant=stars]');
   await expect(field).toHaveAttribute('data-ready','true',{timeout:30000});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1300);
   for(const locator of [hero.locator('h1'),hero.locator('p'),hero.getByRole('link',{name:'Explore applications'})]){
    const box=await locator.boundingBox();
    assert(Math.abs(box.x+box.width/2-viewport.width/2)<1,'Copy and CTA are centered');
    assert(box.y>90&&box.y+box.height<viewport.height-48,'Copy fits the viewport');
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const canvas=field.locator('canvas');
   assert(await canvas.evaluate(el=>Math.abs(el.width-el.clientWidth*devicePixelRatio)<=1));
   const pixels=()=>canvas.evaluate(el=>el.toDataURL());
   const before=await pixels();await page.waitForTimeout(350);assert.notEqual(await pixels(),before,'3D field has subtle idle movement');
   await page.mouse.move(30,160);await page.mouse.move(viewport.width-30,200,{steps:12});
   await expect.poll(async()=>Number(await field.getAttribute('data-camera-x'))).toBeGreaterThan(.01);
   await expect.poll(async()=>Number(await field.getAttribute('data-connections'))).toBeGreaterThan(0);
   await page.mouse.move(viewport.width/2,viewport.height/2,{steps:8});
   await expect.poll(async()=>Number(await field.getAttribute('data-connections'))).toBeGreaterThan(0);
   await page.waitForTimeout(600);
   await expect.poll(async()=>Number(await field.getAttribute('data-max-dot-scale'))).toBeGreaterThan(1.25);
   const graph=JSON.parse(await field.getAttribute('data-connection-graph'));
   const spokes=graph.filter(edge=>edge.depth===1),leaves=graph.filter(edge=>edge.depth===2);
   assert(spokes.length>=8&&spokes.length<=12);
   assert.equal(new Set(spokes.map(edge=>edge.from)).size,1,'All spokes radiate from one hub');
   assert.equal(new Set(leaves.map(edge=>edge.from)).size,leaves.length,'Each spoke has at most one additional connection');
   assert(leaves.every(edge=>spokes.some(spoke=>spoke.to===edge.from)),'No third hop');
   assert.equal(new Set(graph.map(edge=>edge.to)).size,graph.length,'Branches do not cross-connect');
   const [handover]=await Promise.all([
    page.evaluate(()=>new Promise(resolve=>{
     const field=document.querySelector('[data-starfield]'),started=performance.now(),samples=[],hubs=new Set();
     const frame=()=>{
      samples.push({count:Number(field.dataset.connections),strength:Number(field.dataset.connectionStrength)});
      hubs.add(JSON.parse(field.dataset.connectionGraph)[0]?.from);
      if(performance.now()-started<1800) requestAnimationFrame(frame);else resolve({samples,hubs:hubs.size});
     };requestAnimationFrame(frame);
    })),
    (async()=>{for(const [x,y] of [[.08,.3],[.92,.75],[.12,.8],[.88,.3],[.5,.5]]) await page.mouse.move(viewport.width*x,Math.max(160,viewport.height*y),{steps:14});})(),
   ]);
   assert(handover.hubs>2,'Pointer travel shifts the hub between dots');
   assert(handover.samples.every(sample=>sample.count>0&&sample.strength>.85),'Connections remain visible throughout hub handovers');
   await page.screenshot({path:`${out}/${name}-connections-${viewport.width}.png`});
   assert.equal(Number(await field.getAttribute('data-particles')),mobile?2000:3600);
   await page.getByRole('banner').hover({position:{x:100,y:30}});
   await expect.poll(async()=>Math.abs(Number(await field.getAttribute('data-camera-x')))).toBeLessThan(.001);
   await expect(field).toHaveAttribute('data-connections','0');
   await expect.poll(async()=>Number(await field.getAttribute('data-max-dot-scale'))).toBeLessThan(1.01);
   await page.screenshot({path:`${out}/${name}-${viewport.width}.png`});
   const geometry=await hero.evaluate(el=>{const css=getComputedStyle(el);return{range:el.offsetHeight-el.querySelector('[data-starfield]').parentElement.offsetHeight,start:Number(css.getPropertyValue('--hero-reveal-start'))/Number(css.getPropertyValue('--hero-scroll-length')),end:Number(css.getPropertyValue('--hero-reveal-end'))/Number(css.getPropertyValue('--hero-scroll-length'))};});
   const scroll=async t=>{await page.evaluate(y=>scrollTo(0,y),geometry.range*t);await expect.poll(async()=>Math.abs(Number(await hero.getAttribute('data-progress'))-t),{timeout:15000}).toBeLessThan(.002);};
   const reveal=page.locator('[data-hero-reveal]');
   await scroll((geometry.start+geometry.end)/2);
   await expect(reveal).toHaveCSS('clip-path','none');
   const approach=await reveal.evaluate(el=>({scale:new DOMMatrixReadOnly(getComputedStyle(el).transform).a,background:getComputedStyle(el).backgroundColor,contentBackground:getComputedStyle(el.firstElementChild).backgroundColor}));
   assert(approach.scale>.60&&approach.scale<.65,'Section approaches from depth');
   assert.equal(approach.background,'rgba(0, 0, 0, 0)','No opaque wrapper clips the particle field');
   assert.equal(approach.contentBackground,'rgba(0, 0, 0, 0)');
   await expect(reveal).toHaveCSS('opacity','1');
   assert.equal(await reveal.evaluate(el=>getComputedStyle(el.firstElementChild).opacity),'1');
   await page.screenshot({path:`${out}/${name}-transition-${viewport.width}.png`});
   await scroll(geometry.end+.04);
   await expect(reveal).toHaveAttribute('aria-hidden','false');
   await expect(reveal).toHaveCSS('clip-path','none');
   await expect(reveal).toHaveCSS('transform','none');
   await expect(field).toHaveAttribute('data-connections','0');
   assert(await canvas.evaluate(el=>{const pixels=el.getContext('2d').getImageData(0,0,el.width,el.height).data;return !pixels.some((value,index)=>index%4===3&&value>0);}), 'Particles disappear smoothly before pin release');
   assert.equal(await reveal.evaluate(el=>getComputedStyle(el.firstElementChild).opacity),'1');
   const held=await reveal.boundingBox();await scroll(.98);assert(Math.abs((await reveal.boundingBox()).y-held.y)<1);
   await scroll(1);const atEnd=await reveal.boundingBox();await page.evaluate(()=>scrollBy(0,120));await page.waitForTimeout(1400);assert(Math.abs(atEnd.y-(await reveal.boundingBox()).y-120)<2);
   await scroll(0);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(600);
   const still=await pixels();await page.mouse.move(100,200);await page.waitForTimeout(300);assert.equal(await pixels(),still,'Reduced motion remains static');
   assert.deepEqual(errors,[]);
   results.push({name,...viewport,centered:true,animated:true,interaction:true,reveal:true,reducedMotion:true,errors});
   console.log(`${name} ${viewport.width}: centered star field, reveal and reduced motion passed`);
   await page.close();
  }
  const saved=await browser.newPage();await saved.goto('http://127.0.0.1:3001/hero-variants/nebula');
  await expect(saved.locator('[data-prototype-field]')).toHaveAttribute('data-ready','true',{timeout:30000});
  await expect(saved.locator('[data-starfield]')).toHaveCount(0);
  await expect(saved.locator('#hero-heading')).toHaveText('Powerful AI. Built for real use.');
  await saved.close();
 }finally{await browser.close();}
}
await fs.writeFile(`${out}/checks.json`,JSON.stringify(results,null,2));
