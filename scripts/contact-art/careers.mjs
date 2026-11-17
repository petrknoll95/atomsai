// Recipe for a contact directory card: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/contact-careers.svg, then run scripts/contact-motion.mjs (stills and loops).
// The kit requires one focal highlight; contact-motion.mjs never draws it, so the
// delivered art is line only.
export const title = 'Next step';
export const reference = 'modular';
// Three equal-tread steps rising away from the viewer (toward −Z, so the flight climbs to the left) in equal increments; a user figure (the house user,
// at half scale) stands on the top tread.
// Hover loop: the figure crouches, hops off the top step, lands with a squash and rests.
export const motion = { duration: 1.8 };
const bump = (t, a, b) => t > a && t < b ? Math.sin(Math.PI * (t - a) / (b - a)) ** 2 : 0;
// t is the loop phase in [0, 1); t = 0 is the approved still.
export default function ({ scene, box, ellipsoid, add, mul, circlePoints, X, Y, Z }, t = 0) {
  const crouch = bump(t, 0, .24) + .7 * bump(t, .5, .66), s1 = t > .18 && t < .5 ? (t - .18) / .32 : 0;
  const lift = 30 * 4 * s1 * (1 - s1);
  const s = scene();
  s.hiddenLines = 'omit';
  const tread = 56, rise = 34, depth = 84;
  for (let i = 0; i < 3; i++) box(s, [0, (i + 1) * rise / 2, (1 - i) * tread], [depth, (i + 1) * rise, tread]);
  // House user proportions (shoulders 70 × 60, head r 35) at 0.5.
  const k = .5, base = [0, 3 * rise + lift, -tread], r = 70 * k, h = 60 * k * (1 - .2 * crouch), head = 35 * k;
  const shoulders = ellipsoid(s, base, [mul(X, r), mul(Z, r), mul(Y, -h)], { half: true });
  s.faces.push({ points: circlePoints(base, r, X, Z, 96), owner: shoulders });
  ellipsoid(s, add(base, mul(Y, h + head)), [mul(X, head), mul(Z, head), mul(Y, head)], { highlight: true });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 3);
  assert.equal(s.contours.length, 2);
}
