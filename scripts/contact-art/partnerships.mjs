// Recipe for a contact directory card: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/contact-partnerships.svg, then run scripts/contact-motion.mjs (stills and loops).
// The kit requires one focal highlight; contact-motion.mjs never draws it, so the
// delivered art is line only.
export const title = 'Linked rings';
export const reference = 'always-on';
// Two equal rings, one upright and one flat, each passing through the other's hole.
// Offset a = mid radius / 2 centres each band in the other ring's opening.
// Hover loop: each ring swings about the shared X axis through its own centre, in counterphase.
// Each band crosses the other ring exactly at that ring's centre, so the link holds at any angle;
// ±25° keeps the planes at least 40° apart, which clears the bands (needs > 22°).
export const motion = { duration: 3.2 };
// t is the loop phase in [0, 1); t = 0 is the approved still.
export default function ({ scene, tube, around, cross, sub, mul, X, Y, Z }, t = 0) {
  const s = scene();
  s.hiddenLines = 'omit';
  const r = 58, inner = 44, th = 12, a = (r + inner) / 4, swing = 25 * Math.PI / 180 * Math.sin(2 * Math.PI * t);
  // tube() takes its first cap as centre; offset by half the thickness so each ring is centred.
  const ringAt = (c, v, highlight) => { const n = cross(X, v); tube(s, sub(c, mul(n, th / 2)), r, inner, th, X, v, highlight); };
  ringAt([-a, 0, 0], around(Y, X, swing), true);  // upright: spans z ±th/2 at rest
  ringAt([a, 0, 0], around(Z, X, -swing), false); // flat: spans y ±th/2 at rest
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.cylinders.length, 2);
  const [A, B] = s.cylinders, a = -A.top[0];
  // A's right band sits inside B's hole, and B's left band inside A's hole (along X).
  assert(-a + A.r < a + B.inner && -a + A.inner > a - B.inner);
  assert(a - B.r > -a - A.inner && a - B.inner < -a + A.inner);
}
