// Recipe for a contact directory card: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/contact-press.svg, then run scripts/contact-line-art.mjs.
// The kit requires one focal highlight; contact-line-art.mjs strips its Iris fill, so the
// delivered art is line only.
export const title = 'Desk microphone';
export const reference = 'always-on';
// A round base, a slim stem, a collar and a spherical head with an equatorial grille band.
export default function ({ scene, ellipsoid, ring, stroke, add, mul, circlePoints, X, Y, Z }) {
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
  const head = 36, hy = 168;
  cylinder(54, 0, 10);         // base
  cylinder(5, 10, 112);        // stem
  cylinder(14, 112, hy - head + 4); // collar, tucked just under the head
  ellipsoid(s, [0, hy, 0], [mul(X, head), mul(Z, head), mul(Y, head)], { highlight: true });
  ring(s, [0, hy, 0], head + .01, X, Z); // grille band on the equator
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.cylinders.length, 3);
  assert.equal(s.contours.length, 1);
}
