import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import {
  Color, DynamicDrawUsage, ExtrudeGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera,
  Path, Raycaster, Scene, Shape, ShapeGeometry, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { logoMarkSvg } from './operating-model-diagram/logo-mark';
import { createFlowPaths } from './operating-model-diagram/flow-paths';
import { createUiDiagram } from './operating-model-diagram/ui-diagram';
import { createOutlineShadow } from './operating-model-diagram/outline-shadow';

export type OperatingModelController = {
  select(index: number): void;
  destroy(): void;
  readonly pin?: ScrollTrigger;
  /** Share of the pin's scroll spent in the trailing hold after the diagram finishes. */
  readonly tailShare: number;
};
type DiagramOptions = {
  trigger: HTMLElement;
  pin: HTMLElement;
  start?: string | (() => string);
  interactive?: boolean;
  /** Drive the diagram from scroll (pinned). When false, only selections change its state. */
  scroll?: boolean;
  /** Extra pinned scroll after the last layer, in viewport heights, for exit transitions. */
  tail?: number;
  /** Show one plane only (0 waveform, 1 workflow, 2 interface, 3 logo) for still renders. */
  isolate?: number;
  /** Keep the drawing buffer so the canvas can be exported (toDataURL). */
  capture?: boolean;
  onHighlight?: (index: number) => void;
};

/** The approved four-plane diagram, shared by the homepage and the study. */
export function mountOperatingModel(element: HTMLElement, options: DiagramOptions): OperatingModelController {
  gsap.registerPlugin(ScrollTrigger);
  const stageElement = options.pin;
  const appearance = getComputedStyle(element);
  const colors = {
    surface: appearance.getPropertyValue('--diagram-fill').trim() || appearance.getPropertyValue('--diagram-surface').trim() || '#FAFAFA',
    ink: appearance.getPropertyValue('--diagram-ink').trim() || '#303030',
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollLinked = !reducedMotion && options.scroll !== false;
  let disposed = false;
  const isolate = options.isolate;
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: !!options.capture });
  // Supersample the thin contours instead of dithering overlapping line caps.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
  element.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new OrthographicCamera(-2.7, 2.7, 2.8, -2.8, .1, 50);
  camera.position.set(6, 6, 6);
  camera.lookAt(0, 0, 0);

  const halfSize = 1.32;
  const fillet = .22;
  const thickness = .06;
  const material = new LineMaterial({ color: colors.ink, linewidth: 1.5, depthTest: true, depthWrite: true, alphaToCoverage: false, transparent: false });
  const fill = new MeshBasicMaterial({
    color: colors.surface,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4,
  });
  const shape = new Shape();
  const s = halfSize, r = fillet;
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s);
  shape.absarc(s - r, -s + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(s, s - r);
  shape.absarc(s - r, s - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-s + r, s);
  shape.absarc(-s + r, s - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-s, -s + r);
  shape.absarc(-s + r, -s + r, r, Math.PI, Math.PI * 1.5, false);
  shape.closePath();

  const solid = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 24 });
  solid.rotateX(-Math.PI / 2);
  solid.translate(0, -thickness / 2, 0);
  const cutoutShape = shape.clone();
  const logoScale = halfSize * 2 * .8 / 440;
  const logoContours = new SVGLoader().parse(logoMarkSvg).paths
    .flatMap(path => SVGLoader.createShapes(path))
    .map(mark => mark.getPoints(48).map(point => ({
      x: (point.x - 220) * logoScale,
      y: (200 - point.y) * logoScale,
    })));
  logoContours.forEach(points => {
    const first = points[0], last = points[points.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) > 1e-8) points.push({ ...first });
    const hole = new Path();
    points.forEach((point, index) => {
      if (index === 0) hole.moveTo(point.x, point.y);
      else hole.lineTo(point.x, point.y);
    });
    hole.closePath();
    cutoutShape.holes.push(hole);
  });
  const cutoutSolid = new ExtrudeGeometry(cutoutShape, { depth: thickness, bevelEnabled: false, curveSegments: 24 });
  cutoutSolid.rotateX(-Math.PI / 2);
  cutoutSolid.translate(0, -thickness / 2, 0);

  // Derive both creases and silhouettes from adjacent faces of the actual
  // extruded mesh, including the cutout walls. No hand-drawn rim paths.
  function makeEdges(geometry: ExtrudeGeometry) {
    const positions = geometry.getAttribute('position');
    const edges = new Map<string, { a: Vector3; b: Vector3; normals: Vector3[] }>();
    const key = (point: Vector3) => point.toArray().map(value => Math.round(value * 1e6)).join(',');
    for (let i = 0; i < positions.count; i += 3) {
      const triangle = [0, 1, 2].map(offset => new Vector3().fromBufferAttribute(positions, i + offset));
      const normal = triangle[1].clone().sub(triangle[0]).cross(triangle[2].clone().sub(triangle[0])).normalize();
      for (let edge = 0; edge < 3; edge++) {
        const a = triangle[edge], b = triangle[(edge + 1) % 3];
        const id = [key(a), key(b)].sort().join('|');
        const existing = edges.get(id);
        if (existing) existing.normals.push(normal);
        else edges.set(id, { a, b, normals: [normal] });
      }
    }
    return [...edges.values()];
  }
  const edgeSets = [makeEdges(solid), makeEdges(cutoutSolid)];
  const outlines: { line: LineSegments2; kind: number; surface: Mesh; fade: { opacity: number; lift: number } }[] = [];
  // Precompose opacity against the opaque plane surface. Adjacent curve
  // segments then share one tone instead of accumulating alpha at their joins.
  const paperTone = new Color(colors.surface).convertLinearToSRGB();
  const inkTone = new Color(colors.ink).convertLinearToSRGB();
  for (let index = 0; index < 4; index++) {
    const height = (index - 1.5) * thickness;
    const kind = index === 3 ? 1 : 0;
    const surface = new Mesh(kind ? cutoutSolid : solid, fill);
    surface.position.y = height;
    scene.add(surface);
    const line = new LineSegments2(new LineSegmentsGeometry(), material.clone());
    line.position.y = height;
    // Structural contours finish the ink pass; their depth also masks the
    // full stroke width against any farther lines visible through cutouts.
    line.renderOrder = 2;
    scene.add(line);
    outlines.push({ line, kind, surface, fade: { opacity: index === 3 ? 1 : .18, lift: 0 } });
  }

  const iris = getComputedStyle(element).getPropertyValue('--palette-iris').trim() || '#A77BCA';
  // A voice waveform on the infrastructure layer uses the same visual cue as the PyAI demo.
  const barShape = new Shape();
  barShape.absarc(0, -.29, .21, Math.PI, 2 * Math.PI, false);
  barShape.absarc(0, .29, .21, 0, Math.PI, false);
  barShape.closePath();
  const waveGeometry = new ShapeGeometry(barShape, 8);
  waveGeometry.rotateX(-Math.PI / 2);
  const waveMaterial = new MeshBasicMaterial({ color: colors.ink, depthTest: true, depthWrite: true });
  const amplitudes = [.09, .17, .28, .21, .38, .63, .90, .53, .33, .46, .68, .86, 1, .58, .35, .63, .82, .44, .29, .51, .66, .32, .21, .13, .07];
  const waveform = new InstancedMesh(waveGeometry, waveMaterial, amplitudes.length);
  const barTransform = new Matrix4();
  waveform.visible = false;
  waveform.position.set(.15, 0, .23);
  waveform.instanceMatrix.setUsage(DynamicDrawUsage);
  waveform.renderOrder = 1;
  outlines[0].surface.add(waveform);

  function updateWaveform(pulse = -1) {
    amplitudes.forEach((height, index) => {
      const progress = index / (amplitudes.length - 1);
      const lift = 1 + .24 * Math.exp(-(((progress - pulse) / .13) ** 2));
      barTransform.makeScale(.13, 1, height * 1.22 * lift);
      barTransform.setPosition((progress - .5) * 1.96, thickness / 2 + .003, 0);
      waveform.setMatrixAt(index, barTransform);
    });
    waveform.instanceMatrix.needsUpdate = true;
  }
  updateWaveform();

  const flowPaths = createFlowPaths(outlines[1].surface, thickness, iris, colors);
  const uiDiagram = createUiDiagram(outlines[2].surface, thickness, colors);

  const perimeterMaterial = new LineMaterial({
    color: colors.ink, linewidth: .85, dashed: true, transparent: true,
    dashSize: .08, gapSize: .06, depthTest: false, depthWrite: false,
  });
  const perimeterFade = { opacity: 1 };
  const outlineShadow = createOutlineShadow(iris);
  scene.add(outlineShadow.mesh);
  const drawDistance = { value: 0 };
  perimeterMaterial.onBeforeCompile = shader => {
    shader.uniforms.drawDistance = drawDistance;
    shader.fragmentShader = `uniform float drawDistance;\n${shader.fragmentShader}`
      .replace('#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (vLineDistance > drawDistance) discard;');
  };
  const perimeter = new Line2(new LineGeometry(), perimeterMaterial);
  perimeter.renderOrder = 4;
  perimeter.visible = false;
  scene.add(perimeter);
  let perimeterLength = 0;
  function updatePerimeter() {
    camera.updateMatrixWorld();
    const extent = halfSize + .18;
    const top = 1.5 * (thickness + 1.25 * scrollState.spread) + thickness / 2 + .16;
    const projected: Vector3[] = [];
    for (const x of [-extent, extent]) for (const y of [-top, top]) for (const z of [-extent, extent]) {
      projected.push(new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
    }
    projected.sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (a: Vector3, b: Vector3, c: Vector3) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const halfHull = (points: Vector3[]) => {
      const result: Vector3[] = [];
      for (const point of points) {
        while (result.length >= 2 && cross(result[result.length - 2], result[result.length - 1], point) <= 1e-8) result.pop();
        result.push(point);
      }
      return result.slice(0, -1);
    };
    const hull = [...halfHull(projected), ...halfHull([...projected].reverse())].reverse();
    const start = hull.reduce((best, point, index) => point.y > hull[best].y ? index : best, 0);
    const ordered = [...hull.slice(start), ...hull.slice(0, start)];
    const corners = ordered.map((point, index) => {
      const previous = ordered[(index + ordered.length - 1) % ordered.length];
      const next = ordered[(index + 1) % ordered.length];
      const before = Math.hypot(previous.x - point.x, previous.y - point.y);
      const after = Math.hypot(next.x - point.x, next.y - point.y);
      const inset = Math.min(.24, before / 3, after / 3);
      return {
        point,
        entry: point.clone().lerp(previous, inset / before),
        exit: point.clone().lerp(next, inset / after),
      };
    });
    const roundedPath = new Path();
    const last = corners[corners.length - 1].exit;
    roundedPath.moveTo(last.x, last.y);
    for (const { point, entry, exit } of corners) {
      roundedPath.lineTo(entry.x, entry.y);
      roundedPath.quadraticCurveTo(point.x, point.y, exit.x, exit.y);
    }
    roundedPath.closePath();
    const roundedPoints = roundedPath.getPoints(24);
    perimeter.geometry.dispose();
    perimeter.geometry = new LineGeometry().setPositions(roundedPoints.flatMap(point => [point.x, point.y, 0]));
    perimeter.quaternion.copy(camera.quaternion);
    if (scrollState.shadow > 0) outlineShadow.update(roundedPoints, ordered, camera.quaternion);
    perimeter.computeLineDistances();
    perimeterLength = roundedPoints.slice(1).reduce((length, point, index) =>
      length + point.distanceTo(roundedPoints[index]), 0);
    drawDistance.value = perimeterLength * scrollState.perimeter;
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = options.interactive ?? false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.touches.ONE = undefined;
  controls.touches.TWO = undefined;
  renderer.domElement.style.touchAction = 'pan-y';
  const cameraDistance = camera.position.length();
  const isometricRotation = camera.quaternion.clone();
  camera.position.set(0, cameraDistance, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);
  const overheadRotation = camera.quaternion.clone();
  camera.up.set(0, 1, 0);
  const scrollState = { tilt: 0, spread: 0, perimeter: 0, designs: 0, shadow: 0 };
  function updateOutlines() {
    const view = camera.position.clone().sub(controls.target).normalize();
    for (const { line, kind } of outlines) {
      const positions: number[] = [];
      for (const edge of edgeSets[kind]) {
        const [a, b] = edge.normals;
        const crease = !b || a.dot(b) < Math.cos(Math.PI / 9);
        const silhouette = b && a.dot(view) * b.dot(view) < 0;
        if (crease || silhouette) positions.push(...edge.a.toArray(), ...edge.b.toArray());
      }
      line.geometry.dispose();
      line.geometry = new LineSegmentsGeometry().setPositions(positions);
    }
  }
  function render() { if (!disposed) renderer.render(scene, camera); }
  const cameraChanged = () => { lastTilt = -1; updateOutlines(); updatePerimeter(); updateFraming(); render(); };
  updateOutlines();
  let lastTilt = -1;
  const marchingDashes = gsap.to(perimeterMaterial, {
    dashOffset: -.14, duration: 1.2, repeat: -1, ease: 'none', paused: true, onUpdate: render,
  });
  const ripple = { progress: -.25 };
  const voiceWave = gsap.to(ripple, {
    progress: 1.25, duration: 2.7, repeat: -1, repeatDelay: .3, ease: 'none', paused: true,
    onUpdate: () => {
      if (disposed) return;
      updateWaveform(ripple.progress);
      render();
    },
  });
  const signal = { progress: 0 };
  const flowLoop = gsap.to(signal, {
    progress: 1, duration: 3.6, repeat: -1, ease: 'none', paused: true,
    onUpdate: () => {
      if (disposed) return;
      flowPaths.update(signal.progress);
      stageElement.dataset.flowPhase = signal.progress.toFixed(3);
      render();
    },
  });
  let inView = false;
  const visibility = new IntersectionObserver(entries => {
    inView = entries.some(entry => entry.isIntersecting);
    syncDashMotion();
  });
  const syncDashMotion = () => {
    const paused = document.hidden || !inView || reducedMotion;
    marchingDashes.paused(scrollState.perimeter <= 0 || paused);
    voiceWave.paused(scrollState.spread <= 0 || paused);
    flowLoop.paused(scrollState.spread <= 0 || paused);
  };
  document.addEventListener('visibilitychange', syncDashMotion);
  visibility.observe(element);
  function applyScrollState() {
    if (disposed) return;
    camera.quaternion.slerpQuaternions(overheadRotation, isometricRotation, scrollState.tilt);
    camera.position.set(0, 0, cameraDistance).applyQuaternion(camera.quaternion);
    const spacing = thickness + 1.25 * scrollState.spread;
    outlines.forEach(({ surface, line, fade }, index) => {
      surface.position.y = line.position.y = isolate === index ? 0 : (index - 1.5) * spacing + fade.lift;
      line.material.color.copy(paperTone).lerp(inkTone, fade.opacity).convertSRGBToLinear();
    });
    waveform.visible = scrollState.designs > 0;
    waveMaterial.color.copy(paperTone).lerp(inkTone, outlines[0].fade.opacity * scrollState.designs).convertSRGBToLinear();
    flowPaths.setOpacity(outlines[1].fade.opacity * scrollState.designs);
    uiDiagram.setOpacity(outlines[2].fade.opacity * scrollState.designs);
    uiDiagram.setExpansion(scrollState.spread);
    perimeter.visible = scrollState.perimeter > 0;
    outlineShadow.setStrength(scrollState.shadow);
    perimeterMaterial.color.copy(paperTone).lerp(inkTone, perimeterFade.opacity).convertSRGBToLinear();
    if (perimeter.visible) updatePerimeter();
    updateFraming();
    syncDashMotion();
    stageElement.dataset.perimeter = scrollState.perimeter.toFixed(4);
    stageElement.dataset.perimeterOpacity = perimeterFade.opacity.toFixed(2);
    stageElement.dataset.expansion = scrollState.spread.toFixed(4);
    stageElement.dataset.cameraTilt = scrollState.tilt.toFixed(4);
    stageElement.dataset.designOpacity = scrollState.designs.toFixed(4);
    stageElement.dataset.outlineShadow = scrollState.shadow.toFixed(4);
    stageElement.dataset.layerOpacities = outlines.map(({ fade }) => fade.opacity.toFixed(2)).join(',');
    stageElement.dataset.layerLifts = outlines.map(({ fade }) => fade.lift.toFixed(2)).join(',');
    if (lastTilt !== scrollState.tilt) {
      updateOutlines();
      lastTilt = scrollState.tilt;
    }
    render();
  }
  const resetView = () => { lastTilt = -1; applyScrollState(); };
  controls.addEventListener('change', cameraChanged);
  renderer.domElement.addEventListener('dblclick', resetView);

  function updateFraming() {
    const width = Math.max(1, element.clientWidth);
    const height = Math.max(1, element.clientHeight);
    const aspect = width / height;
    // Reserve the complete perimeter before its first dash is drawn. Fit in
    // camera space so tilting, lifted layers, and narrow canvases stay safe.
    const extent = halfSize + .18;
    const perimeterTop = 1.5 * (thickness + 1.25 * scrollState.spread) + thickness / 2 + .16;
    const lower = isolate !== undefined ? -thickness / 2
      : Math.min(-perimeterTop, ...outlines.map(({ surface }) => surface.position.y - thickness / 2));
    const upper = isolate !== undefined ? thickness / 2 + (isolate === 2 ? .38 * scrollState.spread + .005 : 0)
      : Math.max(perimeterTop, ...outlines.map(({ surface }, index) =>
        surface.position.y + thickness / 2 + (index === 2 ? .38 * scrollState.spread + .005 : 0)));
    camera.updateMatrixWorld();
    const point = new Vector3();
    let projectedX = 0, projectedY = 0;
    for (const x of [-extent, extent]) for (const y of [lower, upper]) for (const z of [-extent, extent]) {
      point.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
      projectedX = Math.max(projectedX, Math.abs(point.x));
      projectedY = Math.max(projectedY, Math.abs(point.y));
    }
    const padding = Math.min(24, width * .08, height * .08);
    const halfHeight = Math.max(
      isolate !== undefined ? 0 : 2.8 + .45 * scrollState.perimeter,
      projectedY / (1 - 2 * padding / height),
      projectedX / (aspect * (1 - 2 * padding / width)),
    );
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    stageElement.dataset.framePadding = Math.min(
      (1 - projectedX / camera.right) * width / 2,
      (1 - projectedY / camera.top) * height / 2,
    ).toFixed(2);
  }
  function resize() {
    const width = Math.max(1, element.clientWidth);
    const height = Math.max(1, element.clientHeight);
    updateFraming();
    perimeterMaterial.resolution.set(width, height);
    flowPaths.resize(width, height);
    uiDiagram.resize(width, height);
    renderer.setSize(width, height, false);
    outlines.forEach(({ line }) => line.material.resolution.set(width, height));
    render();
  }
  const sizing = new ResizeObserver(resize);
  sizing.observe(element);
  resize();

  applyScrollState();
  let timeline: gsap.core.Timeline;
  let selectionTween: gsap.core.Tween | undefined;
  let pendingHighlight: number | null = null;
  const interruptSelection = () => {
    // Scrolling only competes with a selection when scroll drives the timeline.
    if (!scrollLinked) return;
    pendingHighlight = null;
    selectionTween?.kill();
  };
  window.addEventListener('wheel', interruptSelection, { passive: true });
  window.addEventListener('touchstart', interruptSelection, { passive: true });
  const layerFades = outlines.map(({ fade }) => fade);
  const highlightLabels = ['highlight-1', 'highlight-2', 'highlight-3', 'highlight-perimeter'];
  let highlighted = -1;
  const animation = gsap.context(() => {
    timeline = gsap.timeline({
      paused: !scrollLinked,
      onUpdate: () => {
        applyScrollState();
        let current = 0;
        highlightLabels.forEach((label, index) => {
          if (timeline.time() >= timeline.labels[label]) current = index;
        });
        // Keep the clicked card open while scrolling past the other layers.
        if (pendingHighlight !== null) {
          if (current !== pendingHighlight) return;
          pendingHighlight = null;
        }
        if (current !== highlighted) {
          highlighted = current;
          options.onHighlight?.(current);
        }
      },
      scrollTrigger: !scrollLinked ? undefined : {
        trigger: options.trigger,
        start: options.start ?? 'top top',
        end: () => `+=${Math.round(window.innerHeight * (4.5 * (timeline?.duration() || 3.9) / 3.9))}`,
        pin: stageElement,
        pinSpacing: true,
        scrub: .6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })
      .to(scrollState, { tilt: 1, duration: .3, ease: 'power1.inOut' })
      .to(scrollState, { spread: 1, duration: 1, ease: 'none' })
      .to(scrollState, { designs: 1, duration: .35, ease: 'power1.inOut' }, .3);

    for (let active = 0; active < outlines.length; active++) {
      const finalHighlight = active === outlines.length - 1;
      timeline.addLabel(highlightLabels[active])
        .to(layerFades, {
          opacity: (index: number) => finalHighlight || index === active ? 1 : .18,
          lift: (index: number) => !finalHighlight && index === active ? .16 : 0,
          duration: .25,
          ease: 'power1.inOut',
        })
        .to(perimeterFade, {
          opacity: finalHighlight ? 1 : .22,
          duration: .25,
          ease: 'power1.inOut',
        }, '<');
      if (finalHighlight) {
        timeline.to(scrollState, { perimeter: 1, duration: .6, ease: 'none' }, 'highlight-perimeter')
          .to(scrollState, { shadow: 1, duration: .25, ease: 'power1.inOut' }, 'highlight-perimeter+=.35');
      }
      timeline.to(scrollState, { duration: .4 });
    }
    // Pin length is 4.5 viewport heights per 3.9s of timeline; convert the tail to timeline time.
    if (scrollLinked && options.tail) timeline.to({}, { duration: options.tail * 3.9 / 4.5 });
  }, options.trigger);
  const tailDuration = scrollLinked && options.tail ? options.tail * 3.9 / 4.5 : 0;
  if (isolate !== undefined) {
    // Still render of one plane: no scroll story, every design element shown.
    timeline!.kill();
    Object.assign(scrollState, { tilt: 1, spread: 1, designs: 1, perimeter: 0, shadow: 0 });
    outlines.forEach((outline, index) => {
      outline.fade.opacity = index === isolate ? 1 : 0;
      outline.fade.lift = 0;
      outline.surface.visible = outline.line.visible = index === isolate;
    });
    applyScrollState();
  }
  else if (reducedMotion) timeline!.progress(1);
  // Without scroll, open on the first layer to match the first open tab.
  else if (!scrollLinked) timeline!.time(timeline!.labels[highlightLabels[0]] + .35);
  element.dataset.ready = 'true';
  ScrollTrigger.refresh();
  function select(index: number) {
      pendingHighlight = index;
      options.onHighlight?.(index);
      stageElement.dataset.requestedHighlight = String(index);
      const time = timeline.labels[highlightLabels[index]] + (index === 3 ? .7 : .35);
      const trigger = timeline.scrollTrigger;
      if (!trigger) {
        selectionTween?.kill();
        if (reducedMotion) timeline.time(time);
        else selectionTween = gsap.to(timeline, { time, duration: .6, ease: 'power2.inOut', overwrite: 'auto' });
        return;
      }
      const top = trigger.start + time / timeline.duration() * (trigger.end - trigger.start);
      stageElement.dataset.requestedScroll = String(top);
      const smoother = ScrollSmoother.get();
      selectionTween?.kill();
      if (smoother?.smooth()) {
        selectionTween = gsap.to(smoother, { scrollTop: top, duration: .65, ease: 'power2.inOut', overwrite: 'auto' });
      }
      else window.scrollTo({ top, behavior: 'smooth' });
  }

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const planes = outlines.map(({ surface }) => surface);
  const canvas = renderer.domElement;
  let press: { id: number; x: number; y: number; moved: boolean } | null = null;
  function planeAt(event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(planes, false)[0];
    return hit ? planes.indexOf(hit.object as Mesh) : -1;
  }
  function pointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }
  function pointerMove(event: PointerEvent) {
    if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press.moved = true;
    if (event.pointerType !== 'touch') canvas.style.cursor = planeAt(event) >= 0 ? 'pointer' : '';
  }
  function pointerUp(event: PointerEvent) {
    const tapped = press?.id === event.pointerId && !press.moved && Math.hypot(event.clientX - press.x, event.clientY - press.y) <= 6;
    press = null;
    if (!tapped) return;
    const index = planeAt(event);
    if (index >= 0) select(index);
  }
  function cancelPointer() {
    press = null;
    canvas.style.cursor = '';
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', cancelPointer);
  canvas.addEventListener('pointerleave', cancelPointer);
  return {
    select,
    get pin() { return timeline.scrollTrigger; },
    get tailShare() { return tailDuration / timeline.duration(); },
    destroy() {
    disposed = true;
    selectionTween?.kill();
    window.removeEventListener('wheel', interruptSelection);
    window.removeEventListener('touchstart', interruptSelection);
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', cancelPointer);
    canvas.removeEventListener('pointerleave', cancelPointer);
    animation.revert();
    marchingDashes.kill();
    voiceWave.kill();
    flowLoop.kill(); flowPaths.dispose();
    uiDiagram.dispose();
    document.removeEventListener('visibilitychange', syncDashMotion);
    visibility.disconnect();
    delete element.dataset.ready;
    perimeter.geometry.dispose(); perimeterMaterial.dispose();
    outlineShadow.dispose();
    sizing.disconnect();
    controls.removeEventListener('change', cameraChanged);
    controls.dispose();
    renderer.domElement.removeEventListener('dblclick', resetView);
    outlines.forEach(({ line }) => { line.geometry.dispose(); line.material.dispose(); });
    waveform.dispose(); waveGeometry.dispose(); waveMaterial.dispose();
    solid.dispose(); cutoutSolid.dispose(); material.dispose(); fill.dispose();
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
