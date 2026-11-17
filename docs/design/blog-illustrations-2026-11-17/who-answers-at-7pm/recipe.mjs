export const title = 'Every channel into one answer';
export const reference = 'modular';
// Four channels arrive from four sides into one ring, the single agent that answers them all.
// Each channel is a rod that meets the ring's outer wall, carrying one message at its far end.
const R = 42, inner = 28, h = 14, rod = 10, length = 70, msg = 20;
export default function ({ scene, tube, box, circlePoints, X, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  // u=X, v=Z extends along cross(X, Z) = −Y, so the ring spans y 0..h below its top cap.
  tube(s, [0, h, 0], R, inner, h, X, Z);
  const top = [0, h, 0];
  s.highlights.push({ points: circlePoints(top, R, X, Z), hole: circlePoints(top, inner, X, Z), normal: [0, 1, 0], kind: 'radial', gradient: [top, [R, h, 0], [0, h, R]] });
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const mid = R + length / 2 - 1, far = R + length + msg / 2 - 1;
    box(s, [dx * mid, h / 2, dz * mid], dx ? [length, rod, rod] : [rod, rod, length]);
    box(s, [dx * far, msg / 2, dz * far], [msg, msg, msg]); // rests on the ring's ground plane
  }
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.cylinders.length, 1);
  assert.equal(s.primitiveCounts.box, 8);
  assert.equal(s.highlights.length, 1);
  // Everything stands on y = 0: ring base, rods and message cubes.
  const low = Math.min(...s.faces.flatMap(f => f.points.map(p => p[1])));
  assert(Math.abs(low) < 1e-9, `lowest point ${low}`);
}
