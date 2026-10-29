import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const out='docs/redesign/qa/performance';
const tag=process.env.PERFORMANCE_TAG||'measurements';
const routes=['/approach','/capabilities/voice','/industries/healthcare','/trust','/company/contact'];
const browser=await chromium.launch();const results=[];
for(const mode of ['desktop','mobile'])for(const route of routes){
 const context=await browser.newContext({viewport:mode==='desktop'?{width:1440,height:960}:{width:390,height:844},deviceScaleFactor:mode==='desktop'?1:2,isMobile:mode==='mobile',hasTouch:mode==='mobile'});
 const page=await context.newPage();page.setDefaultTimeout(15000);const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Performance.enable');
 if(mode==='mobile'){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8,connectionType:'cellular4g'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 await page.addInitScript(()=>{window.__perf={lcp:[],shifts:[],tasks:[],events:[]};for(const [type,key]of [['largest-contentful-paint','lcp'],['layout-shift','shifts'],['longtask','tasks'],['event','events']]){try{new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__perf[key].push({startTime:e.startTime,duration:e.duration,value:e.value,hadRecentInput:e.hadRecentInput,name:e.name,interactionId:e.interactionId,element:e.element?.tagName,elementText:e.element?.textContent?.slice(0,70)}))).observe({type,buffered:true,durationThreshold:16});}catch{}}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3002'+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
 const before=await page.evaluate(()=>({perf:window.__perf,nav:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,initiatorType:r.initiatorType,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize,duration:r.duration})),images:[...document.images].map(i=>({src:i.currentSrc,naturalWidth:i.naturalWidth,displayWidth:i.getBoundingClientRect().width,complete:i.complete})),audioRequests:performance.getEntriesByType('resource').filter(r=>/\.mp3|\.wav|\.ogg/.test(r.name)).length}));
 const idleBefore=await cdp.send('Performance.getMetrics');await page.waitForTimeout(1500);const idleAfter=await cdp.send('Performance.getMetrics');
 let interaction='none';
 if(route==='/trust'){await page.getByRole('button',{name:'Hosted pilot',exact:true}).click();interaction='deployment change';}
 else if(route==='/industries/healthcare'){await page.getByRole('tab',{name:/Answer a billing question/}).click();interaction='workflow tab';}
 else if(route==='/capabilities/voice'){await page.getByRole('tab',{name:/A callback/}).click();interaction='workflow tab';}
 else if(route==='/company/contact'){await page.getByLabel('Your name',{exact:true}).fill('Performance check');await page.getByLabel('Company',{exact:true}).fill('Example');await page.getByLabel('Business email',{exact:true}).fill('test@example.com');await page.getByLabel('What would you like to explore?',{exact:true}).fill('A local QA test.');await page.getByRole('button',{name:'Prepare email',exact:false}).click();interaction='prepare local email draft';}
 else{await page.locator('main details summary').first().click();interaction='native disclosure';}
 await page.waitForTimeout(400);const after=await page.evaluate(()=>window.__perf);
 const delta={};for(const {name,value}of idleAfter.metrics){const before=idleBefore.metrics.find(x=>x.name===name);if(before&&['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'].includes(name))delta[name]=value-before.value;}
 const result={mode,route,errors,...before,interaction,interactionEvents:after.events,postInteractionTasks:after.tasks.filter(t=>t.startTime>before.nav.loadEventEnd),idleWindowSeconds:1.5,idleCpu:delta};results.push(result);
 await fs.writeFile(out+'/'+tag+'.json',JSON.stringify({measuredAt:new Date().toISOString(),browserVersion:browser.version(),mobileProfile:{latencyMs:150,downloadMbps:1.6,cpuSlowdown:4},results},null,2));
 console.log(JSON.stringify({mode,route,lcp:before.perf.lcp.at(-1)?.startTime,cls:before.perf.shifts.filter(s=>!s.hadRecentInput).reduce((a,b)=>a+b.value,0),kb:before.resources.reduce((a,b)=>a+b.transferSize,0)/1024,audio:before.audioRequests,events:after.events.map(x=>x.duration),idle:delta}));await context.close();
}
await browser.close();
