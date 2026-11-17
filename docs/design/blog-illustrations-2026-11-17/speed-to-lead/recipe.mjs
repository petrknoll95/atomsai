export const title = 'Three replies racing; one already there';
export const reference = 'modular';
// Three equal lanes share a start line. Two replies are still near the start; one has reached
// the dashed finish line and carries the highlight.
const length = 210, lane = 38, spacing = 52, cube = 32;
export default function ({ scene, box, stroke }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const ends = length / 2, y = 4 + cube / 2;
  [-1, 0, 1].forEach(k => box(s, [0, 2, k * spacing], [length, 4, lane]));
  const positions = [[-1, -ends + 30], [0, ends - cube / 2 - 6], [1, -ends + 64]];
  for (const [k, x] of positions) {
    const b = box(s, [x, y, k * spacing], [cube, cube, cube]);
    if (k === 0) { const f = b.faces.find(f => f.normal[1] > .99); s.highlights.push({ points: f.points, normal: f.normal, kind: 'diamond', gradient: [] }); }
  }
  const reach = spacing + lane / 2;
  stroke(s, [[ends, 4.5, -reach], [ends, 4.5, reach]], { dash: [4, 4] });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 6);
  assert.equal(s.highlights.length, 1);
}
