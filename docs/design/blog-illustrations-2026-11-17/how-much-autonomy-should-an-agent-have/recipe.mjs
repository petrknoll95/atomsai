export const title = 'Gates that loosen as trust is earned';
export const reference = 'modular';
// Three equal upright gates on one axis. The nearest is the tightest and carries the highlight;
// each one behind it opens wider. A sphere sits in the first opening, sized to pass it.
const gate = 112, holes = [36, 60, 84], spacing = 72, r = 13;
export default function ({ scene, plane, ellipsoid, Y, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  holes.forEach((hole, k) => plane(s, [spacing - k * spacing, 0, 0], Z, Y, gate, gate, k === 0, undefined, [hole, hole]));
  ellipsoid(s, [spacing, 0, 0], [[r, 0, 0], [0, r, 0], [0, 0, r]]);
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.faces.filter(f => f.hole).length, 3);
  assert.equal(s.highlights.length, 1);
  assert(2 * r < holes[0]);
}
