export const title = 'An open quote awaits a reply';
export const reference = 'modular';
const halfWidth = 70, bottom = -50, mouth = 30, front = 8, back = -8;
const docHalfWidth = 53, docBottom = -10, docTop = 95;
export default function ({ scene, plane, stroke, X, Y }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const owner = 'envelope-pocket';
  const A=[-halfWidth,bottom,front], B=[halfWidth,bottom,front], C=[halfWidth,mouth,front], D=[-halfWidth,mouth,front];
  const a=[-halfWidth,bottom,back], b=[halfWidth,bottom,back], c=[halfWidth,mouth,back], d=[-halfWidth,mouth,back];
  const surfaces = [
    {points:[A,B,C,D], normal:[0,0,1]},
    {points:[b,a,d,c], normal:[0,0,-1]},
    {points:[a,A,D,d], normal:[-1,0,0]},
    {points:[B,b,c,C], normal:[1,0,0]},
    {points:[a,b,B,A], normal:[0,-1,0]},
  ];
  for (const face of surfaces) s.faces.push({points:face.points, owner});
  const edges = new Map();
  for(const face of surfaces) for(let i=0;i<face.points.length;i++) {
    const p=face.points[i], q=face.points[(i+1)%face.points.length];
    const key=[p.join(','),q.join(',')].sort().join('|');
    if(!edges.has(key)) edges.set(key,{points:[p,q],normals:[]});
    edges.get(key).normals.push(face.normal);
  }
  for(const edge of edges.values()) stroke(s,edge.points,{owner,normals:edge.normals});
  // The opening has no top face. The real folded flap hinges to its back edge.
  const flapTip=[0,88,-38];
  s.faces.push({points:[d,c,flapTip],owner:'open-flap'});
  stroke(s,[d,flapTip,c],{owner:'open-flap'});
  // Two structural envelope fold seams meet on the front at a common point.
  stroke(s,[D,[0,-15,front],C],{owner,normals:[[0,0,1]]});
  const document = plane(s,[0,(docBottom+docTop)/2,0],X,Y,docHalfWidth*2,docTop-docBottom);
  // Only the exposed front of the document carries the focal color.
  s.highlights.push({points:[[-docHalfWidth,mouth,0],[docHalfWidth,mouth,0],[docHalfWidth,docTop,0],[-docHalfWidth,docTop,0]],normal:[0,0,1],kind:'diamond',gradient:[]});
  return s;
}
export function verify(s,{sub,dot},assert) {
  assert.equal(s.hiddenLines,'omit');
  assert.equal(s.highlights.length,1);
  const pocket=s.faces.filter(f=>f.owner==='envelope-pocket');
  assert.equal(pocket.length,5,'A pocket needs four sides and a bottom, with an open mouth');
  assert(!pocket.some(f=>f.points.every(p=>p[1]===mouth)),'No solid top may intersect the document');
  assert(docHalfWidth<halfWidth && docBottom>bottom && docBottom<mouth && docTop>mouth);
  assert(back<0 && front>0,'Document sits inside the pocket depth');
  const flap=s.faces.find(f=>f.owner==='open-flap');
  assert.equal(flap.points[0][1],mouth);assert.equal(flap.points[1][1],mouth);
  assert.equal(flap.points[0][2],back);assert.equal(flap.points[1][2],back);
  assert(flap.points[2][2]<back,'Open flap folds backwards around the true mouth hinge');
  const doc=s.faces.at(-1).points;
  assert.equal(Math.hypot(...sub(doc[1],doc[0])),docHalfWidth*2);
  assert.equal(dot(sub(doc[1],doc[0]),sub(doc[3],doc[0])),0);
}
