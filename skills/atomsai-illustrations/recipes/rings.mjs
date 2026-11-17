export const title = 'Hollow stack';
export const reference = 'always-on';
export default function ({ scene, tube, X, Z, circlePoints }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const rings = [[60, 100, 60], [0, 76, 45], [-60, 52, 30]];
  for (const [y, radius, hole] of rings) tube(s, [0, y, 0], radius, hole, 13, X, Z);
  // Highlight only the top annulus; tube(highlight=true) highlights the whole solid.
  const center = [0, 60, 0];
  s.highlights.push({
    points: circlePoints(center, 100, X, Z), hole: circlePoints(center, 60, X, Z),
    normal: [0, 1, 0], kind: 'radial', gradient: [center, [100, 60, 0], [0, 60, 100]],
  });
  return s;
}
export function verify(s, { sub }, assert) {
  assert.equal(s.cylinders.length, 3);
  assert.equal(s.hiddenLines, 'omit');
  assert.equal(s.highlights.length, 1);
  assert(s.highlights[0].hole.length > 100);
  for (const c of s.cylinders) {
    assert(c.r > c.inner && c.inner > 0);
    assert.equal(Math.hypot(...c.axis), 13);
  }
  for (const p of s.highlights[0].hole) assert(Math.abs(Math.hypot(...sub(p, [0, 60, 0])) - 60) < 1e-7);
}
