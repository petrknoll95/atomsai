const HL = window.HL;
let figure;
const hairline = definition => { figure = definition; };
const { Cam, fit, proj, facing, rings, prism, solid, put, mk, seg, poly, ringAt, rrect, pointer, register, disposer, tween, tset, tval, tdone } = HL;
function mount({stage,svg,read},value) {
  const bag=disposer(), C=Cam(45,.5,1.95);
  fit(C,[[-58,-42,0],[58,42,0],[-58,42,0],[58,-42,0],[-58,-42,72],[58,42,72]],200,112);
  const P=proj(C), front=facing(C),g=mk('g',{},svg);
  put(solid(g),prism(P,front,...rings(-58,-42,58,42,6,1.5),0,9));
  const cells=[[-34,-20,10],[0,-20,24],[34,-20,13],[-34,20,10],[0,20,12],[34,20,10]].sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
  const parts=cells.map(([x,y,z])=>{
    const group=mk('g',{},g);
    mk('path',{class:'nf lo',d:poly(ringAt(P,rrect(x-15,y-15,x+15,y+15,3,6),9))},group);
    const body=solid(group),face=mk('path',{class:'nf lo'},group),contacts=mk('path',{class:'nf lo'},group);
    return {x,y,z,body,face,contacts,tw:tween(0),last:NaN};
  });
  let lift=value,active=-1;
  const draw=(part,offset)=>{
    if(part.last===offset)return;part.last=offset;
    const {x,y}=part,z=part.z+offset;
    put(part.body,prism(P,front,...rings(x-12,y-12,x+12,y+12,2.8,.9),z,z+7));
    part.face.setAttribute('d',poly(ringAt(P,rrect(x-7,y-7,x+7,y+7,1.5,5),z+7)));
    part.contacts.setAttribute('d',[-6,0,6].map(dx=>seg(P(x+dx,y+12,z+2),P(x+dx,y+12,z+5))).join(''));
  };
  const loop=register(stage,(_dt,now)=>{let moving=false;parts.forEach(part=>{draw(part,tval(part.tw,now));moving ||= !tdone(part.tw,now);});return moving;});bag.add(loop.unregister);
  function choose(index){
    if(index===active)return;
    const origin=parts[index<0?active:index];active=index;
    parts.forEach((part,i)=>{
      const distance=origin?Math.hypot(part.x-origin.x,part.y-origin.y):0;
      tset(part.tw,index<0?0:i===index?lift:distance<45?lift*.16:0,performance.now(),distance*1.1);
      part.body.sil.classList.toggle('hi',i===(index<0?1:index));
    });read.textContent=index<0?'rest':`socket ${index+1}`;loop.wake();
  }
  const hit=([x,y])=>{let nearest=-1,d=31;parts.forEach((part,i)=>{const at=P(part.x,part.y,part.z+7),dist=Math.hypot(x-at[0],y-at[1]);if(dist<d){nearest=i;d=dist;}});return nearest;};
  parts.forEach(part=>draw(part,0));parts[1].body.sil.classList.add('hi');read.textContent='rest';
  bag.add(pointer(stage,{move:p=>choose(hit(p)),leave:()=>choose(-1)}));bag.add(()=>svg.replaceChildren());
  return {set:v=>{lift=v;const previous=active;active=-2;choose(previous);},destroy:bag.dispose};
}
hairline({name:'test-bench',means:'Socketed modules on a test board; choosing one lifts it clear of its socket, with a small response nearby.',rules:[1,2,3,5,6,9],range:[8,16,24],mount});

export default figure;
