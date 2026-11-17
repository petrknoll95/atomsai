export const title = 'Agreement and deviation';
export const reference = 'built-in-your-stack';

const width = 32, height = 104, depth = 20;
const surfaceY = -51;
const lean = 24 * Math.PI / 180;
const positions = [-52, 0, 52];
const support = [positions[2] + width / 2, surfaceY, 0];
export default function (api) {
  const { scene, box, add, sub, around, transformScene, Z } = api;
  const s = scene();
  s.hiddenLines = 'omit';
  // A complete thin datum slab establishes one common physical reference plane.
  box(s, [0, surfaceY - 3, 0], [188, 6, 64]);
  for (const x of positions.slice(0, 2)) box(s, [x, surfaceY + height / 2, 0], [width, height, depth]);
  const outlier = scene();
  const blade = box(outlier, [positions[2], surfaceY + height / 2, 0], [width, height, depth]);
  const top = blade.faces.find(f => f.normal[1] > .99);
  outlier.highlights.push({ points: top.points, normal: top.normal, kind: 'diamond', gradient: [] });
  // Rotate about the outer lower edge, not the bottom center: no corner enters the datum.
  transformScene(outlier, p => add(support, around(sub(p, support), Z, -lean)), v => around(v, Z, -lean));
  for (const key of ['lines', 'faces', 'highlights', 'contours', 'cylinders', 'arrows', 'dots']) s[key].push(...outlier[key]);
  s.primitiveCounts.box += outlier.primitiveCounts.box;
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.primitiveCounts.box, 4);
  assert.equal(s.faces.length, 24);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
  const close = (a, b) => Math.abs(a - b) < 1e-8;
  const owners = [...new Set(s.faces.map(f => f.owner))];
  const parts = owners.map(owner => {
    const faces = s.faces.filter(f => f.owner === owner);
    const vertices = [...new Map(faces.flatMap(f => f.points).map(p => [p.map(v => v.toFixed(8)).join(','), p])).values()];
    assert.equal(vertices.length, 8);
    return { owner, faces, vertices, minX: Math.min(...vertices.map(p => p[0])), maxX: Math.max(...vertices.map(p => p[0])), minY: Math.min(...vertices.map(p => p[1])), maxY: Math.max(...vertices.map(p => p[1])) };
  });
  const base = parts.find(p => close(p.maxY, surfaceY) && close(p.maxY - p.minY, 6));
  assert(base);
  const blades = parts.filter(p => p !== base).sort((a, b) => a.minX - b.minX);
  assert.equal(blades.length, 3);
  for (const blade of blades) {
    assert(close(blade.minY, surfaceY), 'Every blade contacts the datum at its base.');
    assert(blade.vertices.every(p => p[1] >= surfaceY - 1e-8), 'No blade corner enters the reference slab.');
    const lengths = blade.faces.flatMap(f => f.points.map((p, i) => Math.hypot(...sub(p, f.points[(i + 1) % 4]))));
    assert(lengths.every(n => [width, height, depth].some(expected => close(n, expected))), 'All three specimens have identical true dimensions.');
  }
  assert(close(blades[0].maxY, surfaceY + height));
  assert(close(blades[1].maxY, surfaceY + height));
  assert(blades[1].minX - blades[0].maxX >= 20);
  assert(blades[2].minX - blades[1].maxX > 22);
  const contacts = blades[2].vertices.filter(p => close(p[1], surfaceY));
  assert.equal(contacts.length, 2);
  for (const p of contacts) assert(close(p[0], support[0]) && close(Math.abs(p[2]), depth / 2));
  assert(blades[2].maxX > positions[2] + width / 2 + 40, 'The outlier visibly leans outward.');
  const highlight = s.highlights[0];
  assert(close(highlight.normal[0], Math.sin(lean)) && close(highlight.normal[1], Math.cos(lean)));
  // All sibling solids lie behind this exposed end face, so none can cover its fill.
  for (const part of [base, blades[0], blades[1]]) for (const p of part.vertices) assert(dot(sub(p, highlight.points[0]), highlight.normal) < -20);
}
