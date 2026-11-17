export const title = 'A reply returns to its quote';
export const reference = 'unfolding';
const left = [-70, 25, 0], right = [70, -25, 0];
const width = 86, depth = 100;
export default function ({ scene, plane, curve, X, Z }) {
  const s = scene();
  plane(s, left, X, Z, width, depth);
  plane(s, right, X, Z, width, depth, true);
  for (const sign of [-1, 1]) {
    const z = sign * depth / 2;
    curve(s, [left[0] + width / 2, left[1], z], [-5, left[1], z], [5, right[1], z], [right[0] - width / 2, right[1], z]);
  }
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.faces.length, 2);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.primitiveCounts['bezier-curve'], 2);
  for (const { points: p } of s.faces) {
    assert.equal(Math.hypot(...sub(p[1], p[0])), width);
    assert.equal(Math.hypot(...sub(p[3], p[0])), depth);
    assert.equal(dot(sub(p[1], p[0]), sub(p[3], p[0])), 0);
  }
  const links = s.lines.filter(line => line.points.length === 81);
  for (const link of links) {
    assert(s.faces[0].points.some(p => p.every((v, i) => v === link.points[0][i])));
    assert(s.faces[1].points.some(p => p.every((v, i) => v === link.points.at(-1)[i])));
  }
  assert(right[0] - width / 2 > left[0] + width / 2);
}
