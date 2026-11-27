export const title = 'Module sliding into the stack';
export const reference = 'stack';
// Three equal slabs share one footprint; the highlighted middle module slides in along X.
const W = 140, H = 22, GAP = 12, PULL = 46;
export default function ({ scene, box, X }) {
  const s = scene();
  s.hiddenLines = 'omit';
  for (const i of [-1, 0, 1]) box(s, [i === 0 ? PULL : 0, i * (H + GAP), 0], [W, H, W], { highlight: i === 0 });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
}
