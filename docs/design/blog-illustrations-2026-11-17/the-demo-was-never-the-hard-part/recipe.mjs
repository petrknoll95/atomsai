export const title = 'The demo is the visible tip';
export const reference = 'modular';
// One small cube (the demo) sits on a far larger body of equal modules: the systems, rules and
// exceptions between a demo and finished work.
const m = 40;
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = 0; k < 2; k++) box(s, [i * m, k * m + m / 2, j * m], [m, m, m]);
  // Top face only, with its outward normal: a whole-solid fade is not depth-tested and would
  // show through the base from below.
  const demo = box(s, [0, 2 * m + m / 2, 0], [m, m, m]);
  const top = demo.faces.find(f => f.normal[1] > .99);
  s.highlights.push({ points: top.points, normal: top.normal, kind: 'diamond', gradient: [] });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 19);
  assert.equal(s.highlights.length, 1);
  assert.deepEqual(s.highlights[0].normal, [0, 1, 0]);
}
