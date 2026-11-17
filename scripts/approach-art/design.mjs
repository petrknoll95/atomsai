// Recipe for an /approach stage illustration: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), then run scripts/approach-art.mjs.
import { CELL, SPAN, topFace } from './grid.mjs';
export const title = 'Design: data, decisions and controls';
export const reference = 'layers';
// A dashed blueprint sheet with a flow on it: an input feeds a decision node, which branches
// to two outcomes. Connectors are orthogonal and run just above the sheet, cube face to face.
export default function ({ scene, plane, box, stroke, X, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  plane(s, [0, 0, 0], X, Z, SPAN, SPAN, false, [6, 6]);
  const n = 26, h = n / 2, y = .5, mid = CELL / 2;
  const node = (x, z, size = n) => box(s, [x, size / 2, z], [size, size, size]);
  node(-CELL, 0);
  const decision = node(0, 0, 32);
  node(CELL, -CELL); node(CELL, CELL);
  const f = topFace(decision);
  s.highlights.push({ points: f.points, normal: f.normal, kind: 'diamond', gradient: [] });
  stroke(s, [[-CELL + h, y, 0], [-16, y, 0]]);
  stroke(s, [[16, y, 0], [mid, y, 0]]);
  for (const side of [-1, 1]) stroke(s, [[mid, y, 0], [mid, y, side * CELL], [CELL - h, y, side * CELL]]);
  return s;
}
export function verify(s, api, assert) { assert.equal(s.primitiveCounts.box, 4); assert.equal(s.highlights.length, 1); }
