export const title = 'A signal settles into silence';
export const reference = 'modular';
const trace=[[-100,0],[-72,56],[-44,-35],[-17,21],[7,-11],[30,4],[50,0],[96,0]];
const halfBand=11,halfDepth=11;
const k=Math.SQRT1_2;
// A vertical physical waveform plane, with its depth orthogonal to both axes.
const u=[k,0,-k],v=[0,1,0],n=[k,0,k];
const point=(x,y,z)=>u.map((a,i)=>a*x+v[i]*y+n[i]*z);
const boundary=[...trace.map(([x,y])=>[x,y+halfBand]),...trace.toReversed().map(([x,y])=>[x,y-halfBand])];
export default function({scene,stroke,unit,sub,cross}) {
  const s=scene();s.hiddenLines='omit';
  const owner='damped-signal';
  const front=boundary.map(([x,y])=>point(x,y,halfDepth));
  const back=boundary.map(([x,y])=>point(x,y,-halfDepth));
  const faces=[{points:front,normal:n},{points:[...back].reverse(),normal:n.map(c=>-c)}];
  for(let i=0;i<boundary.length;i++) {
    const j=(i+1)%boundary.length;
    const points=[front[i],back[i],back[j],front[j]];
    faces.push({points,normal:unit(cross(sub(points[2],points[0]),sub(points[1],points[0])))});
  }
  const edges=new Map();
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
  // The first rising face is focal; all later pulses diminish by geometry alone.
  // The highlighted region is a subset of the foremost physical ribbon face.
  const pulse=trace.slice(0,2);
  const highlight=[...pulse.map(([x,y])=>point(x,y+halfBand,halfDepth)),...pulse.toReversed().map(([x,y])=>point(x,y-halfBand,halfDepth))];
  s.highlights.push({points:highlight,normal:n,kind:'diamond',gradient:[]});
  return s;
}
export function verify(s,{dot,sub},assert) {
  const close=(a,b)=>assert(Math.abs(a-b)<1e-7);
  assert.equal(s.hiddenLines,'omit');assert.equal(s.highlights.length,1);
  assert.equal(s.highlights[0].points.length,4,'One four-sided physical rising face receives the highlight');
  close(dot(u,v),0);close(dot(u,n),0);close(dot(v,n),0);
  close(Math.hypot(...u),1);close(Math.hypot(...v),1);close(Math.hypot(...n),1);
  assert.equal(s.faces.length,boundary.length+2);
  for(let i=1;i<trace.length;i++) assert(trace[i][0]>trace[i-1][0],'Signal has no self-crossing or backwards segment');
  const amplitudes=trace.slice(1,-2).map(p=>Math.abs(p[1]));
  for(let i=1;i<amplitudes.length;i++) assert(amplitudes[i]<amplitudes[i-1],'Each pulse diminishes');
  assert.equal(trace.at(-1)[1],0);assert.equal(trace.at(-2)[1],0);
  assert(trace.at(-1)[0]-trace.at(-2)[0]>=40,'Silence has a clear flat tail');
  const uses=new Map();
  for(const face of s.faces) for(let i=0;i<face.points.length;i++) {
    const key=[face.points[i].join(','),face.points[(i+1)%face.points.length].join(',')].sort().join('|');
    uses.set(key,(uses.get(key)??0)+1);
  }
  assert([...uses.values()].every(count=>count===2),'One closed manifold ribbon without internal faces or detached joins');
  assert.equal(s.lines.length,boundary.length*3,'Only actual front, back and fold boundary edges');
  for(const p of s.highlights[0].points) close(dot(p,n),halfDepth);
  assert.equal(s.contours.length+s.cylinders.length+s.arrows.length,0);
}
