const { Cam, fit, proj, facing, rrect, rings, prism, solid, put, poly, mk, clamp, pointer, register, disposer, tween, tset, tval, tdone } = HL;
function mount({stage,svg,read,interactive=true},value){
  const bag=disposer(), C=Cam(45,.5,1.8);
  const extent=57;
  fit(C,[[-extent,-38,-extent],[extent,38,-extent],[-extent,38,extent],[extent,-38,extent]],200,160);
  const P=proj(C),front=facing(C),g=mk('g',{},svg);
  // An open cage of rounded frames, rather than the edges of a solid box.
  // Far/lower frames precede the opaque core; near/upper frames follow it.
  const frame=rrect(-38,-38,38,38,4,8);
  const parts=[{axis:'x',sign:-1},{axis:'z',sign:-1},{axis:'x',sign:1},{axis:'z',sign:1}]
    .map(part=>({...part,tw:tween(0),last:NaN,path:null}));
  parts.slice(0,2).forEach(part=>part.path=mk('path',{class:'nf sil'},g));
  const core=solid(g);
  put(core,prism(P,front,...rings(-18,-18,18,18,3,1),-18,18));core.sil.classList.add('hi');
  parts.slice(2).forEach(part=>part.path=mk('path',{class:'nf sil'},g));
  let reach=clamp(value,8,19),active=-1;
  function draw(part,offset){
    if(part.last===offset)return;part.last=offset;
    const distance=part.sign*(38+offset);
    part.path.setAttribute('d',poly(frame.map(q=>part.axis==='x'?P(distance,q.u,q.v):P(q.u,q.v,distance))));
  }
  const loop=register(stage,(_dt,now)=>{
    let moving=false;
    parts.forEach(part=>{draw(part,tval(part.tw,now));moving ||= !tdone(part.tw,now);});return moving;
  });bag.add(loop.unregister);
  function choose(index){
    if(index===active)return;
    const from=index<0?active:index;active=index;const now=performance.now();
    parts.forEach((part,i)=>{
      tset(part.tw,index<0?0:reach,now,Math.abs(i-from)*45);
      part.path.classList.toggle('hi',i===index);
    });core.sil.classList.toggle('hi',index<0);
    read.textContent=index<0?'rest':`frame ${index+1}`;loop.wake();
  }
  const centres=[P(-38,0,0),P(0,0,-38),P(38,0,0),P(0,0,38)];
  function hit([x,y]){
    let best=-1,distance=78;
    centres.forEach((point,i)=>{const d=Math.hypot(x-point[0],y-point[1]);if(d<distance){best=i;distance=d;}});return best;
  }
  parts.forEach(part=>draw(part,0));read.textContent='rest';
  if(interactive)bag.add(pointer(stage,{move:p=>choose(hit(p)),leave:()=>choose(-1)}));bag.add(()=>svg.replaceChildren());
  return {setActive:on=>choose(on?2:-1),set:v=>{reach=clamp(v,8,19);const previous=active;active=-2;choose(previous);},destroy:bag.dispose};
}
hairline({name:'nested-cube',means:'A rounded cube within an open cubic cage; hover to spread its frames outward from the chosen side.',rules:[1,2,6,8,9],range:[8,13,19],mount});
