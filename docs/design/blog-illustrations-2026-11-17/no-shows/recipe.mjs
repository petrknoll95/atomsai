export const title = 'A reserved place remains empty';
export const reference = 'modular';
const baseWidth=192,baseDepth=110,baseHeight=24,occupiedWidth=44,occupiedHeight=28;
const top=baseHeight/2;
const endCenter=(baseWidth-occupiedWidth)/2;
const gap=baseWidth-2*occupiedWidth;
const reservedWidth=32,reservedDepth=96;
export default function({scene,box}) {
  const s=scene();s.hiddenLines='omit';
  box(s,[0,0,0],[baseWidth,baseHeight,baseDepth]);
  for(const x of [-endCenter,endCenter]) {
    box(s,[x,top+occupiedHeight/2,0],[occupiedWidth,occupiedHeight,baseDepth]);
  }
  // The center is genuinely vacant. Its reserved floor is part of the plinth,
  // not a floating tile or a separate object. A clear margin prevents the raised
  // ends from covering this focal region in the approved inspection views.
  s.highlights.push({points:[[-reservedWidth/2,top,-reservedDepth/2],[reservedWidth/2,top,-reservedDepth/2],[reservedWidth/2,top,reservedDepth/2],[-reservedWidth/2,top,reservedDepth/2]],normal:[0,1,0],kind:'diamond',gradient:[]});
  return s;
}
export function verify(s,{sub},assert) {
  assert.equal(s.hiddenLines,'omit');assert.equal(s.primitiveCounts.box,3);
  assert.equal(s.faces.length,18);assert.equal(s.highlights.length,1);
  const parts=Array.from({length:3},(_,i)=>s.faces.slice(i*6,i*6+6).flatMap(f=>f.points));
  for(const p of parts.slice(1)) {
    assert.equal(Math.min(...p.map(v=>v[1])),top,'Occupied ends sit directly on the plinth');
    assert.equal(Math.max(...p.map(v=>v[1])),top+occupiedHeight);
  }
  assert.equal(Math.max(...parts[1].map(v=>v[0])),-gap/2);
  assert.equal(Math.min(...parts[2].map(v=>v[0])),gap/2);
  assert(gap>occupiedWidth*2,'The vacant bay is unmistakably larger than either occupied end');
  assert(reservedWidth<gap && reservedDepth<baseDepth);
  assert((gap-reservedWidth)/2>occupiedHeight*Math.sqrt(1.5),'Focal floor clears the raised ends in the neutral and reverse orthographic views');
  assert(s.highlights[0].points.every(p=>p[1]===top && Math.abs(p[0])<gap/2 && Math.abs(p[2])<baseDepth/2));
  assert.equal(s.contours.length+s.cylinders.length+s.arrows.length,0);
}
