export const title = 'First response on a shared track';
export const reference = 'orbit';
const trackRadius = 86, beadRadius = 20;
const rootHalf = Math.SQRT1_2;
// A real vertical circular rail. Its world-space axes are orthogonal; it is not
// a screen-space ellipse. All three equal spheres share the same physical rail.
const u = [rootHalf, 0, -rootHalf], v = [0, 1, 0];
const degrees = value => value * Math.PI / 180;
const at = angle => u.map((component, i) => trackRadius * (component * Math.cos(degrees(angle)) + v[i] * Math.sin(degrees(angle))));
const positions = [-112, -55, 92];
const axes = [[beadRadius,0,0],[0,beadRadius,0],[0,0,beadRadius]];
export default function ({ scene, stroke, arrow, ellipsoid, cross }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const start = -150, shaftStart = 137, finish = 146;
  stroke(s, Array.from({length:193}, (_,i) => at(start + (shaftStart-start) * i / 192)));
  arrow(s, at(shaftStart), at(finish), 9, cross(u,v));
  positions.forEach((angle, i) => ellipsoid(s, at(angle), axes, { highlight: i === 2 }));
  return s;
}
export function verify(s, { dot, sub, cross }, assert) {
  const close = (actual, expected) => assert(Math.abs(actual-expected) < 1e-7);
  const normal = cross(u,v);
  close(dot(u,v), 0);
  close(Math.hypot(...u), 1);
  close(Math.hypot(...v), 1);
  assert.equal(s.contours.length, 3);
  assert.equal(s.primitiveCounts.sphere, 3);
  assert.equal(s.contours.filter(part=>part.highlight).length, 1);
  assert.equal(s.hiddenLines, 'omit');
  for (const part of s.contours) {
    close(Math.hypot(...part.center), trackRadius);
    close(dot(part.center,normal), 0);
    for(const axis of part.axes) close(Math.hypot(...axis), beadRadius);
    close(dot(part.axes[0],part.axes[1]), 0);
  }
  for(let a=0;a<3;a++) for(let b=a+1;b<3;b++) {
    assert(Math.hypot(...sub(s.contours[a].center,s.contours[b].center)) > beadRadius*2, 'Competitors must remain separate');
  }
  // The lead has progressed farther than both waiting responses on one arc.
  assert(positions[2]-positions[1] > positions[1]-positions[0]);
  assert.equal(s.primitiveCounts.box ?? 0, 0);
  assert.equal(s.cylinders.length, 0);
}
