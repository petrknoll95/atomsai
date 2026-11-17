export const title = 'One empty place in a full row';
export const reference = 'modular';
// Five equal places on one rail. Four are taken; the middle one is empty, marked by a dashed
// footprint that carries the highlight.
const size = 40, pitch = 52, rail = [5 * pitch + 12, 10, 64];
export default function ({ scene, box, plane, X, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  box(s, [0, rail[1] / 2, 0], rail);
  for (let k = -2; k <= 2; k++) {
    if (k === 0) plane(s, [0, rail[1] + .5, 0], X, Z, size, size, true, [4, 4]);
    else box(s, [k * pitch, rail[1] + size / 2, 0], [size, size, size]);
  }
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 5);
  assert.equal(s.highlights.length, 1);
}
