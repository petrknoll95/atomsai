const { Cam, fit, proj, rrect, hull, poly, mk, pointer, register, disposer, tween, tset, tval, tdone, reducedMotion } = HL;
function mount({stage, svg, read, animate=false, interactive=true}, value) {
  const bag = disposer(), C = Cam(45, .5, 1.65);
  fit(C, [[-72,-47,-8],[-72,47,-8],[72,-47,-8],[72,47,-8],[-72,-47,76],[72,47,76]], 200, 154);
  const P = proj(C), g = mk('g', {}, svg);
  const frame = rrect(-39,0,39,56,13,20);
  const shell = rrect(-47,-8,47,64,18,24);
  // Open frames inside an open cage: all crossings stay visible, with no filled faces.
  const ends = [-72,72].flatMap(x => shell.map(q => P(x,q.u,q.v)));
  mk('path', {class:'nf sil',d:poly(hull(ends))}, g);
  const parts = Array.from({length:7},(_,i) => ({
    x:-72+i*24, path:mk('path',{class:'nf sil'},g), tw:tween(0), last:NaN,
  }));
  let lift=value, active=-1;
  function draw(part, offset) {
    if(part.last===offset)return;
    part.last=offset;
    part.path.setAttribute('d',poly(frame.map(q=>P(part.x,q.u,q.v+offset))));
  }
  let elapsed=0;
  const loop=register(stage,(dt,now)=>{
    const ambient=animate&&!reducedMotion();
    if(ambient)elapsed+=Math.min(dt,.05);
    let moving=false;
    parts.forEach((part,i)=>{
      const wave=ambient ? 6*(.5-.5*Math.cos(elapsed*Math.PI/3-i*.55))*Math.min(elapsed,1) : 0;
      draw(part,tval(part.tw,now)+wave);
      moving ||= !tdone(part.tw,now);
    });
    return moving||ambient;
  });
  bag.add(loop.unregister);
  function choose(index) {
    if(index===active)return;
    const from=index<0?active:index;active=index;
    parts.forEach((part,i)=>{
      const distance=Math.abs(i-index);
      tset(part.tw,index<0?0:lift*(distance===0?1:distance===1?.25:0),performance.now(),Math.abs(i-from)*40);
      part.path.classList.toggle('hi',i===(index<0?3:index));
    });
    read.textContent=index<0?'rest':`layer ${index+1}`;loop.wake();
  }
  // Choose against the fixed upper edges, never against an animated frame.
  const hit=([x,y])=>{
    let nearest=-1,d=34;
    parts.forEach((part,i)=>{const at=P(part.x,0,56),distance=Math.hypot(x-at[0],y-at[1]);if(distance<d){nearest=i;d=distance;}});
    return nearest;
  };
  parts.forEach(part=>draw(part,0));parts[3].path.classList.add('hi');read.textContent='rest';
  if(interactive)bag.add(pointer(stage,{move:p=>choose(hit(p)),leave:()=>choose(-1)}));
  bag.add(()=>svg.replaceChildren());
  return {set:v=>{lift=v;const previous=active;active=-2;choose(previous);},destroy:bag.dispose};
}
hairline({name:'server-modules',means:'Seven rounded open frames form a layered infrastructure; the chosen layer rises and its neighbours follow gently.',rules:[1,2,3,7,8],range:[4,7,10],mount});
