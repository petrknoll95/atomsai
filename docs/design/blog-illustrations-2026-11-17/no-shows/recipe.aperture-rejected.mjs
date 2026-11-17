export const title = 'A vacant appointment has a matching place';
export const reference = 'layers';
const outer = 144, opening = 64, insert = 56;
export default function ({ scene, plane, X, Z }) {
  const s = scene();
  plane(s, [0, -28, 0], X, Z, outer, outer, false, undefined, [opening, opening]);
  plane(s, [0, 55, 0], X, Z, insert, insert, true);
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.faces.length, 2);
  assert.equal(s.highlights.length, 1);
  const slot = s.faces[0], part = s.faces[1];
  assert.equal(slot.hole.length, 4);
  assert.equal(Math.hypot(...sub(slot.hole[1], slot.hole[0])), opening);
  assert.equal(Math.hypot(...sub(part.points[1], part.points[0])), insert);
  assert.equal(dot(sub(part.points[1], part.points[0]), sub(part.points[3], part.points[0])), 0);
  assert(insert < opening);
  for (const points of [slot.hole, part.points]) {
    assert.equal(points.reduce((sum,p) => sum+p[0],0), 0);
    assert.equal(points.reduce((sum,p) => sum+p[2],0), 0);
  }
  assert.equal(part.points[0][1] - slot.points[0][1], 83);
}
