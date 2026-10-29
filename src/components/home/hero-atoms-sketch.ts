import P5 from 'p5/core';
import accessibility from 'p5/accessibility';

// The modular P2D renderer expects accessibility's canvas lifecycle helpers.
P5.registerAddon(accessibility);

const TAU = Math.PI * 2;
const ATOM_RADIUS = 1.1;
const INTRO_DURATION = 2.35;
const INTRO_STAGGER = .32;
const INTRO_REVEAL = .5;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
type Atom = { radius: number; ux: number; uy: number; ring: number; bin: number; x: number; y: number; scatterX: number; scatterY: number };
type AtomBatch = { atoms: Atom[]; bin: number; delay: number };
type BurstRay = { ux: number; uy: number; speed: number; delay: number };
type Sweep = { x: number; y: number; dx: number; dy: number; length: number; power: number };

/** p5 owns the canvas and clock; batched native paths avoid thousands of p5 calls. */
export function mountHeroAtoms(host: HTMLDivElement) {
  const surface = host.closest('section')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  let reduceMotion = reduced.matches;
  let visible = true;
  let disposed = false;
  let ready = false;
  let time = 0;
  // Advance only while visible; resizes and hover never restart the entrance.
  let introTime = reduceMotion ? INTRO_DURATION : 0;
  let width = 1;
  let height = 1;
  let rings = 0;
  let spacing = 48;
  let atoms: Atom[] = [];
  let introBatches: AtomBatch[] = [];
  let restingBatches: AtomBatch[] = [];
  let burstRays: BurstRay[] = [];
  let ignitionGlow: CanvasGradient;
  const sweeps: Sweep[] = [];
  let canvas: HTMLCanvasElement;
  let resize: ResizeObserver;
  let frameCost = 0;
  let targetFps = coarse.matches ? 30 : 60;
  const pointer = { x: -1000, y: -1000, power: 0, active: false, stamp: 0 };
  const color = getComputedStyle(host).getPropertyValue('--hero-atom-color').trim();

  const pointerMove = (event: PointerEvent) => {
    if (reduceMotion || !visible) return;
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();
    const dt = Math.max(8, now - pointer.stamp);
    if (pointer.active) {
      const dx = x - pointer.x, dy = y - pointer.y;
      const length = Math.hypot(dx, dy);
      pointer.power = Math.min(1, length / dt / 2);
      // Consume actual travel once. A stationary pointer creates no force.
      if (length > .1) {
        if (sweeps.length === 24) sweeps.shift();
        sweeps.push({ x: pointer.x, y: pointer.y, dx, dy, length, power: pointer.power });
      }
    }
    pointer.x = x; pointer.y = y; pointer.stamp = now; pointer.active = true;
  };
  const pointerLeave = () => { pointer.active = false; };
  surface.addEventListener('pointermove', pointerMove, { passive: true });
  surface.addEventListener('pointerdown', pointerMove, { passive: true });
  surface.addEventListener('pointerleave', pointerLeave);
  surface.addEventListener('pointerup', pointerLeave);
  surface.addEventListener('pointercancel', pointerLeave);

  const playback = () => {
    if (!ready || disposed) return;
    const running = visible && !document.hidden && !reduceMotion;
    host.dataset.playback = reduceMotion ? 'reduced' : running ? 'running' : 'paused';
    if (running) sketch.loop(); else sketch.noLoop();
  };
  const motionChange = (event: MediaQueryListEvent) => {
    reduceMotion = event.matches;
    pointer.active = false;
    sweeps.length = 0;
    if (reduceMotion) {
      time = 0;
      introTime = INTRO_DURATION;
      for (const atom of atoms) atom.x = atom.y = 0;
    }
    playback();
    if (ready) sketch.redraw();
  };
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { pointerLeave(); sweeps.length = 0; }
    playback();
  });
  observer.observe(host);
  reduced.addEventListener('change', motionChange);
  document.addEventListener('visibilitychange', playback);

  const sketch = new P5(p => {
    const populate = () => {
      // Seeded distributions remain stable through resize and reduced-motion changes.
      let seed = 84;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      spacing = width < 768 ? 35 : 48;
      rings = Math.ceil(Math.hypot(width / 2, height * .71) / spacing) + 1;
      const maxAtoms = width < 768 ? 1100 : 3000;
      const pitch = width < 768 ? 13 : 9;
      atoms = [];
      for (let ring = 0; ring <= rings; ring++) {
        const count = ring === 0 ? 180 : Math.floor(TAU * ring * spacing / pitch);
        for (let i = 0; i < count; i++) {
          const radius = ring === 0 ? Math.pow(random(), 1.5) * 44 : ring * spacing + (random() - .5) * 12;
          const angle = (i + random() * .8) / count * TAU;
          const x = width / 2 + Math.cos(angle) * radius;
          const y = Math.min(280, height * .292) + Math.sin(angle) * radius;
          // Spend the particle budget inside the visible field, not offscreen arcs.
          if (x < -60 || x > width + 60 || y < -60 || y > height + 60) continue;
          const scatterAngle = i * 2.399963 + ring;
          atoms.push({ radius, ux: Math.cos(angle), uy: Math.sin(angle), ring, bin: i % 4, x: 0, y: 0,
            scatterX: Math.cos(scatterAngle), scatterY: Math.sin(scatterAngle) });
        }
      }
      if (atoms.length > maxAtoms) {
        const source = atoms;
        atoms = Array.from({ length: maxAtoms }, (_, i) => source[Math.floor(i * source.length / maxAtoms)]);
      }
      // Pre-group once: every orbit shares a release time, with no per-dot
      // angular noise or per-frame allocations. Resting rendering stays at four fills.
      const cy = Math.min(280, height * .292);
      const farthestRadius = Math.hypot(width / 2, Math.max(cy, height - cy)) + 60;
      introBatches = Array.from({ length: (rings + 1) * 4 }, (_, i) => {
        const ring = Math.floor(i / 4);
        const distance = clamp(ring * spacing / farthestRadius, 0, 1);
        return { atoms: [], bin: i % 4, delay: .18 + Math.pow(distance, .8) * INTRO_STAGGER };
      });
      restingBatches = Array.from({ length: 4 }, (_, bin) => ({ atoms: [], bin, delay: 0 }));
      for (const atom of atoms) {
        introBatches[atom.ring * 4 + atom.bin].atoms.push(atom);
        restingBatches[atom.bin].atoms.push(atom);
      }
      // A short-lived ballistic layer supplies the explosion's speed cues.
      // Directions and velocities are seeded once; tails reuse these rays.
      const rayCount = width < 768 ? 72 : 144;
      burstRays = Array.from({ length: rayCount }, (_, i) => {
        const angle = (i + random() * .8) / rayCount * TAU;
        return { ux: Math.cos(angle), uy: Math.sin(angle),
          speed: farthestRadius * (1.05 + random() * 1.25), delay: .16 + random() * .12 };
      });
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ignitionGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
      ignitionGlow.addColorStop(0, '#ffffff');
      ignitionGlow.addColorStop(.2, '#ffffff');
      ignitionGlow.addColorStop(.45, color);
      ignitionGlow.addColorStop(1, '#ffffff00');
      host.dataset.particles = String(atoms.length);
    };
    p.setup = () => {
      if (disposed) { void p.remove(); return; }
      width = host.clientWidth; height = host.clientHeight;
      // Budget backing pixels, including wide/high-density displays.
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(3_000_000 / (width * height))));
      const renderer = p.createCanvas(width, height);
      canvas = renderer.elt as HTMLCanvasElement;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.touchAction = 'auto';
      p.frameRate(targetFps);
      populate();
      ready = true;
      resize = new ResizeObserver(() => {
        if (disposed || (width === host.clientWidth && height === host.clientHeight)) return;
        width = host.clientWidth; height = host.clientHeight;
        p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(3_000_000 / (width * height))));
        p.resizeCanvas(width, height, true);
        populate();
        if (!p.isLooping()) p.redraw();
      });
      resize.observe(host);
      // setup finishes asynchronously inside p5; defer loop control until it does.
      queueMicrotask(playback);
    };
    p.draw = () => {
      if (disposed || !ready) return;
      const started = performance.now();
      const dt = reduceMotion ? 0 : Math.min(p.deltaTime / 1000 || 1 / 60, .04);
      time += dt;
      if (visible && !document.hidden) introTime = Math.min(INTRO_DURATION, introTime + dt);
      const introducing = introTime < INTRO_DURATION;
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      const cx = width / 2, cy = Math.min(280, height * .292);
      const phase = time * TAU / 12;
      // First-order relaxation has no momentum, overshoot or spring oscillation.
      const settle = Math.exp(-1.65 * dt);
      pointer.power *= Math.exp(-2.8 * dt);
      const reach = coarse.matches ? 80 : 110;
      const progress = introTime / INTRO_DURATION;
      const breath = smoothstep(progress);
      // A brief ignition precedes fast, straight ejection. The slower dust
      // field follows behind and decelerates into its orbits, without rotation.
      const launch = clamp((introTime - .18) / (INTRO_DURATION - .18), 0, 1);
      const remaining = 1 - launch;
      const travel = 1 - remaining ** 6;
      const expansion = .015 + .985 * travel;
      if (introducing && introTime < .5) {
        const flash = Math.sin(Math.PI * introTime / .5) ** 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = .12 * flash;
        ctx.fillStyle = ignitionGlow;
        ctx.fillRect(-100, -100, 200, 200);
        ctx.restore();
      }
      if (introducing && introTime < 1.65) {
        const fade = 1 - smoothstep(clamp((introTime - .8) / .85, 0, 1));
        // Same-sized dots form directional, fading trails. No stroked rings,
        // blur filters, frame buffers, or extra animation loop are needed.
        for (let tail = 8; tail >= 0; tail--) {
          ctx.globalAlpha = .82 * fade * (1 - tail / 9) ** 2;
          ctx.beginPath();
          for (const ray of burstRays) {
            const age = introTime - ray.delay - tail * .008;
            if (age <= 0) continue;
            const radius = ray.speed * (age - .035 * (1 - Math.exp(-age / .035)));
            const x = cx + ray.ux * radius, y = cy + ray.uy * radius;
            if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue;
            ctx.moveTo(x + ATOM_RADIUS, y);
            ctx.arc(x, y, ATOM_RADIUS, 0, TAU);
          }
          ctx.fill();
        }
      }
      for (const batch of introducing ? introBatches : restingBatches) {
        if (!batch.atoms.length) continue;
        const release = introducing ? clamp((introTime - batch.delay) / INTRO_REVEAL, 0, 1) : 1;
        if (release === 0) continue;
        const reveal = smoothstep(release);
        const waveLight = 1 + .55 * Math.sin(Math.PI * release) ** 2;
        ctx.globalAlpha = (.29 + batch.bin * .085) * reveal * waveLight
          * (1 + .15 * breath * Math.sin(phase + batch.bin * .5));
        ctx.beginPath();
        for (const atom of batch.atoms) {
          const radius = atom.radius * expansion;
          const x = cx + atom.ux * radius;
          const y = cy + atom.uy * radius;
          atom.x *= settle; atom.y *= settle;
          for (const sweep of sweeps) {
            // Test the entire travelled segment so a fast flick cannot skip dots.
            const along = clamp(((x + atom.x - sweep.x) * sweep.dx + (y + atom.y - sweep.y) * sweep.dy) / (sweep.length * sweep.length), 0, 1);
            const dx = x + atom.x - (sweep.x + sweep.dx * along);
            const dy = y + atom.y - (sweep.y + sweep.dy * along);
            const distance = Math.hypot(dx, dy);
            if (distance >= reach) continue;
            const influence = Math.pow(1 - distance / reach, 2);
            const kick = Math.min(80, sweep.length) * (.16 + sweep.power * .6) * influence * travel;
            atom.x += (sweep.dx / sweep.length * .7 + dx / Math.max(1, distance) * .45 + atom.scatterX * .65) * kick;
            atom.y += (sweep.dy / sweep.length * .7 + dy / Math.max(1, distance) * .45 + atom.scatterY * .65) * kick;
            const displacement = Math.hypot(atom.x, atom.y);
            if (displacement > 120) { atom.x *= 120 / displacement; atom.y *= 120 / displacement; }
          }
          const px = x + atom.x, py = y + atom.y;
          if (px < -4 || px > width + 4 || py < -4 || py > height + 4) continue;
          ctx.moveTo(px + ATOM_RADIUS, py); ctx.arc(px, py, ATOM_RADIUS, 0, TAU);
        }
        ctx.fill();
      }
      sweeps.length = 0;
      ctx.globalAlpha = 1;
      host.dataset.state = 'ready';
      const introState = introducing ? 'playing' : 'complete';
      if (host.dataset.intro !== introState) host.dataset.intro = introState;
      frameCost += (performance.now() - started - frameCost) * .08;
      if (p.frameCount % 30 === 0 || reduceMotion) {
        host.dataset.frames = String(p.frameCount);
        host.dataset.drawMs = frameCost.toFixed(2);
        host.dataset.pointerEnergy = pointer.power.toFixed(3);
        // Sustained expensive frames lower the clock, without changing composition.
        if (frameCost > 10 && targetFps === 60) { targetFps = 30; p.frameRate(30); }
        host.dataset.fps = String(targetFps);
      }
    };
  }, host);

  return () => {
    disposed = true;
    observer.disconnect(); resize?.disconnect();
    reduced.removeEventListener('change', motionChange);
    document.removeEventListener('visibilitychange', playback);
    surface.removeEventListener('pointermove', pointerMove);
    surface.removeEventListener('pointerdown', pointerMove);
    surface.removeEventListener('pointerleave', pointerLeave);
    surface.removeEventListener('pointerup', pointerLeave);
    surface.removeEventListener('pointercancel', pointerLeave);
    void sketch.remove();
  };
}
