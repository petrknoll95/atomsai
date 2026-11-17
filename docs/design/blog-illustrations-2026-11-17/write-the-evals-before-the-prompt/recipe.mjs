export const title = 'The gauge comes first';
export const reference = 'modular';
// A gauge sheet with its cut-out made first; the block above matches the opening exactly and is
// guided down onto it by dashed lines from corner to corner.
const sheet = 170, hole = 60, lift = 56;
export default function ({ scene, plane, box, stroke, X, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  plane(s, [0, 0, 0], X, Z, sheet, sheet, true, undefined, [hole, hole]);
  box(s, [0, lift + hole / 2, 0], [hole, hole, hole]);
  const h = hole / 2;
  for (const [x, z] of [[-h, -h], [h, -h], [h, h], [-h, h]]) stroke(s, [[x, lift, z], [x, 0, z]], { dash: [4, 4] });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 1);
  assert.equal(s.highlights.length, 1);
  assert(s.highlights[0].hole?.length === 4);
}
