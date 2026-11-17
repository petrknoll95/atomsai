import { Color, Group, Mesh, MeshBasicMaterial, Path, Shape, ShapeGeometry, Vector3 } from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

/** A dashboard drawn on the slab, with three small lifted component cards. */
export function createUiDiagram(parent: Mesh, thickness: number, colors: { surface: string; ink: string }) {
  const group = new Group();
  group.visible = false;
  group.position.y = thickness / 2 + .003;
  parent.add(group);
  const paper = new Color(colors.surface).convertLinearToSRGB();
  const ink = new Color(colors.ink).convertLinearToSRGB();
  const border = new LineMaterial({ color: colors.ink, linewidth: 1.1, depthTest: true, depthWrite: true });
  const detail = new LineMaterial({ color: colors.ink, linewidth: 1, depthTest: true, depthWrite: true });
  const dashed = new LineMaterial({ color: colors.ink, linewidth: .8, dashed: true, dashSize: .025, gapSize: .025, depthTest: true, depthWrite: true });
  const fill = new MeshBasicMaterial({ color: colors.surface, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
  const geometries: (LineGeometry | ShapeGeometry)[] = [];

  function line(points: Vector3[], material = detail, target = group) {
    const geometry = new LineGeometry().setPositions(points.flatMap(point => point.toArray()));
    geometries.push(geometry);
    const stroke = new Line2(geometry, material);
    stroke.computeLineDistances();
    stroke.renderOrder = 1;
    target.add(stroke);
  }
  function stroke(points: number[][], target = group) {
    line(points.map(([x, z]) => new Vector3(x, .002, z)), detail, target);
  }
  function roundedRect(x: number, z: number, width: number, height: number, radius: number, target = group, solid = false) {
    const path = new Path();
    path.moveTo(x + radius, z);
    path.lineTo(x + width - radius, z);
    path.quadraticCurveTo(x + width, z, x + width, z + radius);
    path.lineTo(x + width, z + height - radius);
    path.quadraticCurveTo(x + width, z + height, x + width - radius, z + height);
    path.lineTo(x + radius, z + height);
    path.quadraticCurveTo(x, z + height, x, z + height - radius);
    path.lineTo(x, z + radius);
    path.quadraticCurveTo(x, z, x + radius, z);
    const points = path.getPoints(12);
    line(points.map(point => new Vector3(point.x, .002, point.y)), border, target);
    if (solid) {
      const geometry = new ShapeGeometry(new Shape(points.map(point => point.clone().setY(-point.y))), 12);
      geometry.rotateX(-Math.PI / 2);
      geometries.push(geometry);
      target.add(new Mesh(geometry, fill));
    }
  }
  function circle(x: number, z: number, radius: number, target = group) {
    line(Array.from({ length: 33 }, (_, i) => {
      const angle = i / 32 * Math.PI * 2;
      return new Vector3(x + Math.cos(angle) * radius, .002, z + Math.sin(angle) * radius);
    }), detail, target);
  }

  // Toolbar, main content, activity list, and two compact lower panels.
  roundedRect(-1.05, -1.05, 2.1, .22, .065);
  for (let i = 0; i < 3; i++) circle(-.91 + i * .1, -.94, .022);
  stroke([[.55, -.94], [.91, -.94]]);
  roundedRect(-1.05, -.72, 1.15, 1.06, .08);
  roundedRect(.21, -.72, .84, 1.77, .08);
  roundedRect(-1.05, .45, .48, .6, .07);
  roundedRect(-.46, .45, .56, .6, .07);

  stroke([[-.9, -.52], [-.38, -.52]]);
  for (let i = 0; i < 3; i++) {
    stroke([[-.9, -.33 + i * .12], [-.16 - (i % 2) * .15, -.33 + i * .12]]);
  }
  stroke([[-.9, .17], [-.64, .17]]);
  for (let i = 0; i < 4; i++) {
    const z = -.45 + i * .37;
    circle(.39, z, .061);
    stroke([[.55, z - .035], [.9, z - .035]]);
    stroke([[.55, z + .05], [.79, z + .05]]);
  }
  stroke([[-.94, .61], [-.72, .61]]);
  stroke([[-.94, .73], [-.79, .73]]);
  stroke([[-.35, .9], [-.35, .76], [-.2, .76], [-.2, .6], [-.04, .6]]);

  const cards: { card: Group; connector: Group; height: number }[] = [];
  // Small exploded components echo the reference without adding another slab.
  [[-.65, -.13, .3], [.64, -.48, .38], [-.17, .75, .28]].forEach(([x, z, height], index) => {
    const card = new Group();
    card.position.set(x, height, z);
    group.add(card);
    roundedRect(-.19, -.19, .38, .38, .055, card, true);
    if (index === 0) {
      for (let i = 0; i < 3; i++) stroke([[-.11, -.07 + i * .07], [.11 - (i % 2) * .06, -.07 + i * .07]], card);
    } else if (index === 1) {
      circle(0, 0, .115, card);
      circle(0, 0, .055, card);
    } else {
      stroke([[-.1, .1], [-.1, 0], [.04, 0], [.04, -.1]], card);
    }
    const connector = new Group();
    group.add(connector);
    line([new Vector3(x, .005, z), new Vector3(x, height, z)], dashed, connector);
    cards.push({ card, connector, height });
  });

  return {
    setExpansion(spread: number) {
      cards.forEach(({ card, connector, height }) => {
        card.position.y = height * spread;
        connector.scale.y = spread;
        card.visible = connector.visible = spread > .05;
      });
    },
    setOpacity(opacity: number) {
      group.visible = opacity > 0;
      border.color.copy(paper).lerp(ink, opacity * .85).convertSRGBToLinear();
      detail.color.copy(paper).lerp(ink, opacity * .75).convertSRGBToLinear();
      dashed.color.copy(paper).lerp(ink, opacity * .6).convertSRGBToLinear();
    },
    resize(width: number, height: number) {
      [border, detail, dashed].forEach(material => material.resolution.set(width, height));
    },
    dispose() {
      parent.remove(group);
      geometries.forEach(geometry => geometry.dispose());
      [border, detail, dashed, fill].forEach(material => material.dispose());
    },
  };
}
