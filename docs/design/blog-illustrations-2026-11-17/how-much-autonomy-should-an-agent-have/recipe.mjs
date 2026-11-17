export const title = 'An adjustable boundary for action';
export const reference = 'modular';
export default function ({ scene, plane, box, X, Y, Z }) {
  const s = scene();
  // One genuine open frame provides the track; the Iris plane is its threshold.
  plane(s, [0, 0, 0], X, Y, 164, 190, false, undefined, [140, 166]);
  plane(s, [0, 20, 0], X, Z, 140, 100, true);
  // An action remains safely below the permission boundary.
  box(s, [0, -43, 10], [42, 42, 42]);
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.primitiveCounts.plane, 2);
  assert.equal(s.primitiveCounts.box, 1);
  assert.equal(s.highlights.length, 1);
  const frame = s.faces.find(f => f.hole);
  assert(frame && frame.hole.length === 4);
  assert.equal(Math.hypot(...sub(frame.points[1], frame.points[0])), 164);
  assert.equal(Math.hypot(...sub(frame.hole[1], frame.hole[0])), 140);
  const threshold = s.highlights[0];
  assert(threshold.points.every(p => p[1] === 20));
  assert.equal(Math.hypot(...sub(threshold.points[1], threshold.points[0])), 140);
  assert.equal(dot(sub(threshold.points[1], threshold.points[0]), sub(threshold.points[3], threshold.points[0])), 0);
  const cubeFaces = s.faces.filter(f => f !== frame && !f.points.every(p => p[1] === 20));
  assert.equal(cubeFaces.length, 6);
  for (const f of cubeFaces) for (const p of f.points) {
    assert(p[1] <= -22, 'Action must remain below the adjustable threshold');
    assert(Math.abs(p[0]) < 70, 'Action must remain inside the frame width');
    assert(p[1] >= -83, 'Action must remain above the frame lower edge');
  }
}
