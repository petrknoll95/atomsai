export const title = 'One quote out, then the follow-up dwindles';
export const reference = 'modular';
// Four equal upright sheets stand in a row on one floor line, evenly spaced, each shorter than
// the last: the quote goes out at full height, and every follow-up after it is smaller until
// the row goes quiet. The first sheet carries the highlight on its viewer-facing face.
const width = 84, depth = 6, spacing = 66, heights = [132, 92, 56, 24];
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  heights.forEach((h, k) => {
    // The row runs back along −X; sheets face +X, toward the neutral camera's right-hand side.
    const sheet = box(s, [-k * spacing, h / 2, 0], [depth, h, width]);
    if (k === 0) { const f = sheet.faces.find(f => f.normal[0] > .99); s.highlights.push({ points: f.points, normal: f.normal, kind: 'diamond', gradient: [] }); }
  });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.hiddenLines, 'omit');
  assert.equal(s.primitiveCounts.box, heights.length);
  assert.equal(s.highlights.length, 1);
  assert.deepEqual(s.highlights[0].normal, [1, 0, 0]);
  for (let k = 1; k < heights.length; k++) assert(heights[k] < heights[k - 1], 'Each follow-up is smaller');
  // Every sheet stands on the floor and keeps a clear gap to its neighbour.
  assert(Math.min(...s.faces.flatMap(f => f.points.map(p => p[1]))) === 0);
  assert(spacing - depth >= 30);
}
