export const title = 'Make the connection';
export const reference = 'modular';

// One rectangular cable plug aligned with one real, recessed matching socket.
const socket = { front: -30, back: -72, cavityBack: -60, height: 80, depth: 80, opening: [32, 44] };
const plug = { center: [52, 0, 0], size: [40, 54, 64], tongue: { center: [18, 0, 0], size: [28, 24, 36] } };
export default function ({ scene, plane, box, curve, X, Y, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const { front, back, cavityBack, height, depth, opening: [h, d] } = socket;
  // The front is an actual annular rectangular surface. There is no solid face behind its hole.
  plane(s, [front, 0, 0], Y, Z, height, depth, false, undefined, [h, d]);
  plane(s, [back, 0, 0], Y, Z, height, depth);
  for (const sign of [-1, 1]) {
    plane(s, [(front + back) / 2, sign * height / 2, 0], X, Z, front - back, depth);
    plane(s, [(front + back) / 2, 0, sign * depth / 2], X, Y, front - back, height);
    // Four inner walls and the recessed back make a genuine 30-unit-deep cavity.
    plane(s, [(front + cavityBack) / 2, sign * h / 2, 0], X, Z, front - cavityBack, d);
    plane(s, [(front + cavityBack) / 2, 0, sign * d / 2], X, Y, front - cavityBack, h);
  }
  plane(s, [cavityBack, 0, 0], Y, Z, h, d);
  const housing = box(s, plug.center, plug.size);
  box(s, plug.tongue.center, plug.tongue.size);
  // A short strain relief shares the housing's rear face; the cable starts at its outer end.
  box(s, [80, 0, 0], [16, 22, 26]);
  curve(s, [88, 0, 0], [112, 0, 0], [114, -48, 6], [134, -48, 6]);
  const top = housing.faces.find(face => face.normal[1] > .99);
  s.highlights.push({ points: top.points, normal: top.normal, kind: 'diamond', gradient: [] });
  return s;
}
export function verify(s, { sub }, assert) {
  assert.equal(s.primitiveCounts.box, 3);
  assert.equal(s.primitiveCounts.plane, 11);
  assert.equal(s.primitiveCounts['bezier-curve'], 1);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
  const front = s.faces.find(f => f.hole);
  assert(front && front.hole.length === 4);
  assert(front.points.every(p => p[0] === socket.front));
  assert(front.hole.every(p => Math.abs(p[1]) === 16 && Math.abs(p[2]) === 22));
  assert(socket.front - socket.cavityBack > plug.tongue.size[0]);
  assert(socket.opening[0] > plug.tongue.size[1]);
  assert(socket.opening[1] > plug.tongue.size[2]);
  assert.equal(plug.tongue.center[0] + plug.tongue.size[0] / 2, plug.center[0] - plug.size[0] / 2);
  const travel = plug.center[0] - plug.size[0] / 2 - socket.front;
  assert.equal(plug.tongue.center[0] - plug.tongue.size[0] / 2 - travel, socket.cavityBack + 2);
  assert.equal(plug.center[0] + plug.size[0] / 2, 80 - 16 / 2);
  const cable = s.lines.find(l => l.points.length === 81);
  assert.deepEqual(cable.points[0], [80 + 16 / 2, 0, 0]);
  assert.deepEqual(sub(cable.points[1], cable.points[0]).map((v, i) => i === 0 ? Math.sign(v) : 0), [1, 0, 0]);
}
