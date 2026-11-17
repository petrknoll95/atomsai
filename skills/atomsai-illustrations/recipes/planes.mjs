export const title = 'Aligned sheets';
export const reference = 'layers';
export default function ({ scene, plane, X, Z }) {
  const s = scene();
  for (let i = -1; i <= 1; i++) plane(s, [0, i * 29, 0], X, Z, 140, 140, i === 0);
  return s; // Raw world units; the runner applies the gallery fit exactly once.
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.faces.length, 3);
  assert.equal(s.highlights.length, 1);
  for (const { points: p } of s.faces) {
    assert.equal(Math.hypot(...sub(p[1], p[0])), 140);
    assert.equal(dot(sub(p[1], p[0]), sub(p[3], p[0])), 0);
  }
}
