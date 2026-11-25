// Strips the iris fills from the trust illustrations, keeping only the line group, and crops
// the viewBox to the ink (stroke included) so the cards can align it to their padding.
// Build the carousel poses in one 300 × 200 frame, aligned to the top right.
// Usage: node scripts/trust-line-art.mjs
import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
const poses = {};
for (const name of ['integrations', 'safeguards', 'reliability', 'security']) {
  const svg = await fs.readFile(`public/assets/illustrations/trust-${name}.svg`, 'utf8');
  const start = svg.indexOf('<g fill="none" stroke=');
  if (start < 0) throw new Error(`no line group in ${name}`);
  const lines = svg.slice(start, svg.lastIndexOf('</svg>')).replace(/stroke="#10231E"/, 'stroke="#000"');
  await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384">${lines}</svg>`);
  // getBBox ignores stroke width, so pad by half the widest stroke.
  const box = await page.evaluate(() => {
    const g = document.querySelector('svg > g');
    const b = g.getBBox();
    const half = Math.max(...[...g.querySelectorAll('[stroke-width]')].map(p => +p.getAttribute('stroke-width'))) / 2;
    return [b.x - half, b.y - half, b.width + 2 * half, b.height + 2 * half].map(v => +v.toFixed(3));
  });
  await fs.writeFile(`public/assets/illustrations/trust-${name}-line.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}">${lines}</svg>`);
  const scale = 200 / box[3];
  const paths = await page.locator('path').evaluateAll(paths => paths.map(path => path.getAttribute('d')));
  const d = paths.map(path => path.replace(/([ML])([-.\d]+) ([-.\d]+)/g, (_, command, x, y) => {
    const px = 300 + (Number(x) - box[0] - box[2]) * scale;
    const py = (Number(y) - box[1]) * scale;
    return command + Number(px.toFixed(3)) + ' ' + Number(py.toFixed(3));
  })).join('');
  const stroke = Number(await page.locator('path').first().getAttribute('stroke-width'));
  poses[name] = { d, strokeWidth: Number((stroke * scale).toFixed(4)) };
  console.log(`trust-${name}-line.svg ${box.join(' ')} ratio ${(box[2] / box[3]).toFixed(4)}`);
}
await browser.close();
await fs.writeFile('src/components/home/trust-poses.json', JSON.stringify(poses, null, 2) + '\n');
