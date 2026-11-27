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

// Every mechanism has local travel limits on the reversible deployment clock.
function travel(progress: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t*t*(3 - 2*t);
}

// Clip the solid shackle against the body's lid in world coordinates.
function aboveLid(polygon: Point[]) {
  const visible: Point[] = [];
  let previous = polygon[polygon.length - 1];
  for (const point of polygon) {
    if ((previous[1] > 0) !== (point[1] > 0)) {
      const t = previous[1] / (previous[1] - point[1]);
      visible.push([previous[0] + t*(point[0]-previous[0]), 0, previous[2] + t*(point[2]-previous[2])]);
    }
    if (point[1] >= 0) visible.push(point);
    previous = point;
  }
  return visible;
}

function geometry(m: Model, accessory: TrustTopic, deployment: number) {
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

  if (deployment > 0 && accessory === 'reliability') {
    // Four feet on uneven ground support one level deck. Back parts render first.
    for (const [i,k,h] of [[-1,-1,36],[1,-1,14],[-1,1,4],[1,1,24]]) {
      const x = i*m.width/4, z = k*m.depth/4;
      const delay = ((i+1) + (k+1)*2)*.025;
      const shaft = (80-h)*travel(deployment, delay, .78+delay);
      const shoe = travel(deployment, .28+delay, .85+delay);
      if (shaft === 0) continue;
      const joint = -m.thickness - shaft;
      if (shoe > 0) box(x, joint, z, 10+(m.width/2-10)*shoe, h*shoe, 10+(m.depth/2-10)*shoe);
      box(x, -m.thickness, z, 10, shaft, 10);
    }
  }
  if (deployment > 0 && accessory === 'integrations') {
    const t = 13, separation = 24;
    // Rigid trays separate on their vertical runners before the middle tray slides forward.
    box(0,-(m.thickness+2*separation+t)*travel(deployment,0,.77),0,m.width,t,m.depth);
    box(30*travel(deployment,.40,1),-(m.thickness+separation)*travel(deployment,.16,.81),0,m.width,t,m.depth);
  }
  box(0,0,0,m.width,m.thickness,m.depth);

  if (deployment > 0 && accessory === 'safeguards') {
    const x = m.width/2, z = m.depth/2, h = 36;
    const posts = [[-x,z],[-x,0],[-x,-z],[0,-z],[x,-z],[x,0],[x,z]];
    const postHeight = h*travel(deployment,0,.46);
    for (const [px,pz] of posts) line([[px,0,pz],[px,postHeight,pz]]);
    // Each span sockets into its next post. Reverse playback draws the rails
    // back into their sockets before the uprights lower.
    for (const [y, start] of [[h/2,.34],[h,.46]]) {
      const extension = travel(deployment,start,start+.54);
      if (extension === 0) continue;
      for (let i = 1; i < posts.length; i++) {
        const [ax,az] = posts[i-1], [bx,bz] = posts[i];
        line([[ax,y,az],[ax+(bx-ax)*extension,y,az+(bz-az)*extension]]);
      }
    }
  }
  if (deployment > 0 && accessory === 'security') {
    // Sweep a round shackle along a U. Its silhouette stays perpendicular to
    // both the local tangent and the current camera direction.
    const view = [Math.SQRT1_2*Math.sqrt(.75), .5, Math.SQRT1_2*Math.sqrt(.75)];
    const lift = 76*(travel(deployment,0,.79)-1);
    const arch: Point[][] = [[],[]];
    for (let i = -1; i <= 49; i++) {
      const a = Math.PI * Math.max(0,Math.min(48,i))/48;
      const x = -37*Math.cos(a), y = i < 0 || i > 48 ? 0 : 30+37*Math.sin(a);
      const tx = Math.sin(a), ty = Math.cos(a);
      const nx = ty*view[2], ny = -tx*view[2], nz = tx*view[1]-ty*view[0];
      const r = 7.5/Math.hypot(nx,ny,nz);
      for (const [side,points] of [[1,arch[0]],[-1,arch[1]]] as const)
        points.push([x+side*r*nx,y+side*r*ny+lift,side*r*nz]);
    }
    const exposed = aboveLid([...arch[0], ...arch[1].reverse()]);
    if (exposed.length > 2) face(exposed);
    const key: Point[] = [], front = m.depth/2;
    for (let i = 0; i <= 40; i++) {
      const a = -Math.PI/3 + i/40*(5*Math.PI/3);
      key.push([10*Math.cos(a), -m.thickness*.44+10*Math.sin(a), front]);
    }
    key.push([-8,-m.thickness*.76,front],[8,-m.thickness*.76,front],key[0]);
    // Swing the keyway insert about its vertical axis from inside the front
    // panel. Clip the rotated contour where it passes behind the body.
    const angle = (1-travel(deployment,.43,1))*Math.PI/2;
    const hinge = -10, inset = 20*travel(deployment,.43,1);
    const turn = ([x,y]: Point): Point => [hinge+(x-hinge)*Math.cos(angle), y, front+inset*Math.sin(angle)-(x-hinge)*Math.sin(angle)];
    for (let i = 1; i < key.length; i++) {
      const a = turn(key[i-1]), b = turn(key[i]);
      if (a[2] < front && b[2] < front) continue;
      if ((a[2] < front) !== (b[2] < front)) {
        const t = (front-a[2])/(b[2]-a[2]);
        const hit: Point = [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]),front];
        line(a[2] < front ? [hit,b] : [a,hit]);
      } else line([a,b]);
    }
  }
  return shapes;
}

function project(model: Model, accessory: TrustTopic, deployment: number) {
  return geometry(model, accessory, deployment).map(({ points, surface }) => ({
    surface,
    points: points.map(([x,y,z]) => [
      (x-z)*Math.SQRT1_2, (x+z)*Math.SQRT1_2*.5-y*Math.sqrt(.75),
    ]),
  }));
}

// Frame each finished model once. Retracting a tall attachment should never
// cause the deck to jump in size or drift to fill the newly empty space.
function framing(topic: TrustTopic) {
  const points = project(models[topic], topic, 1).flatMap(shape => shape.points);
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const right = Math.max(...xs), top = Math.min(...ys);
  const scale = Math.min(297/(right-Math.min(...xs)),197/(Math.max(...ys)-top));
  return { scale, originX: 299-right*scale, originY: 1.5-top*scale };
}

export const poseFor = (topic: TrustTopic) => ({ ...models[topic], ...framing(topic) });
export type Pose = ReturnType<typeof poseFor>;

export function drawModel(canvas: HTMLCanvasElement, model: Pose, accessory: TrustTopic, deployment: number, ink: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return;
  const shapes = project(model, accessory, deployment);
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
