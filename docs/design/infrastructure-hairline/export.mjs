import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../../../', import.meta.url);
const browser = await chromium.launch();
const outlineBounds = JSON.parse(await readFile(new URL('src/components/home/illustration-bounds.json', root), 'utf8'));
const names = process.argv.slice(2);
try {
  for (const name of names.length ? names : ['server-modules','test-bench','precision-assembly','modular-cube','nested-cube','layered-planes']) {
    const source = await readFile(new URL(`${name}.js`, import.meta.url), 'utf8');
    await writeFile(new URL(`public/assets/hairline/${name}.mjs`, root), `const HL = window.HL;\nlet figure;\nconst hairline = definition => { figure = definition; };\n${source}\nexport default figure;\n`);
    const page = await browser.newPage();
    await page.goto(new URL(`hairline-${name}.html`, import.meta.url).href);
    await page.waitForSelector('#stage svg path');
    const svg = await page.locator('#stage svg').evaluate(el => {
      const copy = el.cloneNode(true);
      copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      copy.setAttribute('width', '400'); copy.setAttribute('height', '320');
      copy.querySelectorAll('path,polygon,ellipse,line,circle').forEach(shape => {
        const cls = shape.classList;
        if (cls.contains('dash')) shape.setAttribute('stroke-dasharray', getComputedStyle(el.querySelector('.dash')).strokeDasharray);
        const dot = cls.contains('dot');
        shape.setAttribute('fill', cls.contains('nf') ? 'none' : dot ? '#27433b' : '#f0f0f0');
        shape.setAttribute('stroke', dot || cls.contains('fo') ? 'none' : '#27433b');
        shape.setAttribute(dot ? 'fill-opacity' : 'stroke-opacity', '1');
        shape.setAttribute('stroke-width', '1');
        shape.setAttribute('stroke-linecap', 'round'); shape.setAttribute('stroke-linejoin', 'round');
      });
      return new XMLSerializer().serializeToString(copy);
    });
    await writeFile(new URL(`public/assets/illustrations/${name}.svg`, root), svg);
    // A luminance mask preserves hidden-line occlusion while leaving every
    // face transparent, so these same drawings can sit over moving patterns.
    const outline = await page.locator('#stage svg').evaluate((el, name) => {
      const ns = 'http://www.w3.org/2000/svg';
      const output = document.createElementNS(ns, 'svg');
      output.setAttribute('xmlns', ns);
      const bounds = el.getBBox();
      const width = bounds.width + 1, height = bounds.height + 1;
      output.setAttribute('viewBox', `${bounds.x - .5} ${bounds.y - .5} ${width} ${height}`);
      output.setAttribute('width', String(width)); output.setAttribute('height', String(height));
      const mask = document.createElementNS(ns, 'mask');
      mask.id = `${name}-lines`;
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      mask.setAttribute('x', '0'); mask.setAttribute('y', '0');
      mask.setAttribute('width', '400'); mask.setAttribute('height', '320');
      mask.setAttribute('style', 'mask-type:luminance');
      for (const child of el.children) mask.appendChild(child.cloneNode(true));
      mask.querySelectorAll('path,polygon,ellipse,line,circle').forEach(shape => {
        const cls = shape.classList, dot = cls.contains('dot');
        if (cls.contains('dash')) shape.setAttribute('stroke-dasharray', getComputedStyle(el.querySelector('.dash')).strokeDasharray);
        shape.setAttribute('fill', cls.contains('nf') ? 'none' : dot ? '#fff' : '#000');
        shape.setAttribute('stroke', dot || cls.contains('fo') ? 'none' : '#fff');
        shape.setAttribute('stroke-width', '1');
        shape.setAttribute('stroke-linecap', 'round'); shape.setAttribute('stroke-linejoin', 'round');
      });
      const defs = document.createElementNS(ns, 'defs'); defs.appendChild(mask); output.appendChild(defs);
      const ink = document.createElementNS(ns, 'rect');
      ink.setAttribute('width', '400'); ink.setAttribute('height', '320');
      ink.setAttribute('fill', '#f6f1e8'); ink.setAttribute('mask', `url(#${mask.id})`);
      output.appendChild(ink);
      return { svg: new XMLSerializer().serializeToString(output), width, height };
    }, name);
    await writeFile(new URL(`public/assets/illustrations/${name}-outline.svg`, root), outline.svg);
    outlineBounds[name] = { width: outline.width, height: outline.height };
    await page.close();
    console.log(`Exported ${name}`);
  }
  await writeFile(new URL('src/components/home/illustration-bounds.json', root), JSON.stringify(outlineBounds, null, 2) + '\n');
} finally { await browser.close(); }
