export const title = 'Railed platform';
export const reference = 'filtering';
// A highlighted platform guarded on three sides; the front edge stays open.
const S = 140, POST = 46;
export default function ({ scene, plane, stroke, X, Z }) {
  const s = scene();
  plane(s, [0, 0, 0], X, Z, S, S, true);
  const h = S / 2, steps = [-h, 0, h];
  // Rails run along back (z=-h), left (x=-h) and right (x=h) edges.
  const path = [[-h, -h + 0, h], [-h, 0, -h], [h, 0, -h], [h, 0, h]].map(([x, , z]) => [x, z]);
  const posts = new Set();
  for (const t of steps) { posts.add(`${-h},${t}`); posts.add(`${h},${t}`); posts.add(`${t},${-h}`); }
  for (const key of posts) { const [x, z] = key.split(',').map(Number); stroke(s, [[x, 0, z], [x, POST, z]]); }
  for (const y of [POST / 2, POST]) stroke(s, path.map(([x, z]) => [x, y, z]));
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.highlights.length, 1);
  assert.equal(s.lines.filter(l => l.points.length === 2).length, 7);
}
