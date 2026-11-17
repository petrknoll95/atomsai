// Recipe for an /approach stage illustration: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), then run scripts/approach-art.mjs.
import { SPAN, SLAB, cell, slab, topFace } from './grid.mjs';
export const title = 'Validate: results against agreed targets';
export const reference = 'layers';
// Three result columns on the slab's cross-diagonal, measured against an agreed target drawn as
// a dashed outline (no surface). The column that meets the target carries the Iris on its top.
export default function ({ scene, box, stroke }) {
  const s = scene();
  s.hiddenLines = 'omit';
  slab(box, s);
  const target = SLAB + 92;
  for (const [i, j, h] of [[0, 2, 60], [1, 1, 92], [2, 0, 74]]) {
    const column = box(s, cell(i, j, SLAB + h / 2), [30, h, 30]);
    if (SLAB + h === target) { const f = topFace(column); s.highlights.push({ points: f.points, normal: f.normal, kind: 'diamond', gradient: [] }); }
  }
  const r = SPAN / 2, pts = [[-r, target, -r], [r, target, -r], [r, target, r], [-r, target, r]];
  stroke(s, pts, { closed: true, dash: [6, 6] });
  return s;
}
export function verify(s, api, assert) { assert.equal(s.primitiveCounts.box, 4); assert.equal(s.highlights.length, 1); }
