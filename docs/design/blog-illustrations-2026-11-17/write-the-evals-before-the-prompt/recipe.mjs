export const title = 'A reference before a result';
export const reference = 'layers';

// Known answer and observed output use precisely the same physical dimensions.
const width = 120, depth = 120, separation = 26;
const offset = (width + separation) / 2;
export default function ({ scene, plane, X, Z }) {
  const s = scene();
  plane(s, [-offset, 0, 0], X, Z, width, depth, true);
  plane(s, [offset, 0, 0], X, Z, width, depth);
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.primitiveCounts.plane, 2);
  assert.equal(s.faces.length, 2);
  assert.equal(s.highlights.length, 1);
  const [reference, result] = s.faces.map(f => f.points);
  for (const points of [reference, result]) {
    assert.equal(Math.hypot(...sub(points[1], points[0])), width);
    assert.equal(Math.hypot(...sub(points[3], points[0])), depth);
    assert.equal(dot(sub(points[1], points[0]), sub(points[3], points[0])), 0);
    assert(points.every(p => p[1] === 0));
  }
  // Translation alone maps the reference to the result: the standard never changes.
  for (let i = 0; i < reference.length; i++) {
    assert.equal(result[i][0] - reference[i][0], width + separation);
    assert.equal(result[i][1], reference[i][1]);
    assert.equal(result[i][2], reference[i][2]);
  }
  assert.equal(Math.min(...result.map(p => p[0])) - Math.max(...reference.map(p => p[0])), separation);
}
