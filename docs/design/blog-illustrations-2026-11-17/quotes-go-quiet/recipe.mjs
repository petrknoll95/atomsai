export const title = 'The follow-up returns to its starting point';
export const reference = 'modular';
const outer=70,inner=40,start=70,turn=-80,innerTurn=-50,halfThickness=12;
// One concave, extruded hairpin: the two arms and the turn share one manifold
// shell. This is not three intersecting beams, and has no hidden internal faces.
const outline=[[-outer,start],[-outer,turn],[outer,turn],[outer,start],[inner,start],[inner,innerTurn],[-inner,innerTurn],[-inner,start]];
export default function({scene,stroke,unit,sub,cross}) {
  const s=scene();s.hiddenLines='omit';
  const owner='continuous-return-path';
  const upper=outline.map(([x,z])=>[x,halfThickness,z]);
  const lower=outline.map(([x,z])=>[x,-halfThickness,z]);
  const faces=[{points:upper,normal:[0,1,0]},{points:[...lower].reverse(),normal:[0,-1,0]}];
  for(let i=0;i<outline.length;i++) {
    const j=(i+1)%outline.length;
    const points=[upper[i],lower[i],lower[j],upper[j]];
    const normal=unit(cross(sub(points[2],points[0]),sub(points[1],points[0])));
    faces.push({points,normal});
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
  // Return arm shares the exact top surface; no duplicate plane or seam.
  s.highlights.push({points:[[inner,halfThickness,innerTurn],[outer,halfThickness,innerTurn],[outer,halfThickness,start],[inner,halfThickness,start]],normal:[0,1,0],kind:'diamond',gradient:[]});
  return s;
}
export function verify(s,{sub},assert) {
  assert.equal(s.hiddenLines,'omit');assert.equal(s.highlights.length,1);
  assert.equal(s.faces.length,10,'Eight walls plus one continuous top and bottom');
  assert.equal(outer-inner,innerTurn-turn,'Both arms and returning turn have equal width');
  assert(halfThickness>0 && inner>0 && start>innerTurn);
  const uses=new Map();
  for(const face of s.faces) for(let i=0;i<face.points.length;i++) {
    const key=[face.points[i].join(','),face.points[(i+1)%face.points.length].join(',')].sort().join('|');
    uses.set(key,(uses.get(key)??0)+1);
  }
  assert([...uses.values()].every(n=>n===2),'Every edge belongs to two faces; no open joints or internal duplicate surfaces');
  assert.equal(s.lines.length,24,'Only real structural boundary edges');
  assert(s.highlights[0].points.every(p=>p[1]===halfThickness && p[0]>=inner && p[0]<=outer && p[2]>=innerTurn && p[2]<=start));
  assert.deepEqual(outline[0][1],outline[3][1],'Departure and return meet the same baseline');
}
