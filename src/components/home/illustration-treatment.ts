let treatmentId = 0;
/** Style the authored projected paths without changing their geometry or motion. */
export function applyIllustrationTreatment(svg: SVGSVGElement) {
  const ns = 'http://www.w3.org/2000/svg';
  const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'));
  const layers = new Map<SVGPathElement, SVGGElement>();
  const make = (tag: string) => document.createElementNS(ns, tag);
  function update(path: SVGPathElement) {
    let layer = layers.get(path);
    if (!path.classList.contains('hi')) { layer?.replaceChildren(); return; }
    const d = path.getAttribute('d') ?? '';
    // All current silhouettes are closed projected polylines; open structural edges stay unfilled.
    if (!/Z$/i.test(d) || /[CQAS]/i.test(d)) return;
    const coordinates = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (coordinates.length < 6) return;
    const xs = coordinates.filter((_,i)=>i%2===0), ys = coordinates.filter((_,i)=>i%2===1);
    const cx=(Math.min(...xs)+Math.max(...xs))/2, cy=(Math.min(...ys)+Math.max(...ys))/2;
    if (!layer) { layer=make('g') as SVGGElement; layer.setAttribute('data-brand-fade',''); path.before(layer); layers.set(path,layer); }
    const contour = (scale: number) => xs.map((x,i)=>`${i?'L':'M'}${cx+(x-cx)*scale} ${cy+(ys[i]-cy)*scale}`).join('')+'Z';
    const bands = [];
    // Disjoint contours follow the original silhouette. On an isometric sheet this
    // produces a diamond fade aligned to all four edges, with a clear center.
    for(let i=1;i<=32;i++) {
      const band=make('path');
      band.setAttribute('d',contour(i/32)+contour((i-1)/32));
      band.setAttribute('fill-rule','evenodd');
      band.setAttribute('style',`fill:var(--palette-iris);fill-opacity:${((i-.5)/32)**2};stroke:none;`);
      bands.push(band);
    }
    layer.replaceChildren(...bands);
  }
  // Composite later surfaces once: overlapping occluders do not compound the
  // 35% hidden-line opacity. Only linework is masked; fills remain transparent.
  const defs = make('defs'); svg.prepend(defs);
  const masks = paths.map((path,index)=>{
    const occluders=paths.slice(index+1).filter(p=>p.classList.contains('sil')&&!p.classList.contains('nf'));
    if(!occluders.length)return null;
    const mask=make('mask'), id=`atoms-hidden-${++treatmentId}`;
    mask.setAttribute('id',id);mask.setAttribute('maskUnits','userSpaceOnUse');
    mask.setAttribute('x','-1000');mask.setAttribute('y','-1000');mask.setAttribute('width','3000');mask.setAttribute('height','3000');
    const white=make('rect');white.setAttribute('x','-1000');white.setAttribute('y','-1000');white.setAttribute('width','3000');white.setAttribute('height','3000');white.setAttribute('fill','white');mask.append(white);
    const union=make('g');union.setAttribute('opacity','.65');mask.append(union);
    const copies=occluders.map(original=>{const copy=make('path');copy.setAttribute('style','fill:black;stroke:none;');union.append(copy);return {original,copy};});
    defs.append(mask);path.setAttribute('mask',`url(#${id})`);
    return {path,copies};
  });
  const updateMasks=()=>masks.forEach(mask=>mask?.copies.forEach(({original,copy})=>copy.setAttribute('d',original.getAttribute('d')??'')));
  paths.forEach(update);updateMasks();
  const observer=new MutationObserver(records=>{
    const changed=new Set(records.map(record=>record.target as SVGPathElement));
    changed.forEach(update);updateMasks();
  });
  paths.forEach(path=>observer.observe(path,{attributes:true,attributeFilter:['d','class']}));
  return ()=>{observer.disconnect();layers.forEach(layer=>layer.remove());defs.remove();paths.forEach(path=>path.removeAttribute('mask'));};
}
