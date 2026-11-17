// Renders the five /approach stage illustrations through the AtomsAI illustration kit and writes
// public/assets/illustrations/approach-<stage>.svg (Light theme, with the Iris focal face).
// All five share one viewBox, the union of their ink, so they stay at one scale tab to tab.
// Usage: node scripts/approach-art.mjs
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import * as geometry from '../skills/atomsai-illustrations/runtime/geometry.mjs';
import * as primitives from '../skills/atomsai-illustrations/runtime/primitives.mjs';
import { fitToReference } from '../skills/atomsai-illustrations/runtime/models.mjs';
import { projectScene, frameToSvg } from '../skills/atomsai-illustrations/runtime/render.mjs';

const STAGES = ['understand', 'design', 'build', 'validate', 'handover'];
const api = { ...geometry, ...primitives };
const rendered = [];
for (const stage of STAGES) {
  const recipe = await import(pathToFileURL(resolve(`scripts/approach-art/${stage}.mjs`)));
  const s = recipe.default(api);
  recipe.verify?.(s, api, assert);
  fitToReference(s, recipe.reference);
  const frame = projectScene(s, { yaw: 0, pitch: 0, white: true });
  assert.equal(frame.rear.length, 0, `${stage}: opaque art exposes hidden lines`);
  const points = [...frame.front, ...frame.accent].flatMap(line => line.points);
  rendered.push({ stage, svg: frameToSvg(frame), points });
}
// Ink box in the 384 export viewport (+192 offset), padded by half the 1.28 stroke.
const all = rendered.flatMap(r => r.points), half = .64;
const x0 = Math.min(...all.map(p => p[0])) + 192 - half, x1 = Math.max(...all.map(p => p[0])) + 192 + half;
const y0 = Math.min(...all.map(p => p[1])) + 192 - half, y1 = Math.max(...all.map(p => p[1])) + 192 + half;
const box = [x0, y0, x1 - x0, y1 - y0].map(v => +v.toFixed(3));
for (const { stage, svg } of rendered) {
  // Unique gradient/mask ids per file, in case two are ever inlined together.
  const out = svg.replace(/id="iris-/g, `id="${stage}-iris-`).replace(/url\(#iris-/g, `url(#${stage}-iris-`)
    .replace('width="384" height="384" viewBox="0 0 384 384"', `width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}"`);
  assert(out.includes(`viewBox="${box.join(' ')}"`), `${stage}: viewBox not replaced`);
  await fs.writeFile(`public/assets/illustrations/approach-${stage}.svg`, out);
}
console.log(`approach-*.svg viewBox ${box.join(' ')} ratio ${(box[2] / box[3]).toFixed(4)}`);
