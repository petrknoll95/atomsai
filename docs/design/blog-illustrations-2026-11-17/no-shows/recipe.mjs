export const title = 'The missing place in a complete pattern';
export const reference = 'modular';

const tileWidth = 40, tileDepth = 40, thickness = 9;
const pitch = 49;
const displacedCenter = [116, 0, 5];
const displacedAngle = 18 * Math.PI / 180;
const grid = [];
for (const x of [-pitch, 0, pitch]) for (const z of [-pitch, 0, pitch]) if (x !== 0 || z !== 0) grid.push([x, 0, z]);
export default function (api) {
  const { scene, box, add, sub, around, transformScene, Y } = api;
  const s = scene();
  s.hiddenLines = 'omit';
  // Eight identical solids establish a regular three-by-three pattern with a true empty center.
  // There is no backing board or colored surface beneath the missing place.
  for (const center of grid) box(s, center, [tileWidth, thickness, tileDepth]);
  const loose = scene();
  const tile = box(loose, displacedCenter, [tileWidth, thickness, tileDepth]);
  const top = tile.faces.find(f => f.normal[1] > .99);
  loose.highlights.push({ points: top.points, normal: top.normal, kind: 'diamond', gradient: [] });
  // One matching piece is clearly outside the grid and slightly turned, still in the same plane.
  transformScene(loose, p => add(displacedCenter, around(sub(p, displacedCenter), Y, displacedAngle)), v => around(v, Y, displacedAngle));
  for (const key of ['lines', 'faces', 'highlights', 'contours', 'cylinders', 'arrows', 'dots']) s[key].push(...loose[key]);
  s.primitiveCounts.box += loose.primitiveCounts.box;
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.primitiveCounts.box, 9);
  assert.equal(s.faces.length, 54);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
  const close = (a, b) => Math.abs(a - b) < 1e-8;
  const owners = [...new Set(s.faces.map(f => f.owner))];
  const parts = owners.map(owner => {
    const faces = s.faces.filter(f => f.owner === owner);
    const vertices = [...new Map(faces.flatMap(f => f.points).map(p => [p.map(v => v.toFixed(8)).join(','), p])).values()];
    assert.equal(vertices.length, 8);
    const center = [0, 1, 2].map(axis => vertices.reduce((n, p) => n + p[axis], 0) / 8);
    const lengths = faces.flatMap(f => f.points.map((p, i) => Math.hypot(...sub(p, f.points[(i + 1) % 4]))));
    assert(lengths.every(n => [tileWidth, thickness, tileDepth].some(expected => close(n, expected))), 'Every piece has identical true dimensions.');
    assert(vertices.every(p => close(Math.abs(p[1]), thickness / 2)), 'All nine pieces share one real plane.');
    return { center, vertices, faces };
  });
  const inGrid = parts.filter(p => p.center[0] < 80);
  assert.equal(inGrid.length, 8);
  assert(!inGrid.some(p => close(p.center[0], 0) && close(p.center[2], 0)), 'The center position is genuinely absent.');
  for (const center of grid) assert(inGrid.some(p => close(p.center[0], center[0]) && close(p.center[2], center[2])));
  assert.equal(pitch - tileWidth, 9, 'Regular broad gaps remain between neighboring tiles.');
  // No face, solid or ground plane fills the missing center; the entire matching tile fits there.
  for (const p of inGrid) for (const v of p.vertices) assert(Math.abs(v[0]) >= pitch - tileWidth / 2 || Math.abs(v[2]) >= pitch - tileDepth / 2);
  const loose = parts.find(p => p.center[0] > 80);
  assert(loose && close(loose.center[0], displacedCenter[0]) && close(loose.center[2], displacedCenter[2]));
  const gridRight = Math.max(...inGrid.flatMap(p => p.vertices.map(v => v[0])));
  const looseLeft = Math.min(...loose.vertices.map(v => v[0]));
  assert(looseLeft - gridRight > 20, 'The displaced piece cannot touch or overlap the regular grid.');
  const highlight = s.highlights[0];
  assert(highlight.points.every(p => close(p[1], thickness / 2)));
  // Every other surface is coplanar with or behind the exposed top face: no fill-through.
  for (const p of parts) for (const v of p.vertices) assert(dot(sub(v, highlight.points[0]), highlight.normal) <= 1e-8);
}
