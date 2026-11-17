export const title = 'A quote, then the ripples go quiet';
export const reference = 'modular';
// A flat sheet (the quote) lies at the centre of three concentric ground rings, evenly spaced.
// The inner two are solid; the outer one breaks into dashes, where follow-up stops.
const sheet = [64, 84], radii = [74, 102, 130];
export default function ({ scene, plane, ring, X, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  plane(s, [0, 0, 0], X, Z, ...sheet, true);
  radii.forEach((r, k) => ring(s, [0, 0, 0], r, X, Z, k === radii.length - 1 ? { dash: [6, 8] } : {}));
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.circle, 3);
  assert.equal(s.highlights.length, 1);
  assert.equal(radii[1] - radii[0], radii[2] - radii[1], 'Even ripple spacing');
  assert(Math.hypot(...sheet) / 2 < radii[0], 'Sheet sits inside the first ring');
}
