export const title = 'A homeowner gets an immediate reply';
export const reference = 'modular';
const left=-68,right=32,floor=-60,eaves=30,ridgeX=-18,ridgeY=82,front=42.5,back=-42.5;
const messageCenter=[110,78,0],messageSize=[52,36,5];
export default function ({scene,box,stroke,curve,arrow,unit}) {
  const s=scene();s.hiddenLines='omit';
  const A=[left,floor,front],B=[right,floor,front],C=[right,eaves,front],D=[ridgeX,ridgeY,front],E=[left,eaves,front];
  const a=[left,floor,back],b=[right,floor,back],c=[right,eaves,back],d=[ridgeX,ridgeY,back],e=[left,eaves,back];
  const roofRise=ridgeY-eaves,halfWidth=(right-left)/2;
  const faces=[
    {points:[A,B,C,D,E],normal:[0,0,1]},
    {points:[b,a,e,d,c],normal:[0,0,-1]},
    {points:[a,A,E,e],normal:[-1,0,0]},
    {points:[B,b,c,C],normal:[1,0,0]},
    {points:[E,D,d,e],normal:unit([-roofRise,halfWidth,0])},
    {points:[D,C,c,d],normal:unit([roofRise,halfWidth,0])},
    {points:[a,b,B,A],normal:[0,-1,0]},
  ];
  const owner='gabled-house',edges=new Map();
  for(const face of faces) {
    s.faces.push({points:face.points,owner});
    for(let i=0;i<face.points.length;i++) {
      const p=face.points[i],q=face.points[(i+1)%face.points.length];
      const key=[p.join(','),q.join(',')].sort().join('|');
      if(!edges.has(key)) edges.set(key,{points:[p,q],normals:[]});
      edges.get(key).normals.push(face.normal);
    }
  }
  for(const edge of edges.values()) stroke(s,edge.points,{owner,normals:edge.normals});
  // A real shallow door panel attaches to the front wall and meets the floor.
  box(s,[ridgeX,floor+23,front+1],[27,46,2]);
  const envelope=box(s,messageCenter,messageSize);
  const face=envelope.faces.find(f=>f.normal[2]>.99);
  s.highlights.push({points:face.points,normal:face.normal,kind:'diamond',gradient:[]});
  const x=messageCenter[0],y=messageCenter[1],z=messageSize[2]/2;
  stroke(s,[[x-26,y+18,z],[x,y-2,z],[x+26,y+18,z]],{normals:[[0,0,1]],owner:envelope.owner});
  // The reply leaves the envelope and connects directly to the home's side wall.
  const start=[x-26,y-18,z],end=[44,10,15];
  curve(s,start,[72,31,z],[60,10,15],end);
  arrow(s,end,[right,10,15],8,[0,0,1]);
  return s;
}
export function verify(s,{sub,dot},assert) {
  assert.equal(s.hiddenLines,'omit');assert.equal(s.highlights.length,1);
  const house=s.faces.filter(f=>f.owner==='gabled-house');
  assert.equal(house.length,7,'A complete pentagonal prism has two gables, two walls, two roof slopes and a floor');
  assert.equal(ridgeX,(left+right)/2,'Ridge is centered between side walls');
  assert(ridgeY>eaves && eaves>floor && front>back);
  assert(house.every(f=>f.points.length>=4));
  // Every shell edge belongs to exactly two surfaces: no open seams or loose roof.
  const uses=new Map();
  for(const face of house) for(let i=0;i<face.points.length;i++) {
    const key=[face.points[i].join(','),face.points[(i+1)%face.points.length].join(',')].sort().join('|');
    uses.set(key,(uses.get(key)??0)+1);
  }
  assert([...uses.values()].every(n=>n===2));
  const door=s.faces.slice(7,13).flatMap(f=>f.points);
  assert.equal(Math.min(...door.map(p=>p[1])),floor);
  assert.equal(Math.min(...door.map(p=>p[2])),front,'Door is attached to front wall');
  assert(messageCenter[0]-messageSize[0]/2>right,'Message is separate from the house');
  const connector=s.lines.find(l=>l.points.length===81);
  assert.deepEqual(connector.points[0],[84,60,2.5]);
  assert.deepEqual(connector.points.at(-1),[44,10,15]);
  assert(s.lines.some(l=>l.points.length===2 && l.points[0].every((v,i)=>v===[44,10,15][i]) && l.points[1].every((v,i)=>v===[right,10,15][i])),'Arrow meets the receiving wall');
}
