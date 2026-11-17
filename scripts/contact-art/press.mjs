// Recipe for a contact directory card: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/contact-press.svg, then run scripts/contact-line-art.mjs.
// The kit requires one focal highlight; contact-line-art.mjs strips its Iris fill, so the
// delivered art is line only.
export const title = 'Desk microphone';
export const reference = 'always-on';
// A round base, a slim stem, a collar and a spherical head with an equatorial grille band.
// Hover loop, a desk-lamp hop: crouch, spring up with a lean, land with a squash, rest.
export const motion = { duration: 2.2 };
const bump = (t, a, b) => t > a && t < b ? Math.sin(Math.PI * (t - a) / (b - a)) ** 2 : 0;
export function pose(t) {
  const crouch = bump(t, 0, .22) + .7 * bump(t, .55, .72);
  const s = t > .2 && t < .55 ? (t - .2) / .35 : 0;
  return { crouch, lift: 44 * 4 * s * (1 - s), lean: 9 * Math.PI / 180 * Math.sin(Math.PI * s) };
}
// t is the loop phase in [0, 1); t = 0 is the approved still.
export default function ({ scene, ellipsoid, ring, stroke, add, mul, unit, around, transformScene, circlePoints, X, Y, Z }, t = 0) {
  const { crouch, lift, lean } = pose(t);
  const s = scene();
  s.hiddenLines = 'omit';
  let owner = 7000;
  // Solid cylinder from y0 to y1: side and cap faces, cap outlines, view-dependent silhouettes.
  const cylinder = (r, y0, y1) => {
    const id = ++owner, n = 96, lo = circlePoints([0, y0, 0], r, X, Z, n), hi = circlePoints([0, y1, 0], r, X, Z, n);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; s.faces.push({ points: [lo[i], lo[j], hi[j], hi[i]], owner: id }); }
    s.faces.push({ points: lo, owner: id }, { points: hi, owner: id });
    stroke(s, lo, { closed: true, owner: id }); stroke(s, hi, { closed: true, owner: id });
    s.cylinders.push({ top: [0, y0, 0], axis: [0, y1 - y0, 0], u: X, v: Z, r, inner: 0, owner: id, width: 1 });
  };
  const head = 36, drop = 14 * crouch, top = 112 - drop, hy = 168 - drop; // the stem shortens in a crouch
  cylinder(54, 0, 10);         // base
  cylinder(5, 10, top);        // stem
  cylinder(14, top, hy - head + 4); // collar, tucked just under the head
  ellipsoid(s, [0, hy, 0], [mul(X, head), mul(Z, head), mul(Y, head)], { highlight: true });
  ring(s, [0, hy, 0], head + .01, X, Z); // grille band on the equator
  // Lean about the base's ground point on the screen-horizontal tilt axis, then lift.
  const axis = unit([1, 0, 1]);
  if (lean || lift) transformScene(s, p => add(around(p, axis, lean), [0, lift, 0]), v => around(v, axis, lean));
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.cylinders.length, 3);
  assert.equal(s.contours.length, 1);
}
