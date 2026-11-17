// Recipe for an /approach stage illustration: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), then run scripts/approach-art.mjs.
import { BLOCK, SLAB, cell, slab, stacks, topFace } from './grid.mjs';
export const title = 'Build: modules placed into your environment';
export const reference = 'layers';
// Equal modules stacked on the shared slab; the last one is lowered into its open slot.
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  slab(box, s);
  stacks(box, s, [[2, 1, 1], [1, 0, 0], [1, 0, 0]]);
  const placing = box(s, cell(1, 1, SLAB + BLOCK / 2 + 34), [BLOCK, BLOCK, BLOCK]);
  const f = topFace(placing);
  s.highlights.push({ points: f.points, normal: f.normal, kind: 'diamond', gradient: [] });
  return s;
}
export function verify(s, api, assert) { assert.equal(s.primitiveCounts.box, 8); assert.equal(s.highlights.length, 1); }
