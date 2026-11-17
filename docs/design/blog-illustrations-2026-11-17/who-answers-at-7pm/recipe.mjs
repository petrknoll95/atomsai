export const title = 'A message after seven';
export const reference = 'modular';

export default function (api) {
  const { scene, tube, ring, box, plane, ellipsoid, stroke, circlePoints, X, Y, Z, transformScene, around } = api;
  const s = scene();
  s.hiddenLines = 'omit';
  const clock = [-32, 28, 0], radius = 70, inner = 62, thickness = 15;
  // Complete cylindrical housing. The inset disks close the ring on both sides.
  tube(s, [clock[0], clock[1], -thickness / 2], radius, inner, thickness, X, Y);
  ring(s, [clock[0], clock[1], -thickness / 2], inner, X, Y, { surface: true });
  ring(s, [clock[0], clock[1], thickness / 2], inner, X, Y, { surface: true });
  const front = [clock[0], clock[1], thickness / 2];
  s.highlights.push({ points: circlePoints(front, radius, X, Y), hole: circlePoints(front, inner, X, Y), normal: Z, kind: 'radial', gradient: [front, [front[0] + radius, front[1], front[2]], [front[0], front[1] + radius, front[2]]] });
  // Two physical hand strips share the spindle. Read as 7:00 without labels.
  for (const [angle, length, z] of [[0, 45, 9], [7 * Math.PI / 6, 31, 11]]) {
    const direction = [Math.sin(angle), Math.cos(angle), 0];
    const side = [direction[1], -direction[0], 0];
    plane(s, [clock[0] + direction[0] * length / 2, clock[1] + direction[1] * length / 2, z], direction, side, length, 3.8);
  }
  // A domed spindle cap meets the clock face and clamps both hand strips.
  ellipsoid(s, [clock[0], clock[1], 7.5], [[4.5, 0, 0], [0, 4.5, 0], [0, 0, -4.5]], { half: true });
  // One closed envelope, separated in depth from the clock with clear visual separation.
  const envelope = [86, -72, 25], w = 104, h = 65, d = 4;
  box(s, envelope, [w, h, d]);
  const z = envelope[2] + d / 2 + .08;
  stroke(s, [[envelope[0] - w / 2, envelope[1] + h / 2, z], [envelope[0], envelope[1] - 4, z], [envelope[0] + w / 2, envelope[1] + h / 2, z]], { normals: [Z] });
  // Pose the complete assembly rigidly, rather than flattening a front-view drawing.
  const pose = p => around(p, Y, Math.PI / 9);
  transformScene(s, pose, pose);
  return s;
}

export function verify(s, { around, Y, sub, dot }, assert) {
  assert.equal(s.hiddenLines, 'omit');
  assert.equal(s.cylinders.length, 1);
  const housing = s.cylinders[0];
  assert.equal(housing.r, 70); assert.equal(housing.inner, 62);
  assert(Math.abs(Math.hypot(...housing.axis) - 15) < 1e-9);
  assert.equal(s.primitiveCounts.box, 1, 'Exactly one envelope');
  assert.equal(s.primitiveCounts.hemisphere, 1, 'Hands share a physical spindle cap');
  assert.equal(s.primitiveCounts.plane, 2, 'Exactly two hands');
  assert.equal(s.highlights.length, 1, 'Only the clock rim is highlighted');
  const unpose = p => around(p, Y, -Math.PI / 9);
  const rim = s.highlights[0];
  for (const p of rim.hole.map(unpose)) {
    assert(Math.abs(p[2] - 7.5) < 1e-8);
    assert(Math.abs(Math.hypot(p[0] + 32, p[1] - 28) - 62) < 1e-8);
  }
  const strips = s.faces.filter(f => f.points.length === 4 && f.points.every(p => [9, 11].some(z => Math.abs(unpose(p)[2] - z) < 1e-8)));
  assert.equal(strips.length, 2);
  for (const f of strips) {
    const points = f.points.map(unpose);
    const a = sub(points[1], points[0]), b = sub(points[3], points[0]);
    assert(Math.abs(dot(a, b)) < 1e-8);
    assert(points.every(p => Math.hypot(p[0] + 32, p[1] - 28) < 62), 'Hands stay inside face');
  }
  const envelopeFaces = s.faces.filter(f => f.points.length === 4 && f.points.every(p => unpose(p)[2] >= 23 - 1e-8));
  assert.equal(envelopeFaces.length, 6, 'Envelope has six real faces');
  assert(23 > 12, 'Envelope remains physically in front of clock and spindle');
  assert(Math.hypot(86 + 32, -72 - 28) > 70 + Math.hypot(104 / 2, 65 / 2) + 20, 'Clock and envelope have separate silhouettes in their common plane');
}
