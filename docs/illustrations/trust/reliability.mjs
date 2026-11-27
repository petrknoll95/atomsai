export const title = 'Gimbal';
export const reference = 'orbit';
// A highlighted sphere held by three nested, mutually perpendicular hoops.
export default function ({ scene, ellipsoid, ring, X, Y, Z }) {
  const s = scene();
  const R = 58;
  ellipsoid(s, [0, 0, 0], [[R, 0, 0], [0, 0, R], [0, R, 0]], { highlight: true });
  ring(s, [0, 0, 0], 74, X, Z);
  ring(s, [0, 0, 0], 88, X, Y);
  ring(s, [0, 0, 0], 102, Y, Z);
  return s;
}
export function verify(s, { sub }, assert) {
  assert.equal(s.contours.length, 1);
  for (const l of s.lines) { const r = Math.hypot(...l.points[0]); for (const p of l.points) assert(Math.abs(Math.hypot(...p) - r) < 1e-7); }
}
