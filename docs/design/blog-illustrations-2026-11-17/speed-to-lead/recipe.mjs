export const title = 'One response reaches farther ahead';
export const reference = 'modular';
const width=24,thickness=18,start=74;
const inclination=25*Math.PI/180;
const lanes=[{x:-58,end:-18},{x:0,end:-18},{x:58,end:-96}];
export default function({scene,box,transformScene,around,X}) {
  const s=scene();s.hiddenLines='omit';
  for(const lane of lanes) {
    box(s,[lane.x,0,(start+lane.end)/2],[width,thickness,start-lane.end]);
  }
  const lead=lanes[2];
  s.highlights.push({points:[[lead.x-width/2,thickness/2,lead.end],[lead.x+width/2,thickness/2,lead.end],[lead.x+width/2,thickness/2,-42],[lead.x-width/2,thickness/2,-42]],normal:[0,1,0],kind:'diamond',gradient:[]});
  // One rigid model pose makes the shared paths legible within a square frame.
  transformScene(s,p=>around(p,X,inclination),v=>around(v,X,inclination));
  return s;
}
export function verify(s,{sub,around,X},assert) {
  assert.equal(s.hiddenLines,'omit');assert.equal(s.primitiveCounts.box,3);
  assert.equal(s.faces.length,18);assert.equal(s.highlights.length,1);
  const parts=Array.from({length:3},(_,i)=>s.faces.slice(i*6,i*6+6).flatMap(f=>f.points).map(p=>around(p,X,-inclination)));
  for(const points of parts) {
    assert(Math.abs(Math.max(...points.map(p=>p[2]))-start)<1e-7,'All three paths share the true departure baseline');
    assert(Math.abs(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))-width)<1e-7);
    assert(Math.abs(Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))-thickness)<1e-7);
    assert(Math.abs(Math.min(...points.map(p=>p[1]))+thickness/2)<1e-7,'All paths share one support plane');
  }
  assert.equal(lanes[0].end,lanes[1].end,'Two responses stop together');
  assert(lanes[2].end<lanes[0].end-width*3,'The leading response advances decisively');
  for(let i=1;i<lanes.length;i++) assert(lanes[i].x-lanes[i-1].x-width>=34,'Parallel paths retain a broad real gap');
  assert(s.highlights[0].points.map(p=>around(p,X,-inclination)).every(p=>Math.abs(p[1]-thickness/2)<1e-7 && p[0]>=lanes[2].x-width/2 && p[0]<=lanes[2].x+width/2 && p[2]<lanes[0].end),'Only the genuinely advanced part carries the highlight');
}
