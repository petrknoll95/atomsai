// Recipe for a contact directory card: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/contact-partnerships.svg, then run scripts/contact-line-art.mjs.
// The kit requires one focal highlight; contact-line-art.mjs strips its Iris fill, so the
// delivered art is line only.
export const title = 'Linked rings';
export const reference = 'always-on';
// Two equal rings, one upright and one flat, each passing through the other's hole.
// Offset a = mid radius / 2 centres each band in the other ring's opening.
export default function ({ scene, tube, X, Y, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const r = 58, inner = 44, t = 12, a = (r + inner) / 4;
  tube(s, [-a, 0, -t / 2], r, inner, t, X, Y, true); // cross(X,Y)=+Z: spans z -t/2..t/2
  tube(s, [a, t / 2, 0], r, inner, t, X, Z);   // cross(X,Z)=-Y: spans y t/2..-t/2
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.cylinders.length, 2);
  const [A, B] = s.cylinders, a = -A.top[0];
  // A's right band sits inside B's hole, and B's left band inside A's hole (along X).
  assert(-a + A.r < a + B.inner && -a + A.inner > a - B.inner);
  assert(a - B.r > -a - A.inner && a - B.inner < -a + A.inner);
}
