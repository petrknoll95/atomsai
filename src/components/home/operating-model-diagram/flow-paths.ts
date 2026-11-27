import { CircleGeometry, Color, Group, Mesh, MeshBasicMaterial, Path } from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

/** A workflow with one input, a routing step, and two possible outcomes. */
export function createFlowPaths(parent: Mesh, thickness: number, iris: string, colors: { surface: string; ink: string }) {
  const group = new Group();
  group.visible = false;
  group.position.set(.17, thickness / 2 + .002, .26);
  parent.add(group);
  const paper = new Color(colors.surface).convertLinearToSRGB();
  const ink = new Color(colors.ink).convertLinearToSRGB();
  const accent = new Color(iris).convertLinearToSRGB();
  const connectorMaterial = new LineMaterial({ color: colors.ink, linewidth: 1.35 });
  const cardMaterial = new LineMaterial({ color: colors.ink, linewidth: 1.7 });
  const signalMaterial = new MeshBasicMaterial({ color: iris });
  const geometries: LineGeometry[] = [];
  const circle = new CircleGeometry(.03, 20);
  circle.rotateX(-Math.PI / 2);

  function stroke(path: Path, material: LineMaterial) {
    const geometry = new LineGeometry().setPositions(path.getPoints(12).flatMap(point => [point.x, .003, point.y]));
    const line = new Line2(geometry, material);
    line.renderOrder = 1;
    geometries.push(geometry);
    group.add(line);
  }

  const input = new Path().moveTo(-.59, 0).lineTo(-.28, 0);
  const branches = [-.52, .52].map(z => new Path().moveTo(.28, 0).lineTo(.34, 0)
    .quadraticCurveTo(.45, 0, .45, z * .35)
    .lineTo(.45, z * .72)
    .quadraticCurveTo(.45, z, .56, z));
  const connectors = [input, ...branches];
  connectors.forEach(path => stroke(path, connectorMaterial));

  const cards = [[-.85, 0, .26], [0, 0, .28], [.82, -.52, .26], [.82, .52, .26]];
  for (const [x, z, halfWidth] of cards) {
    const left = x - halfWidth, right = x + halfWidth;
    const top = z - .18, bottom = z + .18;
    const radius = .1;
    const card = new Path().moveTo(left + radius, top).lineTo(right - radius, top)
      .quadraticCurveTo(right, top, right, top + radius).lineTo(right, bottom - radius)
      .quadraticCurveTo(right, bottom, right - radius, bottom).lineTo(left + radius, bottom)
      .quadraticCurveTo(left, bottom, left, bottom - radius).lineTo(left, top + radius)
      .quadraticCurveTo(left, top, left + radius, top);
    stroke(card, cardMaterial);
    stroke(new Path().moveTo(x - .11, z - .045).lineTo(x + .11, z - .045), connectorMaterial);
    stroke(new Path().moveTo(x - .11, z + .045).lineTo(x + .035, z + .045), connectorMaterial);
  }

  const signals = connectors.map(path => {
    const mesh = new Mesh(circle, signalMaterial);
    mesh.visible = false;
    mesh.renderOrder = 1;
    group.add(mesh);
    return { mesh, path };
  });

  return {
    update(progress: number) {
      signals.forEach(({ mesh, path }, index) => {
        const phase = (progress + index / signals.length) % 1;
        const point = path.getPointAt(phase);
        mesh.visible = true;
        mesh.position.set(point.x, .007, point.y);
        mesh.scale.setScalar(Math.min(1, phase / .1, (1 - phase) / .1));
      });
    },
    setOpacity(opacity: number) {
      group.visible = opacity > 0;
      connectorMaterial.color.copy(paper).lerp(ink, opacity * .74).convertSRGBToLinear();
      cardMaterial.color.copy(paper).lerp(ink, opacity).convertSRGBToLinear();
      signalMaterial.color.copy(paper).lerp(accent, opacity).convertSRGBToLinear();
    },
    resize(width: number, height: number) {
      connectorMaterial.resolution.set(width, height);
      cardMaterial.resolution.set(width, height);
    },
    dispose() {
      parent.remove(group);
      geometries.forEach(geometry => geometry.dispose());
      circle.dispose();
      [connectorMaterial, cardMaterial, signalMaterial].forEach(material => material.dispose());
    },
  };
}
