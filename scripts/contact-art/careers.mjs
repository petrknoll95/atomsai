// Recipe for a contact directory card: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/contact-careers.svg, then run scripts/contact-line-art.mjs.
// The kit requires one focal highlight; contact-line-art.mjs strips its Iris fill, so the
// delivered art is line only.
export const title = 'Next step';
export const reference = 'modular';
// Three equal-tread steps rising away from the viewer (toward −X) in equal increments; a user figure (the house user,
// at half scale) stands on the top tread.
export default function ({ scene, box, ellipsoid, add, mul, circlePoints, X, Y, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const tread = 56, rise = 34, depth = 84;
  for (let i = 0; i < 3; i++) box(s, [(1 - i) * tread, (i + 1) * rise / 2, 0], [tread, (i + 1) * rise, depth]);
  // House user proportions (shoulders 70 × 60, head r 35) at 0.5.
  const k = .5, base = [-tread, 3 * rise, 0], r = 70 * k, h = 60 * k, head = 35 * k;
  const shoulders = ellipsoid(s, base, [mul(X, r), mul(Z, r), mul(Y, -h)], { half: true });
  s.faces.push({ points: circlePoints(base, r, X, Z, 96), owner: shoulders });
  ellipsoid(s, add(base, mul(Y, h + head)), [mul(X, head), mul(Z, head), mul(Y, head)], { highlight: true });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 3);
  assert.equal(s.contours.length, 2);
}
