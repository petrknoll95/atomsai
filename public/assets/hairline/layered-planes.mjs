const HL = window.HL;
let figure;
const hairline = definition => { figure = definition; };
const { Cam, fit, proj, facing, rings, prism, solid, put, ringAt, poly, mk, clamp, pointer, register, disposer, tween, tset, tval, tdone } = HL;
function mount({stage,svg,read,interactive=true},value){
  const bag=disposer(),C=Cam(45,.5,1.7);
  fit(C,[[-48,-48,-49],[48,48,-49],[-48,48,49],[48,-48,49]],200,160);
  const P=proj(C),front=facing(C),g=mk('g',{},svg);
  const [outline,crease]=rings(-48,-48,48,48,2.8,.9);
  // The solid central plate hides the rear edges of the lower model plane.
  const bottom=mk('path',{class:'nf dash'},g),plate=solid(g),top=mk('path',{class:'nf dash'},g);
  const parts=[{z:-23,direction:-1,path:bottom},{z:0,direction:0,body:plate},{z:25,direction:1,path:top}]
    .map(part=>({...part,tw:tween(0),last:NaN}));
  let spread=clamp(value,10,24),active=-1;
  function draw(part,offset){
    if(part.last===offset)return;part.last=offset;
    const z=part.z+offset;
    if(part.body)put(part.body,prism(P,front,outline,crease,z-1.4,z));
    else part.path.setAttribute('d',poly(ringAt(P,outline,z)));
  }
  const loop=register(stage,(_dt,now)=>{
    let moving=false;
    parts.forEach(part=>{draw(part,tval(part.tw,now));moving ||= !tdone(part.tw,now);});return moving;
  });bag.add(loop.unregister);
  function choose(index){
    if(index===active)return;
    const from=index<0?active:index;active=index;const now=performance.now();
    parts.forEach((part,i)=>{
      tset(part.tw,index<0?0:part.direction*spread,now,Math.abs(i-from)*50);
      (part.path||part.body.sil).classList.toggle('hi',i===(index<0?1:index));
    });read.textContent=index<0?'rest':`layer ${index+1}`;loop.wake();
  }
  // Fixed resting bands, never the animated plane positions.
  function hit([x,y]){
    let nearest=-1,distance=Infinity;
    parts.forEach((part,i)=>{
      const at=P(0,0,part.z),dx=Math.abs(x-at[0]),dy=Math.abs(y-at[1]);
      if(dx/116+dy/58<=1.1&&dy<distance){nearest=i;distance=dy;}
    });return nearest;
  }
  parts.forEach(part=>draw(part,0));plate.sil.classList.add('hi');read.textContent='rest';
  if(interactive)bag.add(pointer(stage,{move:p=>choose(hit(p)),leave:()=>choose(-1)}));bag.add(()=>svg.replaceChildren());
  return {setActive:on=>choose(on?2:-1),set:v=>{spread=clamp(v,10,24);const previous=active;active=-2;choose(previous);},destroy:bag.dispose};
}
hairline({name:'layered-planes',means:'Two dashed model planes surround a solid infrastructure layer; hover to separate the planes with a stagger.',rules:[1,2,6,8,9],range:[10,17,24],mount});

export default figure;
