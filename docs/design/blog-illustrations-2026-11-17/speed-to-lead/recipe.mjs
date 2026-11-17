export const title = 'One response gets ahead';
export const reference = 'modular';
const size = 45;
// Three companies have equal dimensions. One advances along the physical diagonal;
// the others remain on the same starting line, spaced symmetrically across it.
const f = Math.SQRT1_2;
const forward = [f, 0, -f], across = [f, 0, f];
const place = (progress, lane) => forward.map((v,i) => v * progress + across[i] * lane);
const centers = [place(-30,-90), place(65,0), place(-30,90)];
export default function ({ scene, box }) {
  const s = scene();
  centers.forEach((center, i) => box(s, center, [size, size, size], { highlight: i === 1 }));
  return s;
}
export function verify(s, { sub, dot }, assert) {
  const close = (a,b) => assert(Math.abs(a-b) < 1e-7);
  assert.equal(s.primitiveCounts.box, 3);
  assert.equal(s.faces.length, 18);
  assert.equal(s.highlights.length, 1);
  for (const { points:p } of s.faces) {
    close(Math.hypot(...sub(p[1], p[0])), size);
    close(Math.hypot(...sub(p[3], p[0])), size);
  }
  close(dot(centers[0],forward), dot(centers[2],forward));
  close(dot(centers[0],across), -dot(centers[2],across));
  assert(dot(sub(centers[1],centers[0]),forward) > size);
  for (let a=0;a<centers.length;a++) for(let b=a+1;b<centers.length;b++) {
    assert(centers[a].some((v,i) => Math.abs(v-centers[b][i]) > size), 'Cubes must not intersect');
  }
}
