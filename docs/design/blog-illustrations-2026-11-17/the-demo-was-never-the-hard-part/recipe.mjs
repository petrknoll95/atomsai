export const title = 'The demo is the visible tip';
export const reference = 'modular';
// One small cube (the demo) sits on a far larger body of equal modules: the systems, rules and
// exceptions between a demo and finished work.
const m = 40;
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = 0; k < 2; k++) box(s, [i * m, k * m + m / 2, j * m], [m, m, m]);
  box(s, [0, 2 * m + m / 2, 0], [m, m, m], { highlight: true });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 19);
  assert.equal(s.highlights.length, 1);
}
