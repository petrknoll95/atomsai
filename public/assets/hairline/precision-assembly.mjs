const HL = window.HL;
let figure;
const hairline = definition => { figure = definition; };
const { Cam, fit, proj, facing, rings, prism, solid, put, mk, poly, ringAt, rrect, circ, pointer, register, disposer, tween, tset, tval, tdone } = HL;
function mount({stage,svg,read},value){
  const bag=disposer(),C=Cam(45,.5,2.0);
  fit(C,[[-45,-38,0],[45,38,0],[-45,38,0],[45,-38,0],[-45,-38,111],[45,38,111]],200,141);
  const P=proj(C),front=facing(C),g=mk('g',{},svg);
  const specs=[{w:90,h:76,z:0,t:9,x:0,y:0},{w:64,h:52,z:28,t:17,x:0,y:0},{w:90,h:76,z:70,t:5,x:4,y:-4}];
  const parts=specs.map((spec,i)=>{
    const group=mk('g',{},g),body=solid(group),detail=mk('path',{class:'nf lo'},group);
    const screws=[[-1,-1],[1,-1],[-1,1],[1,1]].map(()=>mk('path',{class:'nf lo'},group));
    return {...spec,i,body,detail,screws,tw:tween(0),last:NaN};
  });
  let separation=value,active=-1;
  function draw(part,offset){
    if(part.last===offset)return;part.last=offset;
    const {x,y,w,h,i}=part,z=part.z+offset,top=z+part.t;
    put(part.body,prism(P,front,...rings(x-w/2,y-h/2,x+w/2,y+h/2,5,1.2),z,top));
    const inset=i===1?9:17;
    part.detail.setAttribute('d',poly(ringAt(P,rrect(x-w/2+inset,y-h/2+inset,x+w/2-inset,y+h/2-inset,3,8),top)));
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy],j)=>{
      const ring=circ(2.2,20).map(q=>({...q,u:q.u+x+sx*(w/2-8),v:q.v+y+sy*(h/2-8)}));
      part.screws[j].setAttribute('d',poly(ringAt(P,ring,top)));
    });
  }
  const loop=register(stage,(_dt,now)=>{let moving=false;parts.forEach(part=>{draw(part,tval(part.tw,now));moving ||= !tdone(part.tw,now);});return moving;});bag.add(loop.unregister);
  function choose(index){
    if(index===active)return;const from=index<0?active:index;active=index;
    parts.forEach((part,i)=>{
      tset(part.tw,index<0?0:i===index?separation:i>index?separation*.6:0,performance.now(),Math.abs(i-from)*45);
      part.body.sil.classList.toggle('hi',i===(index<0?1:index));
    });read.textContent=index<0?'rest':['base','housing','cover'][index];loop.wake();
  }
  const hit=([x,y])=>{let nearest=-1,d=48;parts.forEach((part,i)=>{const at=P(part.x,part.y,part.z+part.t),dist=Math.hypot(x-at[0],y-at[1]);if(dist<d){nearest=i;d=dist;}});return nearest;};
  parts.forEach(part=>draw(part,0));parts[1].body.sil.classList.add('hi');read.textContent='rest';
  bag.add(pointer(stage,{move:p=>choose(hit(p)),leave:()=>choose(-1)}));bag.add(()=>svg.replaceChildren());
  return {set:v=>{separation=v;const previous=active;active=-2;choose(previous);},destroy:bag.dispose};
}
hairline({name:'precision-assembly',means:'A fitted base, housing and cover, separated just enough to reveal their construction; the chosen part lifts.',rules:[1,2,3,5,6,9],range:[6,13,20],mount});

export default figure;
