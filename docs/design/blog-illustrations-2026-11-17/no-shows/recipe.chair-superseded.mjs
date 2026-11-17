export const title = 'The empty appointment chair';
export const reference = 'modular';
const seatWidth=110, seatDepth=100, seatThickness=8;
const postWidth=9, floor=-84, legX=45, frontZ=39, backZ=-39;
const backTop=92, railHeight=9;
export default function ({scene,box}) {
  const s=scene();s.hiddenLines='omit';
  box(s,[0,0,0],[seatWidth,seatThickness,seatDepth]);
  // Rear legs continue into the back posts; the upper back rail joins their tops.
  // This real open frame keeps the empty seat visible from either side.
  const railBottom=backTop-railHeight;
  for(const x of [-legX,legX]) {
    box(s,[x,(floor-seatThickness/2)/2,frontZ],[postWidth,-seatThickness/2-floor,postWidth]);
    box(s,[x,(floor+railBottom)/2,backZ],[postWidth,railBottom-floor,postWidth]);
  }
  box(s,[0,backTop-railHeight/2,backZ],[legX*2+postWidth,railHeight,postWidth]);
  const y=seatThickness/2, backFront=backZ+postWidth/2;
  s.highlights.push({
    points:[[-seatWidth/2,y,backFront],[seatWidth/2,y,backFront],[seatWidth/2,y,seatDepth/2],[-seatWidth/2,y,seatDepth/2]],
    normal:[0,1,0],kind:'diamond',gradient:[],
  });
  return s;
}
export function verify(s,{sub},assert) {
  assert.equal(s.hiddenLines,'omit');assert.equal(s.primitiveCounts.box,6);
  assert.equal(s.faces.length,36);assert.equal(s.highlights.length,1);
  const points=faces=>faces.flatMap(f=>f.points);
  const solids=Array.from({length:6},(_,i)=>points(s.faces.slice(i*6,i*6+6)));
  for(const i of [1,2,3,4]) assert.equal(Math.min(...solids[i].map(p=>p[1])),floor,'Four feet share the floor');
  for(const i of [1,3]) assert.equal(Math.max(...solids[i].map(p=>p[1])),-seatThickness/2,'Front legs attach under the seat');
  const railBottom=Math.min(...solids[5].map(p=>p[1]));
  for(const i of [2,4]) {
    assert.equal(Math.max(...solids[i].map(p=>p[1])),railBottom,'Rear posts meet the back rail');
    assert(Math.min(...solids[i].map(p=>p[1]))<0 && Math.max(...solids[i].map(p=>p[1]))>0,'Rear posts form real mortised seat joints');
  }
  assert(legX+postWidth/2<seatWidth/2 && frontZ+postWidth/2<seatDepth/2);
  assert(s.highlights[0].points.every(p=>p[1]===seatThickness/2));
}
