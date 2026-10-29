import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fontkit from 'next/dist/compiled/@next/font/dist/fontkit/index.js';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'public/assets/blog/editorial');
await mkdir(out, { recursive: true });
const display = fontkit.default(await readFile(path.join(root, 'public/fonts/FoundersGrotesk-Regular.woff2')));
const sans = fontkit.default(await readFile(path.join(root, 'public/fonts/PPNeueMontreal-Variable.ttf'))).getVariation({ wght: 425, ital: 100 });
// sRGB equivalents of the site's Display-P3 palette, for portable image files.
function palette(r, g, b) {
  const linear = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  const encode = c => Math.round(255 * (c <= .0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - .055));
  const [R,G,B] = [r,g,b].map(linear);
  return `#${[1.224745*R-.224904*G, -.042058*R+1.042081*G, -.019642*R-.078655*G+1.098537*B].map(c => encode(Math.max(0,Math.min(1,c))).toString(16).padStart(2,'0')).join('')}`;
}
const dark = palette(.062745102,.137254909,.117647059);
const green = palette(.152941182,.262745112,.231372550);
const cream = palette(.964705884,.945098042,.909803927);
const surface = palette(.941176474,.941176474,.925490201);
function text(value, y, size, color, font = display) {
  const run = font.layout(value);
  const scale = size / font.unitsPerEm;
  const total = run.positions.reduce((n,p) => n+p.xAdvance,0);
  let cursor = 600 - total*scale/2;
  return run.glyphs.map((glyph,i) => {
    const pos=run.positions[i];
    const result=`<path d="${glyph.path.toSVG()}" transform="translate(${cursor+pos.xOffset*scale} ${y-pos.yOffset*scale}) scale(${scale} ${-scale})" fill="${color}"/>`;
    cursor+=pos.xAdvance*scale;return result;
  }).join('');
}
function mark(color) {
  const slits=[];let right=51;
  for(let n=0;n<=2;n++){
    const w=20*.75**n*(32/45)**((n*(n-1))/2);const r=50*(.36+.64*.75**n);
    if(n>0)right=slits[n-1].x-Math.max(-.8*Math.min(w,slits[n-1].w),-2+4*(n-1));
    slits.push({x:right-w,w,cx:right-r,r});
  }
  return `<g transform="translate(579 60) scale(.42)" fill="${color}">`+slits.flatMap((s,n)=>[1,-1].map((side,i)=>{
    const x=side===1?s.x:100-s.x-s.w,cx=side===1?s.cx:100-s.cx,id=`slit-${n}-${i}`;
    return `<clipPath id="${id}"><rect x="${x}" y="0" width="${s.w}" height="100"/></clipPath><circle cx="${cx}" cy="50" r="${s.r}" clip-path="url(#${id})"/>`;
  })).join('')+'</g>';
}
const covers = [
  {slug:'quotes-go-quiet',lines:['The follow-up is','part of the work.'],label:'CUSTOMER CONVERSATIONS',motif:'conversation'},
  {slug:'no-shows',lines:['A place kept.','A visit confirmed.'],label:'APPOINTMENTS',motif:'chair'},
  {slug:'speed-to-lead',lines:['Be there first.'],label:'SPEED TO LEAD',motif:'reply',light:true},
  {slug:'who-answers-at-7pm',lines:['19:00'],label:'THE DAY ENDS. THE CONVERSATION DOESN’T.',motif:'night',size:160},
  {slug:'the-demo-was-never-the-hard-part',lines:['Beyond the demo.'],label:'FROM PILOT TO PRODUCTION',motif:'bridge'},
  {slug:'write-the-evals-before-the-prompt',lines:['Measure first.','Prompt second.'],label:'EVALUATION',motif:'eval',light:true},
  {slug:'how-much-autonomy-should-an-agent-have',lines:['Autonomy,','with boundaries.'],label:'AGENT GOVERNANCE',motif:'gate'},
];
function motif(kind,c) {
  const drawings={
    conversation:'<path d="M530 472h54v35h-15l-12 12v-12h-27zM616 472h54v35h-15l-12 12v-12h-27z"/><path d="M588 490h24" opacity=".35"/>',
    chair:'<path d="M575 462h50v38h-50zM570 500h60v12h-60zM575 512v22M625 512v22"/>',
    reply:'<path d="M480 492h240M480 480h80M480 504h135" opacity=".4"/><path d="M702 478l18 14-18 14"/>',
    night:'<path d="M612 468a28 28 0 1 0 22 45 29 29 0 0 1-22-45z"/>',
    bridge:'<path d="M490 518v-44h75v44M635 518v-44h75v44M565 496h70"/><circle cx="600" cy="496" r="5" fill="currentColor" stroke="none"/>',
    eval:'<path d="M534 475l7 7 14-17M534 503l7 7 14-17M574 475h92M574 503h92"/>',
    gate:'<path d="M546 526v-64h108v64M600 488v38M530 526h140"/><circle cx="600" cy="478" r="7"/>',
  };
  return `<g stroke="${c}" color="${c}" stroke-width="1.5" fill="none" opacity=".65">${drawings[kind]}</g>`;
}
for(const cover of covers){
 const bg=cover.light?surface:dark,fg=cover.light?green:cream;
 const lines=cover.lines.map((line,i)=>text(line,cover.lines.length===1?365:310+i*88,cover.size??84,fg)).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="${bg}"/>${mark(fg)}${lines}${motif(cover.motif,fg)}<g opacity=".56">${text(cover.label,590,16,fg,sans)}</g></svg>`;
 await writeFile(path.join(out,`${cover.slug}.svg`),svg);
 await sharp(Buffer.from(svg)).resize(1920,1080).webp({quality:94}).toFile(path.join(out,`${cover.slug}-borderless.webp`));
 console.log(cover.slug);
}
await writeFile(path.join(root, 'src/content/blog/editorial-artwork.json'), JSON.stringify(Object.fromEntries(covers.map(({ slug }) => [slug, `/assets/blog/editorial/${slug}-borderless.webp`])), null, 2) + '\n');
