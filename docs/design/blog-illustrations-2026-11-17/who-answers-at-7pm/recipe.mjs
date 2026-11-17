export const title = 'Service continues through the boundary';
export const reference = 'modular';

export default function ({ scene, tube, stroke, circlePoints, Y, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  // A complete solid slab with a real square tunnel through its thickness.
  const owner = -701, halfThickness = 6, outer = 86, aperture = 45;
  const corners = size => [[-size, -size], [size, -size], [size, size], [-size, size]];
  const at = (x, size) => corners(size).map(([y, z]) => [x, y, z]);
  const front = at(halfThickness, outer), rear = at(-halfThickness, outer);
  const frontHole = at(halfThickness, aperture), rearHole = at(-halfThickness, aperture);
  s.faces.push({ points: front, hole: frontHole, owner }, { points: rear, hole: rearHole, owner });
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    s.faces.push({ points: [rear[i], rear[j], front[j], front[i]], owner });
    s.faces.push({ points: [rearHole[i], frontHole[i], frontHole[j], rearHole[j]], owner });
    stroke(s, [rear[i], front[i]], { owner });
    stroke(s, [rearHole[i], frontHole[i]], { owner });
  }
  for (const points of [front, rear, frontHole, rearHole]) stroke(s, points, { owner, closed: true });
  s.primitiveCounts['aperture-slab'] = 1;
  // One uninterrupted hollow conduit crosses the aperture with 15 units of clearance.
  tube(s, [-110, 0, 0], 30, 19, 220, Y, Z);
  const exit = [110, 0, 0];
  s.highlights.push({
    points: circlePoints(exit, 30, Y, Z), hole: circlePoints(exit, 19, Y, Z),
    normal: [1, 0, 0], kind: 'radial', gradient: [exit, [110, 30, 0], [110, 0, 30]],
  });
  return s;
}

export function verify(s, { sub }, assert) {
  assert.equal(s.hiddenLines, 'omit');
  assert.equal(s.primitiveCounts['aperture-slab'], 1);
  assert.equal(s.cylinders.length, 1, 'One continuous passage');
  const conduit = s.cylinders[0];
  assert.deepEqual(conduit.top, [-110, 0, 0]);
  assert.deepEqual(conduit.axis, [220, 0, 0]);
  assert.equal(conduit.r, 30); assert.equal(conduit.inner, 19);
  assert.equal(45 - conduit.r, 15, 'Positive clearance from tube to all four aperture walls');
  const slab = s.faces.filter(f => f.owner === -701);
  assert.equal(slab.length, 10, 'Two pierced caps, four outer walls, four cavity walls');
  const caps = slab.filter(f => f.hole);
  assert.equal(caps.length, 2);
  for (const cap of caps) {
    assert(cap.points.every(p => Math.abs(p[0]) === 6));
    assert.equal(Math.hypot(...sub(cap.hole[1], cap.hole[0])), 90);
    assert(cap.hole.every(p => Math.abs(p[1]) === 45 && Math.abs(p[2]) === 45));
  }
  const cavity = slab.filter(f => !f.hole && f.points.every(p => Math.abs(p[1]) <= 45 && Math.abs(p[2]) <= 45));
  assert.equal(cavity.length, 4, 'The hole has all four real depth walls');
  assert.equal(s.highlights.length, 1);
  const h = s.highlights[0];
  assert.deepEqual(h.normal, [1, 0, 0]);
  assert(h.points.every(p => p[0] === 110), 'Highlight is on the exposed exit cap');
  assert(h.hole.every(p => Math.abs(Math.hypot(...sub(p, [110, 0, 0])) - 19) < 1e-8), 'Highlight preserves the open bore');
  assert(110 > 6, 'Highlighted exit lies beyond the front slab face');
}
