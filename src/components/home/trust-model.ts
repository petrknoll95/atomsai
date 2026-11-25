// Only the deck has a counterpart in every illustration.
export const models = {
  integrations: { width: 120, depth: 120, thickness: 13 },
  safeguards: { width: 120, depth: 120, thickness: 0 },
  reliability: { width: 120, depth: 120, thickness: 8 },
  security: { width: 112, depth: 44, thickness: 92 },
};
export type TrustTopic = keyof typeof models;
type Model = typeof models.integrations;
type Point = [number, number, number];
type Shape = { points: Point[]; surface: boolean };

function geometry(m: Model, accessory: TrustTopic | null) {
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

  if (accessory === 'reliability') {
    // Four feet on uneven ground support one level deck. Back parts render first.
    for (const [i,k,h] of [[-1,-1,36],[1,-1,14],[-1,1,4],[1,1,24]]) {
      const x = i*m.width/4, z = k*m.depth/4;
      const joint = -m.thickness - (80-h);
      box(x, joint, z, m.width/2, h, m.depth/2);
      box(x, -m.thickness, z, 10, (80-h), 10);
    }
  }
  if (accessory === 'integrations') {
    const t = 13, separation = 24;
    box(0,-m.thickness-2*separation-t,0,m.width,t,m.depth);
    box(30,-m.thickness-separation,0,m.width,t,m.depth);
  }
  box(0,0,0,m.width,m.thickness,m.depth);

  if (accessory === 'safeguards') {
    const x = m.width/2, z = m.depth/2, h = 36;
    const posts = [[-x,z],[-x,0],[-x,-z],[0,-z],[x,-z],[x,0],[x,z]];
    for (const [px,pz] of posts) line([[px,0,pz],[px,h,pz]]);
    for (const y of [h/2,h]) line([[-x,y,z],[-x,y,-z],[x,y,-z],[x,y,z]]);
  }
  if (accessory === 'security') {
    // Sweep a round shackle along a U. Its silhouette stays perpendicular to
    // both the local tangent and the current camera direction.
    const view = [Math.SQRT1_2*Math.sqrt(.75), .5, Math.SQRT1_2*Math.sqrt(.75)];
    const arch: Point[][] = [[],[]];
    for (let i = -1; i <= 49; i++) {
      const a = Math.PI * Math.max(0,Math.min(48,i))/48;
      const x = -37*Math.cos(a), y = i < 0 || i > 48 ? 0 : 30+37*Math.sin(a);
      const tx = Math.sin(a), ty = Math.cos(a);
      const nx = ty*view[2], ny = -tx*view[2], nz = tx*view[1]-ty*view[0];
      const r = 7.5/Math.hypot(nx,ny,nz);
      for (const [side,points] of [[1,arch[0]],[-1,arch[1]]] as const)
        points.push([x+side*r*nx,y+side*r*ny,side*r*nz]);
    }
    face([...arch[0],...arch[1].reverse()]);
    const key: Point[] = [], front = m.depth/2;
    for (let i = 0; i <= 40; i++) {
      const a = -Math.PI/3 + i/40*(5*Math.PI/3);
      key.push([10*Math.cos(a), -m.thickness*.44+10*Math.sin(a), front]);
    }
    key.push([-8,-m.thickness*.76,front],[8,-m.thickness*.76,front],key[0]);
    line(key);
  }
  return shapes;
}

function project(model: Model, accessory: TrustTopic | null) {
  return geometry(model, accessory).map(({ points, surface }) => ({
    surface,
    points: points.map(([x,y,z]) => [
      (x-z)*Math.SQRT1_2, (x+z)*Math.SQRT1_2*.5-y*Math.sqrt(.75),
    ]),
  }));
}

// Frame each finished model once. Fading a tall attachment should never
// cause the deck to jump in size or drift to fill the newly empty space.
function framing(topic: TrustTopic) {
  const points = project(models[topic], topic).flatMap(shape => shape.points);
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const right = Math.max(...xs), top = Math.min(...ys);
  const scale = Math.min(297/(right-Math.min(...xs)),197/(Math.max(...ys)-top));
  return { scale, originX: 299-right*scale, originY: 1.5-top*scale };
}

export const poseFor = (topic: TrustTopic) => ({ ...models[topic], ...framing(topic) });
export type Pose = ReturnType<typeof poseFor>;

export function drawModel(canvas: HTMLCanvasElement, model: Pose, accessory: TrustTopic | null, ink: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return;
  const shapes = project(model, accessory);
  ctx.setTransform(canvas.width/300,0,0,canvas.height/200,0,0);
  ctx.clearRect(0,0,300,200);
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  for (const {points,surface} of shapes) {
    ctx.beginPath();
    points.forEach(([x,y],i) => {
      const px = model.originX+x*model.scale, py = model.originY+y*model.scale;
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
