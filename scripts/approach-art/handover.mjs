// Recipe for an /approach stage illustration: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), then run scripts/approach-art.mjs.
import { BLOCK, SLAB, cell, slab, stacks, topFace } from './grid.mjs';
export const title = 'Hand over: a complete system your team runs';
export const reference = 'layers';
// The finished structure from the build stage, every slot filled. The module lowered in during
// Build is now seated and carries the Iris, tying the two stages together.
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  slab(box, s);
  stacks(box, s, [[2, 2, 1], [2, 0, 1], [1, 1, 0]]);
  const seated = box(s, cell(1, 1, SLAB + BLOCK / 2), [BLOCK, BLOCK, BLOCK]);
  const f = topFace(seated);
  s.highlights.push({ points: f.points, normal: f.normal, kind: 'diamond', gradient: [] });
  return s;
}
export function verify(s, api, assert) { assert.equal(s.primitiveCounts.box, 12); assert.equal(s.highlights.length, 1); }
