// Recipe for an /approach stage illustration: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), then run scripts/approach-art.mjs.
import { cell, topFace } from './grid.mjs';
export const title = 'Understand: the workflow worth improving';
export const reference = 'layers';
// Nine equal tiles, one per candidate workflow; the one worth improving lifts out of the grid.
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const chosen = i === 1 && j === 1;
    const tile = box(s, cell(i, j, 3 + (chosen ? 34 : 0)), [42, 6, 42]);
    if (chosen) { const f = topFace(tile); s.highlights.push({ points: f.points, normal: f.normal, kind: 'diamond', gradient: [] }); }
  }
  return s;
}
export function verify(s, api, assert) { assert.equal(s.primitiveCounts.box, 9); assert.equal(s.highlights.length, 1); }
