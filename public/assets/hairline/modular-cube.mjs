const HL = window.HL;
let figure;
const hairline = definition => { figure = definition; };
const { Cam, fit, proj, facing, rings, prism, solid, put, mk, pointer, register, disposer, tween, tset, tval, tdone } = HL;
function mount({stage,svg,read,interactive=true},value){
  const bag=disposer(),C=Cam(45,.5,2.0);
  fit(C,[[-34,-34,0],[34,34,0],[-34,34,0],[34,-34,0],[-34,-34,68],[66,-68,93]],200,156);
  const P=proj(C),front=facing(C),g=mk('g',{},svg);
  const cells=[];
  for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++)cells.push({x:x*34-34,y:y*34-34,z:z*34,offset:x===1&&y===0&&z===1});
  cells.sort((a,b)=>(a.z-b.z)||(a.x+a.y-b.x-b.y));
  const parts=cells.map(cell=>({...cell,body:solid(g),tw:tween(0),last:NaN}));
  let amount=value,active=-1;
  function draw(part,extra){
    if(part.last===extra)return;part.last=extra;
    const shift=part.offset?34:0;
    const x=part.x+shift,y=part.y-shift,z=part.z+(part.offset?16:0)+extra;
    put(part.body,prism(P,front,...rings(x,y,x+32,y+32,1.8,.65),z,z+32));
  }
  const loop=register(stage,(_dt,now)=>{let moving=false;parts.forEach(part=>{draw(part,tval(part.tw,now));moving ||= !tdone(part.tw,now);});return moving;});bag.add(loop.unregister);
  function choose(index){
    if(active===index)return;const from=index<0?active:index;active=index;
    parts.forEach((part,i)=>{
      tset(part.tw,index<0?0:i===index?amount:0,performance.now(),Math.abs(i-from)*35);
      part.body.sil.classList.toggle('hi',index<0?part.offset:i===index);
    });read.textContent=index<0?'rest':`cube ${index+1}`;loop.wake();
  }
  const hit=([x,y])=>{let nearest=-1,d=30;parts.forEach((part,i)=>{const shift=part.offset?34:0,at=P(part.x+16+shift,part.y+16-shift,part.z+32+(part.offset?16:0)),dist=Math.hypot(x-at[0],y-at[1]);if(dist<d){nearest=i;d=dist;}});return nearest;};
  parts.forEach(part=>{draw(part,0);part.body.sil.classList.toggle('hi',part.offset);});read.textContent='rest';
  if(interactive)bag.add(pointer(stage,{move:p=>choose(hit(p)),leave:()=>choose(-1)}));bag.add(()=>svg.replaceChildren());
  return {setActive:on=>choose(on?parts.findIndex(part=>part.offset):-1),set:v=>{amount=v;const previous=active;active=-2;choose(previous);},destroy:bag.dispose};
}
hairline({name:'modular-cube',means:'Eight small cubes form one larger cube, with one corner clearly separated; the chosen cube lifts gently.',rules:[1,3,5,6,9],range:[3,7,11],mount});

export default figure;
