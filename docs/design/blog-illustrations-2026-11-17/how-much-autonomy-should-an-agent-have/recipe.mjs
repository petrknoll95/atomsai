export const title = 'A ball inside a cube cage';
export const reference = 'modular';
// An open cube cage (twelve edges on eight shared vertices, no panels) holds one highlighted
// ball at its centre, clear of every edge: freedom to move within set bounds.
const half = 70, radius = 30;
export default function ({ scene, stroke, ellipsoid }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const vertices = Array.from({ length: 8 }, (_, bits) => [0, 1, 2].map(axis => bits & (1 << axis) ? half : -half));
  for (let i = 0; i < 8; i++) for (let axis = 0; axis < 3; axis++) {
    const j = i ^ (1 << axis);
    if (i < j) stroke(s, [vertices[i], vertices[j]], { owner: -902 });
  }
  s.primitiveCounts.cage = 1;
  ellipsoid(s, [0, 0, 0], [[radius, 0, 0], [0, radius, 0], [0, 0, radius]], { highlight: true });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.hiddenLines, 'omit');
  const edges = s.lines.filter(l => l.owner === -902);
  assert.equal(edges.length, 12, 'A complete cage has twelve edges');
  assert(!s.faces.some(f => f.owner === -902), 'The cage is open: no panels');
  const degree = new Map();
  for (const { points } of edges) for (const p of points) degree.set(p.join(), (degree.get(p.join()) ?? 0) + 1);
  assert.equal(degree.size, 8);
  assert([...degree.values()].every(n => n === 3), 'Three edges meet at every vertex');
  assert.equal(s.contours.length, 1);
  assert(s.contours[0].highlight);
  // The ball clears every edge: nearest edge distance is half·√2, minus the radius.
  assert(half * Math.SQRT2 - radius > 60);
}
