export const title = 'Set the measure first';
export const reference = 'orbit';

// A dimensioned measuring fixture contacts a real sphere at opposite poles.
// The fixture is a genuinely planar diagram; the sphere retains full 3D depth.
const radius = 44;
const gaugeHalfWidth = 65;
const gaugeHeight = 64;
export default function ({ scene, ellipsoid, stroke, fromView, add, mul }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const u = fromView(1, 0, 0), v = fromView(0, -1, 0);
  const at = (x, y) => add(mul(u, x), mul(v, y));
  ellipsoid(s, [0, 0, 0], [[radius, 0, 0], [0, radius, 0], [0, 0, radius]], { highlight: true });
  stroke(s, [at(-radius, 0), at(-gaugeHalfWidth, 0), at(-gaugeHalfWidth, gaugeHeight), at(gaugeHalfWidth, gaugeHeight), at(gaugeHalfWidth, 0), at(radius, 0)]);
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.primitiveCounts.sphere, 1);
  assert.equal(s.contours.length, 1);
  assert.equal(s.lines.length, 1);
  assert.equal(s.contours[0].highlight, true);
  assert.equal(s.hiddenLines, 'omit');
  const [a, b, c, d, e, f] = s.lines[0].points;
  // Both jaws touch the sphere exactly, and the fixture is mirror symmetric.
  assert(Math.abs(Math.hypot(...a) - radius) < 1e-9);
  assert(Math.abs(Math.hypot(...f) - radius) < 1e-9);
  assert(Math.abs(Math.hypot(...sub(f, a)) - radius * 2) < 1e-9);
  assert(Math.abs(Math.hypot(...sub(c, b)) - gaugeHeight) < 1e-9);
  assert(Math.abs(Math.hypot(...sub(d, e)) - gaugeHeight) < 1e-9);
  assert(Math.abs(Math.hypot(...sub(d, c)) - gaugeHalfWidth * 2) < 1e-9);
  assert(Math.abs(dot(sub(c, b), sub(a, b))) < 1e-9);
  assert(Math.abs(Math.hypot(...sub(a, b)) - (gaugeHalfWidth - radius)) < 1e-9);
  assert(Math.abs(Math.hypot(...sub(f, e)) - (gaugeHalfWidth - radius)) < 1e-9);
  for (const axis of s.contours[0].axes) assert.equal(Math.hypot(...axis), radius);
}
