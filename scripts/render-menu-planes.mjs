// Renders single planes of the operating model diagram as transparent stills for the
// Infrastructure menu cards. Needs the dev server: npm run dev -- --port 3001
// Usage: VISUAL_URL=http://127.0.0.1:3001 node scripts/render-menu-planes.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const base = process.env.VISUAL_URL || 'http://127.0.0.1:3001';
const output = path.resolve('public/assets/menu');
// Plane indexes follow operating-model-three.ts: 0 dots, 1 workflow, 2 interface, 3 logo.
const planes = [
  { index: 0, name: 'plane-models' },
  { index: 2, name: 'plane-applications' },
  { index: 1, name: 'plane-workflows' },
];

await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
// The study page renders at 520 × 400 CSS px; device scale 2 gives 1040 × 800 images.
const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
for (const { index, name } of planes) {
  await page.goto(`${base}/diagram-study?plane=${index}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-diagram-canvas][data-ready="true"] canvas');
  await page.waitForTimeout(500);
  const png = await page.evaluate(() => document.querySelector('[data-diagram-canvas] canvas').toDataURL('image/png'));
  const file = path.join(output, `${name}.webp`);
  await sharp(Buffer.from(png.split(',')[1], 'base64')).resize({ width: 1040, height: 800, fit: 'inside' }).webp({ quality: 90, alphaQuality: 100 }).toFile(file);
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
await browser.close();
