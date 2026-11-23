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
async function capture(index, matte) {
  await page.goto(`${base}/diagram-study?plane=${index}&matte=${matte}`);
  const png = await page.locator('[data-diagram-canvas][data-ready="true"] canvas')
    .evaluate(canvas => canvas.toDataURL('image/png').split(',')[1]);
  return sharp(Buffer.from(png, 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

try {
  for (const { index, name } of planes) {
    const { data: dark, info: { width, height } } = await capture(index, 'black');
    const { data: light } = await capture(index, 'white');
    const ink = Buffer.alloc(dark.length);
    // In premultiplied RGB, the difference between mattes is the plate fill's
    // coverage. Subtract it from the rendered coverage to keep only the ink.
    for (let offset = 0; offset < ink.length; offset += 4) {
      const darkAlpha = dark[offset + 3];
      const lightAlpha = light[offset + 3];
      const darkSum = dark[offset] + dark[offset + 1] + dark[offset + 2];
      const lightSum = light[offset] + light[offset + 1] + light[offset + 2];
      const fillAlpha = (lightSum * lightAlpha - darkSum * darkAlpha) / (3 * 255);
      const inkAlpha = Math.min(darkAlpha, Math.max(0, Math.round(darkAlpha - fillAlpha)));
      if (!inkAlpha) continue;
      ink[offset + 3] = inkAlpha;
      for (let channel = 0; channel < 3; channel++) {
        ink[offset + channel] = Math.min(255, Math.round(dark[offset + channel] * darkAlpha / inkAlpha));
      }
    }
    const file = path.join(output, `${name}.webp`);
    await sharp(ink, { raw: { width, height, channels: 4 } })
      .resize({ width: 1040, height: 800, fit: 'inside' }).webp({ lossless: true }).toFile(file);
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
  }
} finally {
  await browser.close();
}
