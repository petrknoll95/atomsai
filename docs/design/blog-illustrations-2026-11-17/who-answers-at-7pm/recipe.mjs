export const title = 'Every channel, one open receiver';
export const reference = 'always-on';
export default function ({ scene, plane, tube, X, Z, circlePoints }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const center = [0, -35, 0];
  tube(s, center, 86, 58, 30, X, Z);
  s.highlights.push({
    points: circlePoints(center, 86, X, Z),
    hole: circlePoints(center, 58, X, Z),
    normal: [0, 1, 0], kind: 'radial',
    gradient: [center, [86, -35, 0], [0, -35, 86]],
  });
  for (const [x, z] of [[-65, 14], [0, -42], [65, 14]]) {
    plane(s, [x, 70, z], X, Z, 38, 38);
  }
  return s;
}
export function verify(s, { sub }, assert) {
  assert.equal(s.cylinders.length, 1);
  const c = s.cylinders[0];
  assert.equal(c.r, 86); assert.equal(c.inner, 58);
  assert.equal(Math.hypot(...c.axis), 30);
  assert.equal(s.primitiveCounts.plane, 3);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
  const h = s.highlights[0];
  assert(h.hole.length > 100);
  for (const p of h.hole) assert(Math.abs(Math.hypot(...sub(p, [0, -35, 0])) - 58) < 1e-7);
  const sheets = s.faces.filter(f => f.points.length === 4 && f.points.every(p => p[1] === 70));
  assert.equal(sheets.length, 3);
  for (const f of sheets) assert.equal(Math.hypot(...sub(f.points[1], f.points[0])), 38);
}
