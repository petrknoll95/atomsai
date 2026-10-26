import { chromium, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const root = 'docs/patterns/homepage';
const base = process.env.VISUAL_URL || 'http://127.0.0.1:3000';
const source = JSON.parse(await fs.readFile('docs/patterns/homepage-source.json', 'utf8'));
const report = { date: new Date().toISOString(), base, method: 'Original crop dimensions, DPR 1, no alignment adjustment, scaling or filtering. Both inputs decoded to sRGB. Original exports retain ancestor corner backgrounds. Overlay 50%; difference 8×.', results: [], errors: [] };
for (const dir of ['reference', 'rendered', 'comparison']) await fs.mkdir(`${root}/${dir}`, { recursive: true });
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  const browser = await launcher.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push({ engine, message: error.message }));
  for (const application of source.applications) {
    const key = application.application;
    const referenceFile = await fs.readFile(`public/assets/figma/${key}.png`);
    await fs.writeFile(`${root}/reference/${key}.png`, referenceFile);
    const reference = await sharp(referenceFile).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
    await page.goto(`${base}/patterns/render?application=${key}`, { waitUntil: 'networkidle' });
    await page.locator('canvas[data-render-state="ready"]').waitFor();
    const state = await page.locator('canvas').evaluate(canvas => ({ ...canvas.dataset, width: canvas.width, height: canvas.height }));
    const rect = await page.locator('main').boundingBox();
    if (rect.x !== 0 || rect.y !== 0 || rect.width !== reference.info.width || rect.height !== reference.info.height) throw new Error(`${key}: incorrect source crop ${JSON.stringify(rect)}`);
    const output = `${root}/rendered/${key}-${engine}.png`;
    await page.locator('main').screenshot({ path: output });
    const actual = await sharp(output).toColourspace('srgb').removeAlpha().raw().toBuffer();
    const overlay = Buffer.alloc(actual.length), difference = Buffer.alloc(actual.length);
    const histogram = new Uint32Array(256);
    let sum = 0, max = 0, over8 = 0, over32 = 0;
    for (let i = 0; i < actual.length; i += 3) {
      let pixelMax = 0;
      for (let channel = 0; channel < 3; channel++) {
        const j = i + channel, delta = Math.abs(actual[j] - reference.data[j]);
        sum += delta; max = Math.max(max, delta); pixelMax = Math.max(pixelMax, delta);
        overlay[j] = Math.round((actual[j] + reference.data[j]) / 2); difference[j] = Math.min(255, delta * 8);
      }
      histogram[pixelMax]++; if (pixelMax > 8) over8++; if (pixelMax > 32) over32++;
    }
    const pixels = reference.info.width * reference.info.height;
    let accumulated = 0, p99 = 0;
    for (; p99 < 255; p99++) { accumulated += histogram[p99]; if (accumulated >= pixels * .99) break; }
    for (const [name, data] of [['overlay', overlay], ['difference', difference]]) await sharp(data, { raw: { width: reference.info.width, height: reference.info.height, channels: 3 } }).png().toFile(`${root}/comparison/${key}-${engine}-${name}.png`);
    const result = { key, engine, sourceId: application.sourceId, sourceSha256: crypto.createHash('sha256').update(referenceFile).digest('hex'), width: rect.width, height: rect.height, meanAbsoluteChannelError: sum / actual.length, maximumChannelError: max, p99MaximumPixelError: p99, pixelsOver8Percent: 100 * over8 / pixels, pixelsOver32Percent: 100 * over32 / pixels, state };
    report.results.push(result);
    console.log(`${engine}/${key}: mean ${result.meanAbsoluteChannelError.toFixed(4)}, p99 ${p99}, >32 ${result.pixelsOver32Percent.toFixed(3)}%`);
  }
  await browser.close();
}
await fs.writeFile(`${root}/results.json`, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(`${root}/index.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Homepage procedural patterns</title>
<style>*{box-sizing:border-box}body{margin:0;background:#fafafa;color:#27433b;font:14px/1.5 system-ui}header{padding:24px;border-bottom:1px solid #b6c4be}h1{font-size:24px;margin:0}p{margin:8px 0}nav{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}select,button{font:inherit;padding:8px 12px;border:1px solid #b6c4be;border-radius:8px;background:white;color:inherit}button[aria-pressed=true]{background:#27433b;color:white}a{color:inherit}:focus-visible{outline:2px solid #8c78b0;outline-offset:3px}main{padding:24px;overflow:auto}img{display:block;margin:auto;max-width:100%;height:auto}main.actual img{max-width:none}</style>
<header><h1>Homepage: original artwork and live shaders</h1><p>Seven original crops, both browsers. Overlay 50%; difference amplified 8×. No alignment correction or rescaling.</p><nav aria-label="Comparison controls"><select id="application" aria-label="Homepage application">${source.applications.map(item => `<option>${item.application}</option>`).join('')}</select><select id="engine" aria-label="Browser"><option>chromium</option><option>webkit</option></select><button data-mode="reference">Figma</button><button data-mode="rendered">Shader</button><button data-mode="overlay">Overlay</button><button data-mode="difference">Difference ×8</button><label><input id="actual" type="checkbox">Actual pixels</label></nav><p id="metrics"></p><a href="README.md">Implementation and verification</a></header><main><img id="image" alt=""></main>
<script>const results=${JSON.stringify(report.results.map(({key,engine,width,height,meanAbsoluteChannelError,p99MaximumPixelError})=>({key,engine,width,height,meanAbsoluteChannelError,p99MaximumPixelError})))};const app=document.querySelector('#application'),engine=document.querySelector('#engine'),img=document.querySelector('#image');let mode='overlay';function update(){const key=app.value,b=engine.value,row=results.find(r=>r.key===key&&r.engine===b);img.src=mode==='reference'?'reference/'+key+'.png':mode==='rendered'?'rendered/'+key+'-'+b+'.png':'comparison/'+key+'-'+b+'-'+mode+'.png';img.alt=key+' '+b+' '+mode;document.querySelector('#metrics').textContent=row.width+' × '+row.height+' · Mean absolute channel error '+row.meanAbsoluteChannelError.toFixed(4)+' / 255 · 99th percentile pixel error '+row.p99MaximumPixelError;document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));}app.onchange=engine.onchange=update;document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;update()});document.querySelector('#actual').onchange=e=>document.querySelector('main').classList.toggle('actual',e.target.checked);update();</script></html>`);
if (report.errors.length || report.results.some(result => result.meanAbsoluteChannelError > 1.5 || result.pixelsOver32Percent > .1)) process.exitCode = 1;
