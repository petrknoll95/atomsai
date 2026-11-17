export const title = 'Define the checklist first';
export const reference = 'built-in-your-stack';

const pose = Math.PI / 9;
const board = { center: [0, 0, 0], size: [108, 156, 8] };
const paper = { center: [0, -4, 4.4], size: [92, 134, .8] };
const rows = [30, 0, -30];
const inkZ = 4.86;
export default function ({ scene, box, plane, stroke, curve, transformScene, around, X, Y }) {
  const s = scene();
  s.hiddenLines = 'omit';
  box(s, board.center, board.size);
  box(s, paper.center, paper.size);
  // The clamp's lower back contacts the paper. Its two feet reach the bare board above it.
  box(s, [0, 62, 7.4], [38, 14, 5.2]);
  for (const x of [-14, 14]) box(s, [x, 73, 7], [8, 8, 6]);
  // A wire handle loops above the board and terminates on the clamp's front face.
  curve(s, [-8, 66, 10], [-8, 89, 10], [8, 89, 10], [8, 66, 10]);
  for (const [i, y] of rows.entries()) {
    plane(s, [-20, y, inkZ], X, Y, 18, 18, i === 0);
    // Blank checklist rules carry no lettering or invented words.
    stroke(s, [[-1, y, inkZ + .03], [29, y, inkZ + .03]], { normals: [[0, 0, 1]] });
    if (i < 2) stroke(s, [[-26, y, inkZ + .03], [-21, y - 5, inkZ + .03], [-14, y + 6, inkZ + .03]], { normals: [[0, 0, 1]] });
  }
  // Only the first printed checkbox is highlighted, away from the physical clip.
  // Giving it an outward normal makes the fill disappear on the rear of the board.
  s.highlights[0].normal = [0, 0, 1];
  transformScene(s, p => around(p, Y, pose), v => around(v, Y, pose));
  return s;
}
export function verify(s, { around, Y }, assert) {
  assert.equal(s.primitiveCounts.box, 5);
  assert.equal(s.primitiveCounts.plane, 3);
  assert.equal(s.primitiveCounts['bezier-curve'], 1);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
  const unpose = p => around(p, Y, -pose);
  const close = (a, b) => Math.abs(a - b) < 1e-8;
  const faces = s.faces.map(f => f.points.map(unpose));
  // The board has real front and rear surfaces, and the sheet rests on its front.
  assert(faces.some(p => p.every(v => close(v[2], -4))));
  assert(faces.some(p => p.every(v => close(v[2], 4))));
  assert(faces.some(p => p.every(v => close(v[2], 4.8))));
  assert(close(paper.center[2] - paper.size[2] / 2, board.size[2] / 2));
  assert(close(7.4 - 5.2 / 2, paper.center[2] + paper.size[2] / 2));
  assert.equal(73 - 8 / 2, 62 + 14 / 2);
  assert.equal(7 - 6 / 2, board.size[2] / 2);
  assert(73 - 8 / 2 > paper.center[1] + paper.size[1] / 2);
  const boxes = faces.filter(p => p.every(v => close(v[2], inkZ)));
  assert.equal(boxes.length, 3);
  for (const [i, points] of boxes.entries()) {
    assert(close(Math.min(...points.map(p => p[1])), rows[i] - 9));
    assert(close(Math.max(...points.map(p => p[1])), rows[i] + 9));
  }
  const marks = s.lines.filter(l => l.points.length === 3);
  assert.equal(marks.length, 2);
  assert(s.highlights[0].points.map(unpose).every(p => p[1] <= 39 && p[1] >= 21));
  assert(39 < 62 - 14 / 2); // The highlight is physically separated from the clip.
  const handle = s.lines.find(l => l.points.length === 81).points.map(unpose);
  for (const point of [handle[0], handle.at(-1)]) assert(close(point[2], 10) && close(point[1], 66));
}
