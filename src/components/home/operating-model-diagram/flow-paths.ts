import { CircleGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, Path, Shape, ShapeGeometry, Vector2 } from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

/** Rounded flow routes mounted on the plane, with moving signals. */
export function createFlowPaths(parent: Mesh, thickness: number, iris: string, colors: { surface: string; ink: string }) {
  const group = new Group();
  group.visible = false;
  group.position.y = thickness / 2 + .002;
  parent.add(group);
  const paper = new Color(colors.surface).convertLinearToSRGB();
  const ink = new Color(colors.ink).convertLinearToSRGB();
  const accent = new Color(iris).convertLinearToSRGB();
  const lineMaterial = new LineMaterial({ color: colors.ink, linewidth: 1.15, depthTest: true, depthWrite: true });
  const inkMaterial = new MeshBasicMaterial({ color: colors.ink, depthTest: true, depthWrite: true });
  const nodeMaterial = new MeshBasicMaterial({ color: iris, depthTest: true, depthWrite: true });
  const lineGeometries: LineGeometry[] = [];
  const arrowGeometries: ShapeGeometry[] = [];
  const instances: InstancedMesh[] = [];
  const circle = new CircleGeometry(1, 32);
  circle.rotateX(-Math.PI / 2);
  const specs = [
    { dotted: true, points: [[-1.02,-1.02],[.03,-1.02],[.03,-.2]] },
    { arrow: true, points: [[.03,-.2],[.03,.52],[-.32,.52],[-.32,-.52],[-1.02,-.52]] },
    { dotted: true, points: [[-1.02,0],[-.67,0],[-.67,.52]] },
    { arrow: true, points: [[-.67,.52],[-1.02,.52],[-1.02,1.02]] },
    { points: [[-.67,.52],[-.67,1.02],[-.15,1.02]] },
    { dotted: true, points: [[-.15,1.02],[.38,1.02],[.38,-1.02],[.55,-1.02]] },
    { points: [[.38,0],[.55,0],[.55,1.02],[.72,1.02]] },
    { dotted: true, points: [[.72,1.02],[1.05,1.02],[1.05,.52]] },
    { arrow: true, points: [[.72,0],[.72,-1.02],[1.05,-1.02]] },
    { arrow: true, points: [[.72,.52],[.9,.52],[.9,-.52],[1.05,-.52]] },
    { arrow: true, points: [[.2,.52],[.2,-1.02]] },
    { arrow: true, points: [[-.5,0],[-.5,.52]] },
    { arrow: true, points: [[1.05,.52],[1.05,0]] },
  ];

  function disc(x: number, z: number, radius: number, material = inkMaterial, height = .004) {
    const mesh = new Mesh(circle, material);
    mesh.position.set(x, height, z);
    mesh.scale.set(radius, 1, radius);
    mesh.renderOrder = 1;
    group.add(mesh);
    return mesh;
  }
  for (const [x, z] of [[-1.02,-1.02],[-.32,0],[.72,0],[.72,1.02]]) {
    disc(x, z, .12, nodeMaterial, .001);
    disc(x, z, .018);
  }

  const paths = specs.map(({ points, dotted, arrow }) => {
    const vertices = points.map(([x, z]) => new Vector2(x, z));
    const path = new Path();
    path.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length - 1; i++) {
      const previous = vertices[i - 1], point = vertices[i], next = vertices[i + 1];
      const radius = Math.min(.17, point.distanceTo(previous) * .45, point.distanceTo(next) * .45);
      const entry = point.clone().lerp(previous, radius / point.distanceTo(previous));
      const exit = point.clone().lerp(next, radius / point.distanceTo(next));
      path.lineTo(entry.x, entry.y);
      path.quadraticCurveTo(point.x, point.y, exit.x, exit.y);
    }
    const end = vertices[vertices.length - 1];
    path.lineTo(end.x, end.y);
    if (dotted) {
      const count = Math.ceil(path.getLength() / .048) + 1;
      const dots = new InstancedMesh(circle, inkMaterial, count);
      const transform = new Matrix4();
      for (let i = 0; i < count; i++) {
        const point = path.getPointAt(i / (count - 1));
        transform.makeScale(.009, 1, .009);
        transform.setPosition(point.x, .003, point.y);
        dots.setMatrixAt(i, transform);
      }
      dots.instanceMatrix.needsUpdate = true;
      dots.renderOrder = 1;
      instances.push(dots);
      group.add(dots);
    } else {
      const geometry = new LineGeometry().setPositions(path.getPoints(24).flatMap(point => [point.x, .003, point.y]));
      lineGeometries.push(geometry);
      const line = new Line2(geometry, lineMaterial);
      line.renderOrder = 1;
      group.add(line);
    }
    disc(vertices[0].x, vertices[0].y, .017);
    if (arrow) {
      const direction = end.clone().sub(vertices[vertices.length - 2]).normalize();
      const normal = new Vector2(-direction.y, direction.x);
      const base = end.clone().addScaledVector(direction, -.055);
      const triangle = [end, base.clone().addScaledVector(normal, .028), base.clone().addScaledVector(normal, -.028)];
      const shape = new Shape(triangle.map(point => new Vector2(point.x, -point.y)));
      const geometry = new ShapeGeometry(shape);
      geometry.rotateX(-Math.PI / 2);
      arrowGeometries.push(geometry);
      const mesh = new Mesh(geometry, inkMaterial);
      mesh.position.y = .004;
      mesh.renderOrder = 1;
      group.add(mesh);
    }
    return path;
  });
  const signals = [0, 1, 5, 6, 8].map(index => ({ path: paths[index], mesh: disc(0, 0, .023, inkMaterial, .006) }));

  return {
    update(progress: number) {
      signals.forEach(({ mesh, path }, index) => {
        const phase = (progress + index / signals.length) % 1;
        const point = path.getPointAt(phase);
        mesh.position.set(point.x, .006, point.y);
        const radius = .023 * Math.min(1, phase / .06, (1 - phase) / .06);
        mesh.scale.set(radius, 1, radius);
      });
    },
    setOpacity(opacity: number) {
      group.visible = opacity > 0;
      lineMaterial.color.copy(paper).lerp(ink, opacity * .85).convertSRGBToLinear();
      inkMaterial.color.copy(paper).lerp(ink, opacity).convertSRGBToLinear();
      nodeMaterial.color.copy(paper).lerp(accent, opacity * .35).convertSRGBToLinear();
    },
    resize(width: number, height: number) {
      lineMaterial.resolution.set(width, height);
    },
    dispose() {
      parent.remove(group);
      instances.forEach(mesh => mesh.dispose());
      [...lineGeometries, ...arrowGeometries, circle].forEach(geometry => geometry.dispose());
      [lineMaterial, inkMaterial, nodeMaterial].forEach(material => material.dispose());
    },
  };
}
