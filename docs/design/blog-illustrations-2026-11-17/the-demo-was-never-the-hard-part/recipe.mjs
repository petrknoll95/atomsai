export const title = 'Two parts, one system';
export const reference = 'modular';

const depth = 68;
const separation = 28;
// The same stepped boundary partitions one complete 152 × 80 assembly.
const mating = [[-10, -40], [-10, -12], [10, -12], [10, 12], [-10, 12], [-10, 40]];
const profiles = [
  [[-76, -40], ...mating, [-76, 40]],
  [mating[0], [76, -40], [76, 40], ...mating.slice(1).reverse()],
];
const pointKey = p => p.map(n => Math.round(n * 1e8) / 1e8).join(',');
const edgeKey = (a, b) => [pointKey(a), pointKey(b)].sort().join('|');
const area = p => p.reduce((v, a, i) => { const b = p[(i + 1) % p.length]; return v + a[0] * b[1] - b[0] * a[1]; }, 0) / 2;

function prism(s, profile, shift, owner, { stroke, unit }) {
  const front = profile.map(([x, y]) => [x + shift, y, depth / 2]);
  const back = profile.map(([x, y]) => [x + shift, y, -depth / 2]);
  const faces = [
    { points: front, normal: [0, 0, 1] },
    { points: [...back].reverse(), normal: [0, 0, -1] },
    ...profile.map((a, i) => {
      const j = (i + 1) % profile.length, b = profile[j];
      return { points: [front[i], back[i], back[j], front[j]], normal: unit([b[1] - a[1], a[0] - b[0], 0]) };
    }),
  ];
  const edges = new Map();
  for (const face of faces) {
    s.faces.push({ points: face.points, owner });
    for (let i = 0; i < face.points.length; i++) {
      const a = face.points[i], b = face.points[(i + 1) % face.points.length], key = edgeKey(a, b);
      if (!edges.has(key)) edges.set(key, { points: [a, b], normals: [] });
      edges.get(key).normals.push(face.normal);
    }
  }
  for (const edge of edges.values()) stroke(s, edge.points, { owner, normals: edge.normals });
  return faces;
}

export default function (api) {
  const s = api.scene();
  s.hiddenLines = 'omit';
  prism(s, profiles[0], -separation / 2, 1, api);
  const right = prism(s, profiles[1], separation / 2, 2, api);
  // This outward rectangular face cannot be covered by the other separated half.
  const exposed = right.find(f => f.normal[0] > .99 && f.points.every(p => p[0] === 90));
  s.highlights.push({ points: exposed.points, normal: exposed.normal, kind: 'diamond', gradient: [] });
  s.primitiveCounts['stepped-prism'] = 2;
  return s;
}
export function verify(s, { sub, cross, dot }, assert) {
  assert.equal(s.primitiveCounts['stepped-prism'], 2);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
  assert.equal(area(profiles[0]) + area(profiles[1]), 152 * 80);
  assert(profiles.every(p => area(p) > 0));
  assert.equal(s.faces.length, 20);
  const volumes = [];
  for (const owner of [1, 2]) {
    const faces = s.faces.filter(f => f.owner === owner);
    const edgeCounts = new Map();
    for (const face of faces) {
      const p = face.points, normal = cross(sub(p[1], p[0]), sub(p[2], p[0]));
      for (const point of p) assert(Math.abs(dot(sub(point, p[0]), normal)) < 1e-7);
      for (let i = 0; i < p.length; i++) {
        const key = edgeKey(p[i], p[(i + 1) % p.length]);
        edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
      }
    }
    assert([...edgeCounts.values()].every(n => n === 2), 'Closed manifold: each edge belongs to two faces.');
    assert.equal(s.lines.filter(l => l.owner === owner).length, edgeCounts.size);
    const points = faces.flatMap(f => f.points);
    assert.equal(Math.max(...points.map(p => p[2])) - Math.min(...points.map(p => p[2])), depth);
    volumes.push([Math.min(...points.map(p => p[0])), Math.max(...points.map(p => p[0]))]);
  }
  assert(volumes[1][0] - volumes[0][1] >= 8, 'Visible gap; no tangencies or intersections.');
  const leftBoundary = mating.map(([x, y]) => [x - separation / 2, y]);
  const rightBoundary = mating.map(([x, y]) => [x + separation / 2, y]);
  for (let i = 0; i < mating.length; i++) {
    assert.equal(rightBoundary[i][0] - leftBoundary[i][0], separation);
    assert.equal(rightBoundary[i][1], leftBoundary[i][1]);
  }
  assert(s.highlights[0].points.every(p => p[0] === 90));
}
