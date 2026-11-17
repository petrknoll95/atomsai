// Renders the contact directory art through the AtomsAI illustration kit, one real projection per
// frame, with strokes joined at shared vertices (scripts/lib/join-strokes.mjs). Writes:
// - public/assets/illustrations/contact-<name>-line.svg: the still, frame 0, used as the CSS mask;
// - public/assets/illustrations/contact-motion/<name>.json: { viewBox, duration, fps, frames }.
// Line only: highlights are never drawn. The viewBox is the still's existing ink box.
//
// Every frame reuses the still's reference fit and camera extent, so the motion is not
// re-centred or rescaled. The still is written from frame 0, so the swap is seamless.
// Usage: node scripts/contact-motion.mjs [--sheet /absolute/dir]   (sheet = review PNGs)
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import * as geometry from '../skills/atomsai-illustrations/runtime/geometry.mjs';
import * as primitives from '../skills/atomsai-illustrations/runtime/primitives.mjs';
import { fitToReference } from '../skills/atomsai-illustrations/runtime/models.mjs';
import { projectScene, sceneExtent, viewTransform } from '../skills/atomsai-illustrations/runtime/render.mjs';
import { joinFrame } from './lib/join-strokes.mjs';

const FPS = 30, NAMES = ['security', 'partnerships', 'press', 'careers'];
const api = { ...geometry, ...primitives };
const { mul, sub, transformScene } = geometry;
const sheetDir = process.argv[2] === '--sheet' ? process.argv[3] : undefined;
const view = { yaw: 0, pitch: 0, white: true };
const n1 = v => Math.round(v * 10) / 10;
const toD = (lines, round) => lines.map(l => l.points.map((p, i) => `${i ? 'L' : 'M'}${round(p[0] + 192)} ${round(p[1] + 192)}`).join('') + (l.closed ? 'Z' : '')).join('');
// Douglas–Peucker at 0.15 units (≈0.1 px at card size): drops the near-collinear samples
// of projected circles, which dominate the frame data.
const simplify = (pts, tol = .15) => {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  let worst = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = len > 1e-9 && Math.hypot(dx, dy) > 0 ? Math.abs(dy * (pts[i][0] - a[0]) - dx * (pts[i][1] - a[1])) / len : Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]);
    if (d > worst) { worst = d; at = i; }
  }
  return worst <= tol ? [a, b] : [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
};
const lean = lines => lines.map(l => ({ ...l, points: simplify(l.points) }));
const linesOf = frame => [...frame.rear, ...frame.front, ...frame.accent];

await fs.mkdir('public/assets/illustrations/contact-motion', { recursive: true });
for (const name of NAMES) {
  const recipe = await import(pathToFileURL(resolve(`scripts/contact-art/${name}.mjs`)));
  const still = recipe.default(api, 0);
  fitToReference(still, recipe.reference);
  const { origin, scale } = still.fitted;
  const extent = sceneExtent(still, viewTransform(view));
  const render = t => {
    const s = recipe.default(api, t);
    transformScene(s, p => mul(sub(p, origin), scale), p => p, scale);
    for (const group of [s.lines, s.contours, s.cylinders]) group.forEach(item => item.width = 1.28);
    s.frameAspect = still.frameAspect;
    const frame = joinFrame(projectScene(s, view, { extent }));
    assert.equal(frame.rear.length, 0, `${name}: opaque art exposes hidden lines at t=${t}`);
    return frame;
  };

  // The still: frame 0, unsimplified, in the existing ink box, one path per joined stroke.
  const linePath = `public/assets/illustrations/contact-${name}-line.svg`;
  const viewBox = (await fs.readFile(linePath, 'utf8')).match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const n3 = v => Number(v.toFixed(3));
  const stillPaths = linesOf(render(0)).map(l => `<path d="${toD([l], n3)}" stroke-width="1.28"/>`).join('');
  await fs.writeFile(linePath, `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBox[2]}" height="${viewBox[3]}" viewBox="${viewBox.join(' ')}"><g fill="none" stroke="#000" stroke-linejoin="miter" stroke-linecap="butt">${stillPaths}</g></svg>`);

  const count = Math.round(recipe.motion.duration * FPS);
  const frames = Array.from({ length: count }, (_, i) => toD(lean(linesOf(render(i / count))), n1));
  const json = JSON.stringify({ viewBox, duration: recipe.motion.duration, fps: FPS, frames });
  await fs.writeFile(`public/assets/illustrations/contact-motion/${name}.json`, json);
  console.log(`${name}: ${count} frames, ${(json.length / 1024).toFixed(0)} KB`);

  if (sheetDir) {
    // Eight evenly spaced frames on the still's crop, padded so motion past the crop shows.
    const { default: sharp } = await import('sharp');
    const pad = 60, [x, y, w, h] = [viewBox[0] - pad, viewBox[1] - pad, viewBox[2] + 2 * pad, viewBox[3] + 2 * pad];
    const cells = Array.from({ length: 8 }, (_, k) => frames[Math.floor(k * count / 8)]);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 8 * 2}" height="${h * 2}" viewBox="0 0 ${w * 8} ${h}"><rect width="100%" height="100%" fill="#FAFAFA"/>${cells.map((d, k) => `<g transform="translate(${k * w - x} ${-y})"><rect x="${viewBox[0]}" y="${viewBox[1]}" width="${viewBox[2]}" height="${viewBox[3]}" fill="none" stroke="#e3a" stroke-width=".5" stroke-dasharray="2 2"/><path d="${d}" fill="none" stroke="#10231E" stroke-width="1.28" stroke-linejoin="miter"/></g>`).join('')}</svg>`;
    await fs.mkdir(sheetDir, { recursive: true });
    await sharp(Buffer.from(svg)).png().toFile(`${sheetDir}/${name}-loop.png`);
  }
}
