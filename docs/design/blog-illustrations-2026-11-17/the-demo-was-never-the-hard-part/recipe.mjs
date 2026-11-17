export const title = 'The work between systems';
export const reference = 'built-in-your-stack';

// Two complete systems share a fitted bridge: the integration is the focal part.
const blockSize = [70, 86, 70];
const gap = 66;
const bridgeSize = [gap, 18, 36];
const centers = [[-(gap + blockSize[0]) / 2, 0, 0], [(gap + blockSize[0]) / 2, 0, 0]];
const bridgeCenter = [0, 34, 0];
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  for (const center of centers) box(s, center, blockSize);
  const bridge = box(s, bridgeCenter, bridgeSize);
  const top = bridge.faces.find(face => face.normal[1] > .99);
  s.highlights.push({ points: top.points, normal: top.normal, kind: 'diamond', gradient: [] });
  return s;
}
export function verify(s, { sub, dot }, assert) {
  assert.equal(s.primitiveCounts.box, 3);
  assert.equal(s.faces.length, 18);
  assert.equal(s.highlights.length, 1);
  assert.equal(s.hiddenLines, 'omit');
  // Both bridge ends meet the receiving system face exactly, with no overlap.
  assert.equal(centers[0][0] + blockSize[0] / 2, bridgeCenter[0] - bridgeSize[0] / 2);
  assert.equal(centers[1][0] - blockSize[0] / 2, bridgeCenter[0] + bridgeSize[0] / 2);
  assert(bridgeSize[2] < blockSize[2]);
  assert.equal(bridgeCenter[1] + bridgeSize[1] / 2, blockSize[1] / 2);
  const p = s.highlights[0].points;
  assert.equal(dot(sub(p[1], p[0]), sub(p[3], p[0])), 0);
  assert.equal(Math.min(...p.map(v => v[0])), -gap / 2);
  assert.equal(Math.max(...p.map(v => v[0])), gap / 2);
  assert(p.every(v => v[1] === 43));
}
