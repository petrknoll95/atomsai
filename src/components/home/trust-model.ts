// The deck's top is the shared datum (y = 0). Dimensions and attachments
// interpolate in model space before the orthographic camera projects them.
const platform = {
  width: 120, depth: 120, thickness: 13, separation: 24, drawer: 30,
  layers: 1, railing: 0, foundation: 0, lock: 0, yaw: Math.PI / 4,
};
export const models = {
  integrations: platform,
  safeguards: { ...platform, thickness: 0, separation: 0, drawer: 0, layers: 0, railing: 1 },
  reliability: { ...platform, thickness: 8, separation: 0, drawer: 0, layers: 0, foundation: 1 },
  security: { ...platform, width: 112, depth: 44, thickness: 92, separation: 0, drawer: 0, layers: 0, lock: 1 },
};
export type TrustTopic = keyof typeof models;
export type Model = typeof platform;
type Point = [number, number, number];
type Shape = { points: Point[]; surface: boolean };

function geometry(m: Model) {
  const shapes: Shape[] = [];
  const line = (points: Point[]) => shapes.push({ points, surface: false });
  const face = (points: Point[]) => shapes.push({ points, surface: true });
  function box(x: number, top: number, z: number, width: number, height: number, depth: number) {
    const w = width / 2, d = depth / 2, bottom = top - height;
    const a: Point = [x-w,top,z-d], b: Point = [x+w,top,z-d];
    const c: Point = [x+w,top,z+d], e: Point = [x-w,top,z+d];
    const low = ([px,,pz]: Point): Point => [px,bottom,pz];
    // The camera stays in the positive x/z quadrant. Paint visible faces back to front.
    if (height > 0.01) {
      face([e,c,low(c),low(e)]);
      face([c,b,low(b),low(c)]);
    }
    face([a,b,c,e]);
  }

  if (m.foundation > 0.001) {
    // Four feet on uneven ground support one level deck. Back parts render first.
    for (const [i,k,h] of [[-1,-1,36],[1,-1,14],[-1,1,4],[1,1,24]]) {
      const x = i*m.width/4, z = k*m.depth/4;
      const joint = -m.thickness - (80-h)*m.foundation;
      box(x, joint, z, m.width/2, h*m.foundation, m.depth/2);
      box(x, -m.thickness, z, 10, (80-h)*m.foundation, 10);
    }
  }
  if (m.layers > 0.001) {
    const t = 13*m.layers;
    box(0,-m.thickness-2*m.separation-t,0,m.width,t,m.depth);
    box(m.drawer,-m.thickness-m.separation,0,m.width,t,m.depth);
  }
  box(0,0,0,m.width,m.thickness,m.depth);

  if (m.railing > 0.001) {
    const x = m.width/2, z = m.depth/2, h = 36*m.railing;
    const posts = [[-x,z],[-x,0],[-x,-z],[0,-z],[x,-z],[x,0],[x,z]];
    for (const [px,pz] of posts) line([[px,0,pz],[px,h,pz]]);
    for (const y of [h/2,h]) line([[-x,y,z],[-x,y,-z],[x,y,-z],[x,y,z]]);
  }
  if (m.lock > 0.001) {
    // Sweep a round shackle along a U. Its silhouette stays perpendicular to
    // both the local tangent and the current camera direction.
    const view = [Math.cos(m.yaw)*Math.sqrt(.75), .5, Math.sin(m.yaw)*Math.sqrt(.75)];
    const arch: Point[][] = [[],[]];
    for (let i = -1; i <= 49; i++) {
      const a = Math.PI * Math.max(0,Math.min(48,i))/48;
      const x = -37*Math.cos(a)*m.lock, y = i < 0 || i > 48 ? 0 : 30+37*Math.sin(a);
      const tx = Math.sin(a), ty = Math.cos(a);
      const nx = ty*view[2], ny = -tx*view[2], nz = tx*view[1]-ty*view[0];
      const r = 7.5*m.lock/Math.hypot(nx,ny,nz);
      for (const [side,points] of [[1,arch[0]],[-1,arch[1]]] as const)
        points.push([x+side*r*nx,y*m.lock+side*r*ny,side*r*nz]);
    }
    face([...arch[0],...arch[1].reverse()]);
    const key: Point[] = [], front = m.depth/2;
    for (let i = 0; i <= 40; i++) {
      const a = -Math.PI/3 + i/40*(5*Math.PI/3);
      key.push([10*Math.cos(a)*m.lock, -m.thickness*.44+10*Math.sin(a)*m.lock, front]);
    }
    key.push([-8*m.lock,-m.thickness*.76,front],[8*m.lock,-m.thickness*.76,front],key[0]);
    line(key);
  }
  return shapes;
}

export function drawModel(canvas: HTMLCanvasElement, model: Model, ink: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return;
  const cs = Math.cos(model.yaw), sn = Math.sin(model.yaw);
  let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
  const shapes = geometry(model).map(({ points, surface }) => ({
    surface,
    points: points.map(([x,y,z]) => {
      const u = x*sn-z*cs, v = (x*cs+z*sn)*.5-y*Math.sqrt(.75);
      minX = Math.min(minX,u); maxX = Math.max(maxX,u);
      minY = Math.min(minY,v); maxY = Math.max(maxY,v);
      return [u,v];
    }),
  }));
  const scale = Math.min(297/(maxX-minX),197/(maxY-minY));
  ctx.setTransform(canvas.width/300,0,0,canvas.height/200,0,0);
  ctx.clearRect(0,0,300,200);
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  for (const {points,surface} of shapes) {
    ctx.beginPath();
    points.forEach(([x,y],i) => {
      const px = 299-(maxX-x)*scale, py = 1.5+(y-minY)*scale;
      if (i === 0) ctx.moveTo(px,py);
      else ctx.lineTo(px,py);
    });
    if (surface) {
      ctx.closePath();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.stroke();
  }
}
