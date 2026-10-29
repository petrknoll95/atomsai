import p5 from 'p5';
import styles from './hero.module.css';

type Mount = { track: HTMLElement; stage: HTMLElement; content: HTMLElement; next: HTMLElement; onReady: () => void; interactive?: boolean };
type Star = { x: number; y: number; z: number; radius: number; emphasis: number; key: number; pullX: number; pullY: number; velocityX: number; velocityY: number };
type ScreenStar = { star: Star; x: number; y: number; z: number; radius: number; alpha: number; trailX: number; trailY: number };
type Connection = { from: Star; to: Star; depth: 1 | 2 };
type BranchMotion = { x: number; y: number; leafX: number; leafY: number; visibility: number; leafVisibility: number };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const agentNames = ['Sales agent', 'Support agent', 'Front desk agent', 'Collections agent', 'Rep assist', 'Knowledge agent', 'CRM agent', 'Document intake', 'Intelligence', 'Customer health', 'Ticket agent', 'Patient access', 'Dispatch and delivery', 'Quote agent'];
const pairNoise = (a: Star, b: Star) => {
  const value = Math.sin(a.key * 127.1 + b.key * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** A separate, seeded 3D scene. The saved nebula renderer stays unchanged. */
export function mountHeroField({ track, stage, content, next, onReady, interactive = true }: Mount) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let disposed = false, ready = false, visible = true;
  let stars: Star[] = [], clock = 0, playhead = 0, lastFrame = performance.now();
  let particleEnd = 1, revealStart = 0, revealEnd = 1;
  let cameraX = 0, cameraY = 0;
  let previousCameraZ = -2.4;
  let hub: Star | undefined, connectionStrength = 0;
  let graph: Connection[] = [];
  let drawnHub: { x: number; y: number } | undefined;
  const branchesInMotion: BranchMotion[] = [];
  const labelLayer = document.createElement('div');
  labelLayer.className = styles.agentLabels;
  labelLayer.setAttribute('aria-hidden', 'true');
  if (interactive) stage.appendChild(labelLayer);
  const pills = Array.from({ length: interactive ? 7 : 0 }, () => {
    const element = document.createElement('div');
    element.className = styles.agentLabel;
    const text = document.createElement('span');
    element.appendChild(text); labelLayer.appendChild(element);
    return { element, text, star: undefined as Star | undefined, shown: false, releaseAt: 0, width: 0, side: 0, name: '' };
  });
  let nextLabelSelection = 0;
  const pointer = { x: 0, y: 0, active: false };
  let labelFont = '';
  let dotColor = '#27433b', dotOpacity = 1;
  const readTimeline = () => {
    const css = getComputedStyle(track), total = Number(css.getPropertyValue('--hero-scroll-length'));
    labelFont = getComputedStyle(content).fontFamily;
    dotColor = css.getPropertyValue('--hero-dot-color').trim() || '#27433b';
    dotOpacity = Number(css.getPropertyValue('--hero-dot-opacity').trim() || 1);
    particleEnd = Number(css.getPropertyValue('--hero-particle-length')) / total;
    revealStart = Number(css.getPropertyValue('--hero-reveal-start')) / total;
    revealEnd = Number(css.getPropertyValue('--hero-reveal-end')) / total;
  };
  const readProgress = () => {
    const range = track.offsetHeight - stage.parentElement!.offsetHeight;
    const value = range > 0 ? clamp(-track.getBoundingClientRect().top / range) : 0;
    return value > .9999 ? 1 : value < .0001 ? 0 : value;
  };
  let seed = 92741;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const makeStar = (): Star => {
    const z = .65 + Math.pow(random(), .65) * 4.35;
    return { x: (random() - .5) * 1.5 * z, y: (random() - .5) * 1.5 * z, z,
      radius: 1.1 + 3.6 * Math.pow(random(), 4), emphasis: 0, key: random(), pullX: 0, pullY: 0, velocityX: 0, velocityY: 0 };
  };
  const populate = () => {
    hub = undefined; graph = []; connectionStrength = 0;
    drawnHub = undefined; branchesInMotion.length = 0;
    pills.forEach(pill => { pill.star = undefined; pill.shown = false; pill.element.removeAttribute('data-visible'); });
    seed = 92741;
    stars = Array.from({ length: stage.clientWidth < 768 ? 2000 : 3600 }, makeStar);
    stage.dataset.particles = String(stars.length);
  };
  const leave = () => { pointer.active = false; };
  const move = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !ready || !visible || document.hidden || reduced.matches || playhead > particleEnd * .6) return;
    const rect = stage.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) { leave(); return; }
    Object.assign(pointer, { x, y, active: true });
  };
  if (interactive) {
    track.addEventListener('pointermove', move, { passive: true });
    track.addEventListener('pointerleave', leave);
    track.addEventListener('pointercancel', leave);
  }

  let resizeField = () => {};
  const instance = new p5(p => {
    p.setup = () => {
      if (disposed) return;
      readTimeline();
      const renderer = p.createCanvas(stage.clientWidth, stage.clientHeight);
      (renderer.elt as HTMLCanvasElement).style.touchAction = 'auto';
      p.pixelDensity(devicePixelRatio || 1);
      p.frameRate(coarse.matches ? 30 : 60);
      populate();
      ready = true;
      stage.dataset.ready = 'true';
      onReady();
      playhead = readProgress();
      if (reduced.matches || document.hidden) p.noLoop();
    };
    p.windowResized = resizeField = () => {
      readTimeline();
      const density = devicePixelRatio || 1;
      if (p.width === stage.clientWidth && p.height === stage.clientHeight && p.pixelDensity() === density) return;
      p.pixelDensity(density);
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      populate(); leave();
    };
    p.draw = () => {
      if (!ready || disposed) return;
      const now = performance.now(), dt = Math.min(.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const still = reduced.matches, target = readProgress();
      if (!still) clock += dt;
      playhead = still ? target : playhead + (target - playhead) * (1 - Math.exp(-14 * dt));
      if (Math.abs(target - playhead) < .0001) playhead = target;
      track.dataset.progress = playhead.toFixed(3);
      const flight = still ? playhead : clamp(playhead / particleEnd);
      const copyFade = ease(.04, .28, flight);
      const introReady = still || clock >= .8;
      content.toggleAttribute('data-intro-ready', introReady);
      content.style.opacity = String(1 - copyFade);
      content.style.transform = still ? 'none' : `scale(${1 / (1 - .4 * copyFade)})`;
      content.style.filter = still || copyFade === 0 ? 'none' : `blur(${(12 * copyFade * copyFade).toFixed(2)}px)`;
      content.toggleAttribute('data-hidden', copyFade === 1);
      content.inert = copyFade === 1 || !introReady;
      const w = p.width, h = p.height, cx = w / 2, cy = h / 2;
      // Bring the next section upward at its natural size, keeping the
      // transparent surroundings so there is no hard edge over the particles.
      const arrival = still ? (flight >= .85 ? 1 : 0) : ease(revealStart, revealEnd, playhead);
      const complete = arrival === 1;
      next.style.transform = complete ? 'none' : `translate3d(0,${(h * (1 - arrival)).toFixed(2)}px,0)`;
      next.style.opacity = '1';
      next.style.clipPath = 'none';
      next.inert = !complete;
      next.setAttribute('aria-hidden', String(!complete));

      const interaction = still ? 0 : 1 - ease(.1, .6, flight);
      if (!interaction) leave();
      const cameraEase = 1 - Math.exp(-4 * dt);
      cameraX += ((pointer.active ? (pointer.x / w - .5) * .08 : 0) * interaction - cameraX) * cameraEase;
      cameraY += ((pointer.active ? (pointer.y / h - .5) * .08 : 0) * interaction - cameraY) * cameraEase;
      if (still) cameraX = cameraY = 0;
      // Approach from deeper in the field and ease continuously into the idle
      // drift. Scroll adds to the same camera move without restarting it.
      const cameraZ = still ? 0 : Math.pow(flight, 1.7) * 4.3 - 2.4 * Math.exp(-clock * 1.7) * (1 - flight);
      const shutterTravel = !still && track.dataset.autoFlight ? Math.max(0, (cameraZ - previousCameraZ) / Math.max(dt, .001)) * .025 : 0;
      previousCameraZ = cameraZ;
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = dotColor;
      const fadeIn = still ? 1 : ease(0, .8, clock);
      const fieldFade = 1 - ease(.35, .95, arrival);
      const quietWidth = Math.min(w * .48, 470), quietHeight = Math.min(h * .25, 210);
      const connected = new Set(graph.map(edge => edge.to));
      const hubDepth = hub ? Math.max(.08, hub.z - cameraZ) : 1;
      const attractX = hub ? cx + (hub.x - cameraX) / hubDepth * w : cx;
      const attractY = hub ? cy + (hub.y - cameraY) / hubDepth * h : cy;
      const attraction = pointer.active && !still ? connectionStrength * interaction : 0;
      const damping = Math.exp(-14 * dt);

      const projected: ScreenStar[] = [];
      if (!complete) for (const star of stars) {
        // Slow forward drift at rest, then a camera move through true depth on scroll.
        if (!still && flight < .08) {
          star.z -= dt * .025;
        }
        const z = Math.max(.0001, star.z - cameraZ);
        const baseX = cx + (star.x - cameraX) / z * w;
        const baseY = cy + (star.y - cameraY) / z * h;
        const dxToHub = attractX - baseX, dyToHub = attractY - baseY;
        const pull = connected.has(star) && star !== hub ? Math.min(.075, 18 / Math.max(1, Math.hypot(dxToHub, dyToHub))) * attraction : 0;
        if (still) {
          star.pullX = star.pullY = star.velocityX = star.velocityY = 0;
        } else {
          // A damped spring draws connected dots inward without changing
          // their underlying 3D positions, then restores them on release.
          star.velocityX = (star.velocityX + (dxToHub * pull - star.pullX) * 90 * dt) * damping;
          star.velocityY = (star.velocityY + (dyToHub * pull - star.pullY) * 90 * dt) * damping;
          star.pullX += star.velocityX * dt;
          star.pullY += star.velocityY * dt;
        }
        const x = baseX + star.pullX;
        const y = baseY + star.pullY;
        const r = Math.max(.85, star.radius / z);
        const margin = r * 1.35 + 32;
        if (x + margin < 0 || y + margin < 0 || x - margin > w || y - margin > h) {
          // Recycle only after the entire dot (and its trail) is offscreen,
          // never merely because it crossed a near-camera depth threshold.
          if (!still && flight < .08 && star.z < .5) { Object.assign(star, makeStar()); star.z = 5; }
          continue;
        }
        // Leave a quiet central reading area without an opaque card over the scene.
        const centerDistance = Math.hypot((x - cx) / quietWidth, (y - cy) / quietHeight);
        const legibility = .15 + .85 * ease(.6, 1.4, centerDistance);
        const alpha = dotOpacity * fadeIn * fieldFade * Math.min(.9, .38 + .5 / Math.max(.0001, star.z)) * (legibility + (1 - legibility) * copyFade);
        const trailScale = z / (z + shutterTravel);
        const dx = (x - cx) * (1 - trailScale), dy = (y - cy) * (1 - trailScale);
        const limit = Math.min(1, 32 / Math.max(1, Math.hypot(dx, dy)));
        projected.push({ star, x, y, z, radius: r, alpha, trailX: x - dx * limit, trailY: y - dy * limit });
      }
      // Velocity-aligned exposure trails: vector blur rather than blurring
      // the entire canvas, preserving the direction of the camera flight.
      if (shutterTravel > .001) {
        ctx.lineCap = 'round';
        for (const dot of projected) {
          if (Math.hypot(dot.x - dot.trailX, dot.y - dot.trailY) < .7) continue;
          const gradient = ctx.createLinearGradient(dot.trailX, dot.trailY, dot.x, dot.y);
          gradient.addColorStop(0, `color-mix(in srgb, ${dotColor} 0%, transparent)`);
          gradient.addColorStop(1, dotColor);
          ctx.globalAlpha = dot.alpha * .35;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = dot.radius * 1.2;
          ctx.beginPath(); ctx.moveTo(dot.trailX, dot.trailY); ctx.lineTo(dot.x, dot.y); ctx.stroke();
        }
        ctx.lineCap = 'butt';
      }
      // The quiet homepage version draws only the field: no graph, pointer
      // attraction, or label layout is created or evaluated.
      if (!interactive) {
        for (const dot of projected) {
          ctx.globalAlpha = dot.alpha;
          ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.radius, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      const byStar = new Map(projected.map(dot => [dot.star, dot]));
      const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
      const visibleDots = projected.filter(dot => dot.x >= 0 && dot.x <= w && dot.y >= 0 && dot.y <= h);
      const current = hub && byStar.get(hub);
      let candidate = current;
      if (pointer.active && interaction && !still) {
        const nearest = visibleDots.reduce<ScreenStar | undefined>((best, dot) => !best || distance(dot, pointer) < distance(best, pointer) ? dot : best, undefined);
        // Keep the hub stable as the camera drifts; only hand over when a
        // meaningfully closer dot is under the pointer.
        if (!current || (nearest && distance(nearest, pointer) + 12 < distance(current, pointer))) candidate = nearest;
      }
      const enabled = pointer.active && interaction > 0 && !still;
      const changingHub = candidate?.star !== hub;
      const strengthTarget = enabled ? interaction : 0;
      connectionStrength = still ? 0 : connectionStrength + (strengthTarget - connectionStrength) * (1 - Math.exp(-14 * dt));
      if (enabled && candidate && changingHub) {
        hub = candidate.star;
        graph = [];
        const reach = Math.min(300, Math.max(190, w * .2));
        const nearby = visibleDots.filter(dot => dot.star !== hub)
          .sort((a, b) => distance(a, candidate!) - distance(b, candidate!));
        // Stable weighted sampling of real dots: no angular slots or common
        // radius. Each hub gets an irregular mix of short and long branches.
        const choose = (origin: ScreenStar, pool: ScreenStar[], radius: number, count: number) => pool
          .filter(dot => distance(dot, origin) < radius)
          .map(dot => ({ dot, score: -Math.log(Math.max(.0001, pairNoise(origin.star, dot.star))) / (.4 + .6 * (1 - distance(dot, origin) / radius)) }))
          .sort((a, b) => a.score - b.score).slice(0, count).map(entry => entry.dot);
        const available = choose(candidate, nearby, reach, 8 + Math.floor(hub.key * 5));
        for (const dot of nearby) {
          if (available.length >= 8) break;
          if (!available.includes(dot)) available.push(dot);
        }
        const branches: ScreenStar[] = [];
        // Match new branches to their existing drawn positions so handovers
        // flow locally rather than shuffling all the spokes around the hub.
        for (let i = 0; available.length; i++) {
          const position = branchesInMotion[i];
          if (position) available.sort((a, b) => distance(a, position) - distance(b, position));
          branches.push(available.shift()!);
        }
        const used = new Set([hub, ...branches.map(dot => dot.star)]);
        for (const branch of branches) graph.push({ from: hub, to: branch.star, depth: 1 });
        for (const branch of branches) {
          // Some branches end here; others get one irregular adjacent link.
          if (pairNoise(branch.star, hub) < .15) continue;
          const adjacent = choose(branch, visibleDots.filter(dot => !used.has(dot.star)), reach * .55, 1)[0];
          if (adjacent) {
            used.add(adjacent.star);
            graph.push({ from: branch.star, to: adjacent.star, depth: 2 });
          }
        }
        stage.dataset.connectionGraph = JSON.stringify(graph.map(edge => ({ from: stars.indexOf(edge.from), to: stars.indexOf(edge.to), depth: edge.depth })));
      }
      // Morph one connected shape continuously. Hub changes never reduce
      // opacity; the shared origin and its branch endpoints follow new dots.
      let connections = 0;
      const highlighted = new Set<Star>();
      ctx.strokeStyle = '#27433b';
      ctx.lineWidth = .85;
      const root = hub && byStar.get(hub);
      const follow = 1 - Math.exp(-12 * dt);
      if (root) {
        drawnHub ??= { x: root.x, y: root.y };
        drawnHub.x += (root.x - drawnHub.x) * follow;
        drawnHub.y += (root.y - drawnHub.y) * follow;
        const spokes = graph.filter(edge => edge.depth === 1);
        for (let i = 0; i < Math.max(spokes.length, branchesInMotion.length); i++) {
          const edge = spokes[i];
          const target = edge && byStar.get(edge.to);
          const leafEdge = edge && graph.find(link => link.depth === 2 && link.from === edge.to);
          const leaf = leafEdge && byStar.get(leafEdge.to);
          const branch = branchesInMotion[i] ??= { x: drawnHub.x, y: drawnHub.y, leafX: drawnHub.x, leafY: drawnHub.y, visibility: 0, leafVisibility: 0 };
          if (target) {
            branch.x += (target.x - branch.x) * follow;
            branch.y += (target.y - branch.y) * follow;
            highlighted.add(target.star);
          }
          branch.visibility += ((target ? 1 : 0) - branch.visibility) * follow;
          const leafTarget = leaf ?? branch;
          branch.leafX += (leafTarget.x - branch.leafX) * follow;
          branch.leafY += (leafTarget.y - branch.leafY) * follow;
          branch.leafVisibility += ((leaf ? 1 : 0) - branch.leafVisibility) * follow;
          if (leaf) highlighted.add(leaf.star);
          const alpha = .22 * connectionStrength * fadeIn * fieldFade * branch.visibility;
          if (alpha < .003) continue;
          ctx.globalAlpha = alpha;
          ctx.beginPath(); ctx.moveTo(drawnHub.x, drawnHub.y); ctx.lineTo(branch.x, branch.y); ctx.stroke();
          connections++;
          if (alpha * branch.leafVisibility > .003) {
            ctx.globalAlpha = alpha * .7 * branch.leafVisibility;
            ctx.beginPath(); ctx.moveTo(branch.x, branch.y); ctx.lineTo(branch.leafX, branch.leafY); ctx.stroke();
            connections++;
          }
        }
        highlighted.add(root.star);
      }
      let maxDotScale = 1;
      for (const dot of projected) {
        const emphasis = highlighted.has(dot.star) ? connectionStrength : 0;
        dot.star.emphasis = still ? 0 : dot.star.emphasis + (emphasis - dot.star.emphasis) * follow;
        const dotScale = 1 + .35 * dot.star.emphasis;
        maxDotScale = Math.max(maxDotScale, dotScale);
        ctx.globalAlpha = Math.max(dot.alpha, .8 * dot.star.emphasis * fadeIn * fieldFade);
        ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.radius * dotScale, 0, TAU); ctx.fill();
      }
      // Seven persistent HTML pills: no per-frame text rasterization or
      // full-canvas blur. Only their small inner surfaces animate on handover.
      const labelsEnabled = pointer.active && interaction > .2 && !still && !complete;
      for (const pill of pills) {
        if (pill.shown && (!labelsEnabled || !pill.star || !highlighted.has(pill.star) || !byStar.has(pill.star))) {
          pill.shown = false; pill.releaseAt = now + 170;
          pill.element.removeAttribute('data-visible');
        }
      }
      if (labelsEnabled && now >= nextLabelSelection) {
        nextLabelSelection = now + 100;
        ctx.font = `400 12px ${labelFont}`;
        const fieldBounds = stage.getBoundingClientRect();
        const copyBounds = content.firstElementChild?.getBoundingClientRect();
        const occupied: { x: number; y: number; width: number; height: number }[] = [];
        const boxFor = (dot: ScreenStar, width: number, side: number) => ({
          x: side === 0 ? dot.x + dot.radius * 1.35 + 9 : dot.x - width - dot.radius * 1.35 - 9,
          y: dot.y - 13, width, height: 26,
        });
        const fits = (box: { x: number; y: number; width: number; height: number }) => {
          if (box.x < 8 || box.y < 8 || box.x + box.width > w - 8 || box.y + box.height > h - 8) return false;
          if (copyBounds && copyFade < .95 && box.x < copyBounds.right - fieldBounds.left + 12 && box.x + box.width > copyBounds.left - fieldBounds.left - 12
            && box.y < copyBounds.bottom - fieldBounds.top + 12 && box.y + box.height > copyBounds.top - fieldBounds.top - 12) return false;
          return !occupied.some(other => box.x < other.x + other.width + 10 && box.x + box.width + 10 > other.x && box.y < other.y + other.height + 8 && box.y + box.height + 8 > other.y);
        };
        for (const pill of pills) {
          const dot = pill.star && byStar.get(pill.star);
          if (!pill.shown || !dot) continue;
          const box = boxFor(dot, pill.width, pill.side);
          if (fits(box)) occupied.push(box);
          else { pill.shown = false; pill.releaseAt = now + 170; pill.element.removeAttribute('data-visible'); }
        }
        const assigned = new Set(pills.filter(pill => pill.shown).map(pill => pill.star));
        const names = new Set(pills.filter(pill => pill.shown).map(pill => pill.name));
        const candidates = projected.filter(dot => highlighted.has(dot.star) && dot.star.emphasis > .25 && !assigned.has(dot.star));
        for (const pill of pills) {
          if (pill.shown || now < pill.releaseAt) continue;
          for (const dot of candidates) {
            if (assigned.has(dot.star)) continue;
            const first = Math.floor(dot.star.key * agentNames.length);
            const name = Array.from({ length: agentNames.length }, (_, i) => agentNames[(first + i) % agentNames.length]).find(name => !names.has(name))!;
            const width = ctx.measureText(name).width + 24;
            const side = [0, 1].find(side => fits(boxFor(dot, width, side)));
            if (side === undefined) continue;
            pill.star = dot.star; pill.side = side; pill.width = width; pill.name = name; pill.shown = true;
            pill.text.textContent = name;
            pill.element.setAttribute('data-visible', '');
            occupied.push(boxFor(dot, width, side)); assigned.add(dot.star); names.add(name);
            break;
          }
        }
      }
      for (const pill of pills) {
        const dot = pill.star && byStar.get(pill.star);
        if (!dot || (!pill.shown && now >= pill.releaseAt)) continue;
        const x = pill.side === 0 ? dot.x + dot.radius * 1.35 + 9 : dot.x - pill.width - dot.radius * 1.35 - 9;
        pill.element.style.transform = `translate3d(${x.toFixed(1)}px,${(dot.y - 13).toFixed(1)}px,0)`;
      }
      stage.dataset.agentLabels = String(pills.filter(pill => pill.shown).length);
      stage.dataset.maxDotScale = maxDotScale.toFixed(3);
      stage.dataset.connections = String(connections);
      stage.dataset.connectionStrength = connectionStrength.toFixed(3);
      stage.dataset.cameraX = cameraX.toFixed(5);
      stage.dataset.cameraY = cameraY.toFixed(5);
      ctx.globalAlpha = 1;
    };
  }, stage);
  const sync = () => {
    if (!ready || disposed) return;
    readTimeline();
    if (!visible || document.hidden || reduced.matches) {
      leave(); instance.noLoop();
      if (visible && !document.hidden) void instance.redraw();
    } else { lastFrame = performance.now(); instance.loop(); }
  };
  let resizeFrame = 0;
  const resize = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { if (ready && !disposed) resizeField(); }); });
  resize.observe(stage);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(track);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  return {
    redraw: () => { if (ready && reduced.matches && !disposed) void instance.redraw(); },
    destroy: () => {
      disposed = true; observer.disconnect(); resize.disconnect(); cancelAnimationFrame(resizeFrame);
      document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync);
      track.removeEventListener('pointermove', move);
      track.removeEventListener('pointerleave', leave); track.removeEventListener('pointercancel', leave);
      instance.remove(); labelLayer.remove();
      content.style.removeProperty('opacity'); content.style.removeProperty('transform'); content.removeAttribute('data-hidden'); content.inert = false;
      content.style.removeProperty('filter');
      content.removeAttribute('data-intro-ready');
      next.inert = false; next.removeAttribute('aria-hidden'); next.style.removeProperty('clip-path'); next.style.removeProperty('transform');
      next.style.removeProperty('transform-origin'); next.style.removeProperty('opacity');
    },
  };
}
