export const title = 'Freedom inside a defined volume';
export const reference = 'modular';
const half = [75, 80, 70], center = [-20, 4, 14], radius = 34;

export default function ({ scene, stroke, ellipsoid }) {
  const s = scene();
  s.hiddenLines = 'omit';
  // All twelve edges are built from eight shared vertices. There are no opaque cage panels.
  const vertices = Array.from({ length: 8 }, (_, bits) => half.map((v, axis) => bits & (1 << axis) ? v : -v));
  for (let i = 0; i < 8; i++) for (let axis = 0; axis < 3; axis++) {
    const j = i ^ (1 << axis);
    if (i < j) stroke(s, [vertices[i], vertices[j]], { owner: -901 });
  }
  s.primitiveCounts['open-volume'] = 1;
  // A true sphere sits away from the walls, with spare space to move in every direction.
  ellipsoid(s, center, [[radius, 0, 0], [0, radius, 0], [0, 0, radius]], { highlight: true });
  return s;
}

export function verify(s, { sub, dot }, assert) {
  assert.equal(s.hiddenLines, 'omit');
  assert.equal(s.primitiveCounts['open-volume'], 1);
  assert.equal(s.primitiveCounts.sphere, 1);
  const edges = s.lines.filter(l => l.owner === -901);
  assert.equal(edges.length, 12, 'A complete 3D enclosure has twelve structural edges');
  const degree = new Map(), keys = new Set();
  for (const edge of edges) {
    assert.equal(edge.points.length, 2);
    const [a, b] = edge.points;
    assert.equal(a.filter((v, axis) => v !== b[axis]).length, 1, 'Every edge changes only one world axis');
    const key = [a.join(','), b.join(',')].sort().join('|');
    assert(!keys.has(key), 'No duplicate cage edges'); keys.add(key);
    for (const p of edge.points) {
      assert(p.every((v, axis) => Math.abs(v) === half[axis]));
      degree.set(p.join(','), (degree.get(p.join(',')) ?? 0) + 1);
    }
  }
  assert.equal(degree.size, 8);
  assert([...degree.values()].every(n => n === 3), 'Three shared edges meet at every vertex');
  assert(!s.faces.some(f => f.owner === -901), 'The enclosure is genuinely open, not opaque panels');
  assert.equal(s.contours.length, 1);
  const sphere = s.contours[0];
  assert.deepEqual(sphere.center, center);
  assert(sphere.highlight && !sphere.half);
  for (let axis = 0; axis < 3; axis++) {
    assert.equal(Math.hypot(...sphere.axes[axis]), radius);
    assert(half[axis] - Math.abs(center[axis]) - radius >= 20, 'Sphere clears every boundary by at least twenty world units');
    for (let other = axis + 1; other < 3; other++) assert.equal(dot(sphere.axes[axis], sphere.axes[other]), 0);
  }
  assert(Math.hypot(...sub(center, [0, 0, 0])) > 20, 'Off-center placement visibly leaves room for movement');
}
