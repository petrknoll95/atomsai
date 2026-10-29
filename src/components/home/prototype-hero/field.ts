// Hero dot field: one p5 canvas of several thousand dots, driven by scrolling the hero's track.
//
// 1. On load the dots fade in as a chaotic nebula (Figma frame 01). It is resampled from frame 01's
//    own dot coordinates (src/data/nebula-01.json) along their local filaments, plus extra clumps
//    in random orientations so nothing lines up around the centre.
//    The first part of the scroll rearranges it into concentric rings around a dense core
//    (frame 02). Every dot takes the shortest path: a straight line to its slot. The pairing of
//    nebula dots with slots minimises the total squared travel (optimal transport). It starts in
//    polar coordinates (radius rank, then angle within each ring) and is refined by swapping pairs
//    whenever that shortens them, which also untangles crossing paths. Timing varies smoothly
//    across the cloud, inner rings first, so neighbouring dots move together.
//    The rings turn with the scroll, alternate rings in opposite directions, like swarms. Each dot
//    runs a little faster or slower than its ring and drifts in and out, so groups loosen and
//    regroup. Everything is a pure function of the playhead (the scroll position with a short
//    glide), so it scrubs both ways at the reader's pace.
// 2. The rest of the scroll flies the camera into the core. Every dot has a depth (outer rings near,
//    the core far), so the rings stream outward past the camera with parallax. The hero copy fades
//    out over the first part of the dive.
// 3. The camera ends on the single dot at the very centre of the core. It grows by the same
//    perspective as every other dot, but sits on the axis, so it fills the screen while its
//    neighbours stream outward. A white seed then grows inside it, revealing the opaque next
//    section as it rises into place. A final pinned interval gives the section room to be read.
//
// Positions are in design px: the 1600 × 900 Figma frame, measured from the field's centre. They
// are scaled to the viewport by its diagonal, so the rings keep the same framing at any size.
// Colour follows the Figma fill: a radial gradient from foreground at the centre to background at
// the fade radius, so dots dissolve into the page as they move outward.

import p5 from 'p5';
import frame01 from './nebula-01.json';

const DESIGN = { width: 1600, height: 900 };
const DESIGN_DIAGONAL = Math.hypot(DESIGN.width, DESIGN.height);
const TAU = Math.PI * 2;

export const CONFIG = {
  seed: 4127,
  colors: { foreground: '#27433b', background: '#f6f1e8' },
  /** Centre of the rings as a fraction of the stage (frame 02: 1045, 439). */
  centre: { x: 1045 / 1600, y: 439 / 900 },
  /** Below this stage width the field centres horizontally behind the stacked copy. */
  narrow: { maxWidth: 900, centre: { x: 0.5, y: 0.3 } },
  /** Radius of the colour gradient, design px. Dots at or past it are background-coloured. */
  fadeRadius: 998,

  // ----- Settled rings (frame 02) -----
  /** Ring radii in design px, measured from frame 02. `fill` thins a ring (222 is a partial ring). */
  rings: [
    { r: 122, fill: 1 },
    { r: 180, fill: 1.15 },
    { r: 222, fill: 0.3 },
    { r: 273, fill: 1 },
    { r: 355, fill: 1 },
    { r: 450, fill: 1 },
    { r: 561, fill: 1 },
    { r: 686, fill: 1 },
    { r: 828, fill: 1 },
    { r: 988, fill: 1 },
  ],
  /** Slots along each ring are this far apart (design px); dropout leaves 2–4 dot groups. */
  slotSpacing: 4,
  /**
   * Kept dots per design px of circumference: base + perRadius / r (inner rings run denser).
   * Frame 02 is about 0.05 + 6 / r; this runs about twice as dense, with smaller dots.
   */
  density: { base: 0.1, perRadius: 12 },
  /** Radial bend of each ring (noise amplitude, design px) and the Gaussian thickness of its band. */
  bend: 40,
  thickness: 4,
  /**
   * Core: an even disc with a soft edge, a sparse halo and a tight seed at the very centre. `peers`
   * sit right beside the centre dot at its depth, so on the way in they grow with it: a peer d px
   * from the centre stays d / dot radius of its radii away, and leaves the screen as it fills.
   */
  core: {
    disc: 580,
    discRadius: 60,
    halo: 140,
    haloSigma: 48,
    maxRadius: 104,
    seed: 70,
    seedSigma: 6,
    peers: { count: 10, minRadius: 2.8, maxRadius: 10 },
  },
  /**
   * Off-screen rings that give the nebula's outer dots somewhere to go. They sit past the fade
   * radius once settled, so those dots drift outward and dissolve as the rings form.
   */
  outerRings: [1120, 1260, 1400],
  /** Dot radius, CSS px (Figma: 1.4 in the nebula, 1.59 in the rings). */
  dotRadius: { nebula: 1.05, rings: 1.15 },

  // ----- Nebula (frame 01) -----
  nebula: {
    /** Share of dots resampled from frame 01's points; the rest form extra clumps. */
    frame01Share: 0.58,
    /**
     * Resampling jitter (design px): along the point's local filament (scaled by how
     * filament-like it is there) and across it.
     */
    along: 5,
    across: 1.4,
    /**
     * Extra clumps, a Thomas cluster process: parents spread by radius like frame 01 (even count per
     * radius, so denser inward), each a Gaussian blob stretched along a random direction and
     * slightly curved.
     */
    clumps: {
      dots: [16, 90] as [number, number],
      sigma: [3, 13] as [number, number],
      stretch: [1, 3.5] as [number, number],
      curve: 0.025,
      radius: [90, 1080] as [number, number],
    },
    /**
     * Share of dots in clumps right at the centre, so the core is as concentrated as frame 01's
     * (about 29% of on-screen dots within 100 px) but lumpy rather than a smooth blob.
     */
    coreClumps: { share: 0.05, radius: 70, sigma: [4, 12] as [number, number] },
    /** Idle shimmer while waiting: noise displacement (design px) and how fast it evolves. */
    shimmer: { amplitude: 3, rate: 0.12 },
  },
  /** Seconds for the nebula to fade in on load. */
  fadeIn: 0.7,

  // ----- Scroll -----
  scroll: {
    /** The nebula has become rings by this much of the track; the dive takes the rest. */
    organizeEnd: 0.42,
    /**
     * The sequence is scrubbed: it maps to the scroll position. The playhead only eases toward it
     * at this rate (1/s; about 0.1 s to catch up) so wheel notches glide instead of stepping.
     */
    smoothing: 14,
  },

  // ----- Organise: nebula to rings, over the first part of the scroll -----
  organize: {
    /**
     * Each dot moves in a straight line to its slot over `duration` of the phase, easing in and
     * out. Inner rings start first (`radialDelay`), then a smooth noise over the nebula
     * (`clumpDelay`) so neighbouring dots, and so whole clumps, set off together. Delays and
     * duration add up to 1 so every dot lands by the phase's end.
     */
    duration: 0.68,
    radialDelay: 0.18,
    clumpDelay: 0.14,
    /** Scale (design px) of the timing noise: about the size of a clump. */
    clumpScale: 260,
    /**
     * Refining the pairing: up to `passes` sweeps of pair swaps, each slot checked against the
     * slots within a `cell` px grid cell of itself and of its nebula dot.
     */
    refine: { passes: 10, cell: 40 },
    /**
     * Motion blur: moving dots are drawn as streaks covering this many seconds of their motion
     * (under half a frame at 60 fps: a hint of speed). A fast flick can move the playhead a long
     * way per frame, so a streak never spans more than `maxBlur` of the track.
     */
    shutter: 0.007,
    maxBlur: 0.0017,
  },

  // ----- Swarm: the rings turn with the scroll -----
  swarm: {
    /**
     * Each ring turns this far (rad) over the whole track, alternating direction ring to ring
     * (and band to band in the core). It is scaled by (450 / r) ^ 0.5, capped at 2×, so inner rings
     * turn further, and by 0.75–1.25 per ring.
     */
    turn: 1.6,
    /** Each dot turns up to ±spread faster or slower than its ring, so groups loosen and regroup. */
    spread: 0.1,
    /** And drifts in and out by up to `wobble` design px, `waves` times over the track. */
    wobble: 4,
    waves: 5,
  },

  // Vertical optical slices, echoing the alternating cuts in the brand mark.
  slits: {
    pitch: 170,
    shift: 40,
    edgeSharpness: 7,
    coreQuiet: 55,
    coreBlend: 150,
    breathRate: .45,
    nebulaStrength: .55,
    diveFade: [.05, .45] as [number, number],
  },

  // ----- Dive -----
  dive: {
    /**
     * Depth: outer ring at 1, inner rings further, by (988 / r) ^ depthPower. 0 is a flat zoom,
     * 1 a tunnel of equal rings; in between gives parallax without emptying the view too soon.
     */
    depthPower: 0.6,
    /** The colour falloff widens as the camera closes in (× 1 + fadeGrow at the end). */
    fadeGrow: 1.4,
    depthJitter: 0.03,
    coreDepthJitter: 0.12,
    /**
     * The camera zooms on the centre dot, smoothly in log-magnification: log k = log kEnd ×
     * progress ^ ease, where kEnd is the magnification at which that dot covers the stage. A higher
     * ease spends longer among the rings and saves the steep part for the end.
     */
    ease: 2.5,
    /** Roll of the whole field over the dive (rad). */
    roll: 0.45,
    /**
     * Every dot, the centre one included, is drawn at radius × k ^ sizePower, where k is its own
     * on-screen magnification. 1 is true perspective: dots at the centre dot's depth grow exactly
     * as it does. Below 1 the centre dot must be magnified far more to fill the screen, so its
     * peers are long gone and it ends up alone among smaller, deeper dots.
     */
    sizePower: 1,
    /**
     * Core dots within this distance of the centre (design px) sit well behind the centre dot
     * (12–40% deeper), so nothing is in the camera's path and they read as small, far dots. The
     * only dots that keep pace with the centre one are its `core.peers`.
     */
    axisClear: 15,
  },

  // ----- Reveal: into the centre dot -----
  reveal: {
    /** Desktop rise; compact screens use a smaller travel distance. */
    rise: .5,
    maxRise: 420,
  },
  /** The copy is gone by this much of the dive. */
  copyFadeEnd: 0.2,
  copyLift: 24,
  /** Colour steps for batching dots into a few fills. */
  shades: 48,
};

interface Mount {
  /** The scroll track: its scroll range drives the organise and the dive. */
  track: HTMLElement;
  /** Holds the canvas. */
  stage: HTMLElement;
  /** Fades out over the first part of the dive. */
  content: HTMLElement;
  /** The next section: clipped to the centre dot, so it shows through as the dot grows. */
  next: HTMLElement;
  /** Called after the canvas and source particle field are ready. */
  onReady: () => void;
}

/** A dot's placement: position (design px from the centre) and its own organise progress. */
interface Spot {
  x: number;
  y: number;
  e: number;
}

interface Field {
  count: number;
  /** Settled polar position at the top of the track (design px, rad). */
  ringRadius: Float32Array;
  ringAngle: Float32Array;
  /** How far the dot turns over the whole track (rad): its ring's turn, ± its own spread. */
  rate: Float32Array;
  /** Phase of the dot's in-and-out drift (rad). */
  phase: Float32Array;
  /** Nebula position (design px from the centre). */
  nebulaX: Float32Array;
  nebulaY: Float32Array;
  /** When the dot starts moving, as a fraction of the organise phase. */
  delay: Float32Array;
  /** Depth: 1 = the outer ring. */
  depth: Float32Array;
  /** Depth of the centre dot the dive ends in (the middle of the core). */
  targetDepth: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const wrapAngle = (a: number) => a - TAU * Math.round(a / TAU);
const positiveAngle = (a: number) => ((a % TAU) + TAU) % TAU;

/** Where the field's centre sits on a w × h stage, and the design-px-to-screen scale. */
const layout = (w: number, h: number) => {
  const centre = w < CONFIG.narrow.maxWidth ? CONFIG.narrow.centre : CONFIG.centre;
  return { cx: w * centre.x, cy: h * centre.y, scale: Math.hypot(w, h) / DESIGN_DIAGONAL };
};
/** The shimmer's flow grid, in design px around the centre: half the noise's feature size per cell. */
const FLOW = (() => {
  const cell = 75, halfWidth = 1275, halfHeight = 825, scale = 150;
  return { cell, halfWidth, halfHeight, scale, cols: (2 * halfWidth) / cell + 1, rows: (2 * halfHeight) / cell + 1 };
})();
const depthAt = (r: number) => (CONFIG.rings[CONFIG.rings.length - 1].r / Math.max(r, 60)) ** CONFIG.dive.depthPower;

/** The nebula: `n` points, frame 01's dots resampled along their filaments plus extra clumps. */
function nebulaPoints(p: p5, n: number) {
  const neb = CONFIG.nebula;
  const { points, stride } = frame01;
  const out: { x: number; y: number }[] = [];

  const fromFrame = Math.round(n * neb.frame01Share);
  for (let k = 0; k < fromFrame; k++) {
    const j = Math.floor(p.random(points.length / stride)) * stride;
    const [x, y, angle, anisotropy] = [points[j], points[j + 1], points[j + 2], points[j + 3]];
    const along = p.randomGaussian(0, neb.across + neb.along * anisotropy);
    const across = p.randomGaussian(0, neb.across);
    out.push({
      x: x + Math.cos(angle) * along - Math.sin(angle) * across,
      y: y + Math.sin(angle) * along + Math.cos(angle) * across,
    });
  }

  const c = neb.clumps;
  /** Adds clumps until there are `until` points, with parents at a radius drawn from `radius`. */
  const addClumps = (until: number, radius: () => number, sigmaRange: [number, number]) => {
    while (out.length < until) {
      const r = radius();
      const a = p.random(TAU);
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      const size = Math.round(p.random(c.dots[0], c.dots[1]));
      const sigma = p.random(sigmaRange[0], sigmaRange[1]);
      const stretch = p.random(c.stretch[0], c.stretch[1]);
      const dir = p.random(TAU);
      const bend = p.random(-c.curve, c.curve);
      for (let k = 0; k < size && out.length < until; k++) {
        const u = p.randomGaussian(0, sigma * stretch);
        const v = p.randomGaussian(0, sigma) + bend * u * u;
        out.push({ x: px + Math.cos(dir) * u - Math.sin(dir) * v, y: py + Math.sin(dir) * u + Math.cos(dir) * v });
      }
    }
  };
  const centre = neb.coreClumps;
  addClumps(out.length + Math.round(n * centre.share), () => centre.radius * Math.sqrt(p.random()), centre.sigma);
  addClumps(n, () => p.random(c.radius[0], c.radius[1]), c.sigma);
  return out;
}

function build(p: p5): Field {
  p.randomSeed(CONFIG.seed);
  p.noiseSeed(CONFIG.seed);
  p.noiseDetail(2, 0.5);
  const organize = CONFIG.organize;
  const swarm = CONFIG.swarm;

  // ----- Settled targets: ring slots kept after dropout, then the core. `group` ties dots that are
  // matched together by angle and turn together: one ring, or one radius band of the core.
  interface Target {
    a: number;
    r: number;
    z: number;
    group: number;
    rate: number;
  }
  const targets: Target[] = [];
  const allRings = [...CONFIG.rings, ...CONFIG.outerRings.map((r) => ({ r, fill: 1 }))];
  allRings.forEach((ring, i) => {
    const slots = Math.round((TAU * ring.r) / CONFIG.slotSpacing);
    const keep = (CONFIG.density.base + CONFIG.density.perRadius / ring.r) * CONFIG.slotSpacing * ring.fill;
    const phase = p.random(TAU);
    const z = depthAt(ring.r);
    for (let k = 0; k < slots; k++) {
      const a = phase + (k / slots) * TAU;
      const cx = Math.cos(a), cy = Math.sin(a);
      // Density drifts along the ring, so some arcs are fuller than others.
      const along = 0.7 + 0.6 * p.noise(cx * 1.4 + i * 11.1, cy * 1.4, 7.7);
      if (p.random() > keep * along) continue;
      const bend = (p.noise(cx * 3 + i * 5.3, cy * 3 + 3.1, 1.3) - 0.5) * 2 * CONFIG.bend;
      targets.push({
        a,
        r: ring.r + bend + p.randomGaussian(0, CONFIG.thickness),
        z: z * (1 + p.randomGaussian(0, CONFIG.dive.depthJitter)),
        group: i,
        rate: 0,
      });
    }
  });

  // Core, at the far end of the dive, around the centre dot (at coreDepth). Dots close to the axis
  // sit well behind it, apart from its few peers at the same depth.
  const core = CONFIG.core;
  const coreDepth = depthAt(core.discRadius);
  const addCore = (count: number, radius: () => number) => {
    for (let k = 0; k < count; k++) {
      let r;
      do r = Math.abs(radius());
      while (r > core.maxRadius);
      const z =
        r < CONFIG.dive.axisClear
          ? coreDepth * (1.12 + p.random(0.28))
          : coreDepth * (1 + Math.max(-0.3, Math.min(0.3, p.randomGaussian(0, CONFIG.dive.coreDepthJitter))));
      targets.push({ a: p.random(TAU), r, z, group: -1, rate: 0 });
    }
  };
  addCore(core.disc, () => core.discRadius * Math.sqrt(p.random()) + p.randomGaussian(0, 6));
  addCore(core.halo, () => Math.hypot(p.randomGaussian(0, core.haloSigma), p.randomGaussian(0, core.haloSigma)));
  addCore(core.seed, () => Math.hypot(p.randomGaussian(0, core.seedSigma), p.randomGaussian(0, core.seedSigma)));

  // Peers: at the centre dot's depth, spaced so no two (or a peer and the centre dot) overlap as
  // they grow together.
  const peers = core.peers;
  const placed: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  const clearance = CONFIG.dotRadius.rings * 2.4;
  for (let tries = 0; placed.length <= peers.count && tries < 500; tries++) {
    const a = p.random(TAU);
    const r = p.random(peers.minRadius, peers.maxRadius);
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < clearance)) continue;
    placed.push({ x, y });
    // Even 1% deeper would leave a peer at half the centre dot's size by the end, so keep them close.
    targets.push({ a, r, z: coreDepth * (1 + p.random(0.003)), group: -1, rate: 0 });
  }

  // The core is matched and turned in radius bands of about 120 dots, like thin rings.
  targets
    .filter((t) => t.group < 0)
    .sort((a, b) => a.r - b.r)
    .forEach((t, k) => (t.group = allRings.length + Math.floor(k / 120)));

  // The swarm: each group turns over the track, alternating direction, inner groups further; each
  // dot a little faster or slower than its group.
  const groupRates = new Map<number, number>();
  for (const t of targets) {
    if (!groupRates.has(t.group)) {
      const radius = t.group < allRings.length ? allRings[t.group].r : Math.max(t.r, 20);
      const reach = Math.min(2, (450 / radius) ** 0.5);
      groupRates.set(t.group, (t.group % 2 ? 1 : -1) * swarm.turn * reach * (0.75 + 0.5 * p.random()));
    }
    t.rate = groupRates.get(t.group)! * (1 + swarm.spread * p.random(-1, 1));
  }

  const count = targets.length;
  const sources = nebulaPoints(p, count);
  const sourceRadius = sources.map((s) => Math.hypot(s.x, s.y));
  const sourceAngle = sources.map((s) => Math.atan2(s.y, s.x));
  // Slots turn with the scroll, so pair against where they are half-way through the organise phase.
  const mid = CONFIG.scroll.organizeEnd * 0.5;
  const midAngle = targets.map((t) => t.a + t.rate * mid);

  // ----- Pairing: optimal transport, minimising total squared straight-line travel.
  // Start in polar coordinates. Radius first (1D, so pairing by rank is optimal): the k-th closest
  // nebula dot goes to the k-th closest slot. Then angle within each ring (1D on a circle): nebula
  // dots and slots in angular order, paired with the cyclic shift that moves them least.
  const byTargetRadius = targets.map((_, i) => i).sort((i, j) => targets[i].r - targets[j].r);
  const bySourceRadius = sources.map((_, i) => i).sort((i, j) => sourceRadius[i] - sourceRadius[j]);
  const groups = new Map<number, { t: number[]; s: number[] }>();
  byTargetRadius.forEach((ti, k) => {
    const g = targets[ti].group;
    const entry = groups.get(g) ?? groups.set(g, { t: [], s: [] }).get(g)!;
    entry.t.push(ti);
    entry.s.push(bySourceRadius[k]);
  });

  const source = new Int32Array(count);
  for (const { t, s } of groups.values()) {
    const from = s.map((i) => ({ i, a: positiveAngle(sourceAngle[i]) })).sort((a, b) => a.a - b.a);
    const to = t.map((i) => ({ i, a: positiveAngle(midAngle[i]) })).sort((a, b) => a.a - b.a);
    const n = t.length;
    let best = 0, bestCost = Infinity;
    for (let shift = 0; shift < n; shift++) {
      let cost = 0;
      for (let j = 0; j < n && cost < bestCost; j++) cost += wrapAngle(to[(j + shift) % n].a - from[j].a) ** 2;
      if (cost < bestCost) {
        bestCost = cost;
        best = shift;
      }
    }
    for (let j = 0; j < n; j++) source[to[(j + best) % n].i] = from[j].i;
  }

  // Then refine in the plane: swap the nebula dots of two slots whenever that shortens their summed
  // squared distance (2-opt on the pairing), checking slots near each slot and near its nebula dot.
  // With squared distances, a swap that untangles two crossing paths always shortens them.
  const tx = Float32Array.from(targets, (t, i) => Math.cos(midAngle[i]) * t.r);
  const ty = Float32Array.from(targets, (t, i) => Math.sin(midAngle[i]) * t.r);
  const sx = Float32Array.from(sources, (s) => s.x);
  const sy = Float32Array.from(sources, (s) => s.y);
  const { cell, passes } = organize.refine;
  const cellKey = (gx: number, gy: number) => (gx + 1000) * 4000 + (gy + 1000);
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < count; i++) {
    const key = cellKey(Math.floor(tx[i] / cell), Math.floor(ty[i] / cell));
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(i);
  }
  const cost = (t: number, s: number) => (tx[t] - sx[s]) ** 2 + (ty[t] - sy[s]) ** 2;
  for (let pass = 0; pass < passes; pass++) {
    let swaps = 0;
    for (let i = 0; i < count; i++) {
      const around = [tx[i], ty[i], sx[source[i]], sy[source[i]]];
      for (let c = 0; c < 4; c += 2) {
        const gx = Math.floor(around[c] / cell), gy = Math.floor(around[c + 1] / cell);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const list = buckets.get(cellKey(gx + dx, gy + dy));
            if (!list) continue;
            for (const j of list) {
              if (j === i) continue;
              const si = source[i], sj = source[j];
              if (cost(i, sj) + cost(j, si) < cost(i, si) + cost(j, sj) - 1e-3) {
                source[i] = sj;
                source[j] = si;
                swaps++;
              }
            }
          }
        }
      }
    }
    if (swaps < count * 0.002) break;
  }

  // ----- Per dot: where it starts and when it sets off. The timing noise is sampled where the dot
  // starts, so a clump sets off together.
  const lastRing = CONFIG.rings[CONFIG.rings.length - 1].r;
  const delay = new Float32Array(count);
  const nebulaX = new Float32Array(count);
  const nebulaY = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const s = source[i];
    nebulaX[i] = sx[s];
    nebulaY[i] = sy[s];
    const clump = clamp01((p.noise(sx[s] / organize.clumpScale + 300, sy[s] / organize.clumpScale + 300) - 0.25) / 0.5);
    delay[i] = organize.radialDelay * Math.min(1, targets[i].r / lastRing) + organize.clumpDelay * clump;
  }

  return {
    count,
    ringRadius: Float32Array.from(targets, (t) => t.r),
    ringAngle: Float32Array.from(targets, (t) => t.a),
    rate: Float32Array.from(targets, (t) => t.rate),
    phase: Float32Array.from(targets, () => p.random(TAU)),
    nebulaX,
    nebulaY,
    delay,
    depth: Float32Array.from(targets, (t) => t.z),
    targetDepth: coreDepth,
  };
}

/** The fill for each shade step, from background (0) to foreground (shades - 1). */
function shadeFills(steps: number, background?: number[]) {
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const bg = background ?? hex(CONFIG.colors.background);
  const fg = hex(CONFIG.colors.foreground);
  return Array.from({ length: steps }, (_, s) => {
    const t = s / (steps - 1);
    const c = bg.map((b, i) => Math.round(b + (fg[i] - b) * t));
    return `rgb(${c[0]} ${c[1]} ${c[2]})`;
  });
}

export function mountHeroField({ track, stage, content, next, onReady }: Mount) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const compact = window.matchMedia('(max-width: 767px), (max-height: 600px) and (pointer: coarse)');
  // CSS reserves the responsive track before hydration; share those same
  // lengths with the canvas instead of maintaining a second timing table.
  let particleEnd = 1, whiteStart = 0, whiteEnd = 1;
  const readTimeline = () => {
    const css = getComputedStyle(track);
    const total = Number(css.getPropertyValue('--hero-scroll-length'));
    particleEnd = Number(css.getPropertyValue('--hero-particle-length')) / total;
    whiteStart = Number(css.getPropertyValue('--hero-white-start')) / total;
    whiteEnd = Number(css.getPropertyValue('--hero-white-end')) / total;
  };
  let fills = shadeFills(CONFIG.shades);
  const cream = [1, 3, 5].map(i => parseInt(CONFIG.colors.background.slice(i, i + 2), 16));
  // Resolve the actual section token (including wide-gamut CSS colors) to the
  // canvas's sRGB space, so its faint particles match the changing background.
  const swatch = document.createElement('canvas');
  swatch.width = swatch.height = 1;
  const swatchContext = swatch.getContext('2d')!;
  swatchContext.fillStyle = getComputedStyle(next).backgroundColor;
  swatchContext.fillRect(0, 0, 1, 1);
  const paper = Array.from(swatchContext.getImageData(0, 0, 1, 1).data).slice(0, 3);
  let surfaceStep = -1;
  const blendBackground = (dive: number) => {
    const step = Math.round(smoothstep(.1, .9, dive) * 128);
    if (step === surfaceStep) return;
    surfaceStep = step;
    const background = cream.map((c, i) => c + (paper[i] - c) * step / 128);
    track.style.setProperty('--hero-surface', `rgb(${background.map(c => c.toFixed(3)).join(' ')})`);
    fills = shadeFills(CONFIG.shades, background);
  };
  let disposed = false;
  let ready = false;
  let visible = true;
  let field: Field | null = null;
  /** Seconds since the field mounted: drives the fade-in, the nebula drift and the ring spin. */
  let clock = 0;
  let start = 0;
  let progress = 0;
  /** Where the sequence is (track progress 0–1), and how fast it moves (per second). */
  let playhead = 0;
  let velocity = 0;
  let lastFrame = performance.now();
  // Screen-space interaction preserves the previous hero's feel at every zoom.
  // Offsets are independent of the scroll choreography and never move the reveal mask.
  let offsetX = new Float32Array(0), offsetY = new Float32Array(0);
  let scatterX = new Float32Array(0), scatterY = new Float32Array(0);
  type Sweep = { x: number; y: number; dx: number; dy: number; length: number; power: number };
  const sweeps: Sweep[] = [];
  const pointer = { x: 0, y: 0, active: false, stamp: 0, power: 0 };
  let interaction = 1;
  const pointerLeave = () => { pointer.active = false; };
  const resetPointer = () => { pointerLeave(); sweeps.length = 0; };
  const pointerMove = (event: PointerEvent) => {
    if (!ready || reducedMotion.matches || !visible || document.hidden || interaction === 0) return;
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) { resetPointer(); return; }
    const now = performance.now();
    const dt = Math.max(8, now - pointer.stamp);
    if (pointer.active) {
      const dx = x - pointer.x, dy = y - pointer.y;
      const length = Math.hypot(dx, dy);
      pointer.power = Math.min(1, length / dt / 2);
      // Consume actual travel once, including the whole path of a fast flick.
      if (length > .1) {
        if (sweeps.length === 24) sweeps.shift();
        sweeps.push({ x: pointer.x, y: pointer.y, dx, dy, length, power: pointer.power });
      }
    }
    pointer.x = x; pointer.y = y; pointer.stamp = now; pointer.active = true;
  };
  track.addEventListener('pointermove', pointerMove, { passive: true });
  track.addEventListener('pointerdown', pointerMove, { passive: true });
  track.addEventListener('pointerleave', pointerLeave);
  track.addEventListener('pointerup', pointerLeave);
  track.addEventListener('pointercancel', resetPointer);

  /** Scroll progress through the track: 0 at the top of the page, 1 when the stage unpins. */
  const readProgress = () => {
    const rect = track.getBoundingClientRect();
    const range = rect.height - (stage.parentElement?.offsetHeight ?? window.innerHeight);
    const value = range > 0 ? clamp01(-rect.top / range) : 0;
    // ScrollSmoother can settle a fraction of a pixel before its destination.
    // Resolve the endpoints exactly so the revealed section is fully unclipped.
    return value > 0.9999 ? 1 : value < 0.0001 ? 0 : value;
  };

  /** Splits track progress into the organise phase and the dive, each 0–1. */
  const phases = (t: number) => {
    const particle = reducedMotion.matches ? t : clamp01(t / particleEnd);
    const end = CONFIG.scroll.organizeEnd;
    return { organize: clamp01(particle / end), dive: clamp01((particle - end) / (1 - end)) };
  };

  /**
   * Eases the playhead toward the scroll position (scrubbing, with a short glide) and records how
   * fast it moved, for the motion blur. Under reduced motion it follows the scroll directly.
   */
  const advance = (dt: number, still: boolean) => {
    const before = playhead;
    if (still) playhead = progress;
    else playhead += (progress - playhead) * (1 - Math.exp(-dt * CONFIG.scroll.smoothing));
    if (Math.abs(progress - playhead) < 1e-4) playhead = progress;
    velocity = dt > 0 ? (playhead - before) / dt : 0;
  };

  const applyCopy = (dive: number) => {
    const fade = smoothstep(0, CONFIG.copyFadeEnd, dive);
    content.style.opacity = String(1 - fade);
    content.style.transform = fade > 0 ? `translate3d(0, ${(-CONFIG.copyLift * fade).toFixed(2)}px, 0)` : '';
    content.toggleAttribute('data-hidden', fade >= 1);
    content.inert = fade >= 1;
  };

  /** Scratch for the per-dot placement: now, and for the motion blur. */
  const here: Spot = { x: 0, y: 0, e: 0 };
  const then: Spot = { x: 0, y: 0, e: 0 };
  const flowX = new Float32Array(FLOW.cols * FLOW.rows);
  const flowY = new Float32Array(FLOW.cols * FLOW.rows);

  let lastClip = '';
  let lastOffset = '';
  /** An opaque white aperture reveals the opaque section; only its vertical position changes. */
  const applyReveal = (
    x: number,
    y: number,
    radius: number,
    cover: number,
    offset: number,
  ) => {
    const clip =
      radius >= cover - 0.01
        ? 'none'
        : `circle(${Math.max(0, radius).toFixed(2)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
    if (clip !== lastClip) {
      next.style.clipPath = clip;
      lastClip = clip;
    }
    const complete = radius >= cover - 0.01;
    next.inert = !complete;
    next.setAttribute('aria-hidden', String(!complete));
    const value = `${offset.toFixed(2)}px`;
    if (value !== lastOffset) {
      next.style.setProperty('--reveal-offset', value);
      lastOffset = value;
    }
  };

  let resizeField = () => {};
  const instance = new p5((p: p5) => {
    p.setup = () => {
      if (disposed) return;
      readTimeline();
      const renderer = p.createCanvas(stage.clientWidth, stage.clientHeight);
      (renderer.elt as HTMLCanvasElement).style.touchAction = 'auto';
      // Tiny dots need the screen's full backing resolution. Limit animation
      // cadence on touch devices, not the sharpness of their Retina canvas.
      p.pixelDensity(window.devicePixelRatio || 1);
      p.frameRate(coarse.matches ? 30 : 60);
      field = build(p);
      offsetX = new Float32Array(field.count);
      offsetY = new Float32Array(field.count);
      scatterX = Float32Array.from({ length: field.count }, (_, i) => Math.cos(i * 2.399963 + field!.ringRadius[i]));
      scatterY = Float32Array.from({ length: field.count }, (_, i) => Math.sin(i * 2.399963 + field!.ringRadius[i]));
      ready = true;
      stage.dataset.ready = 'true';
      onReady();
      if (reducedMotion.matches || document.hidden) p.noLoop();
      progress = playhead = readProgress();
      applyCopy(phases(playhead).dive);
      start = p.millis();
    };

    p.windowResized = resizeField = () => {
      readTimeline();
      // Mobile browser chrome can resize the visual viewport without changing
      // our stable svh stage. Avoid resetting its canvas or interaction then.
      const density = window.devicePixelRatio || 1;
      if (p.width === stage.clientWidth && p.height === stage.clientHeight && p.pixelDensity() === density) return;
      p.pixelDensity(density);
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      resetPointer();
      offsetX.fill(0); offsetY.fill(0);
    };

    p.draw = () => {
      if (!field || disposed) return;
      const now = performance.now();
      const dt = Math.min(0.25, (now - lastFrame) / 1000);
      lastFrame = now;
      const still = reducedMotion.matches;
      clock = (p.millis() - start) / 1000;

      // Scroll moves the target; the sequence follows the playhead.
      progress = readProgress();
      advance(dt, still);
      track.dataset.progress = playhead.toFixed(3);
      const phase = phases(playhead);
      blendBackground(phase.dive);
      applyCopy(phase.dive);
      interaction = still ? 0 : 1 - smoothstep(.2, .65, phase.dive);
      if (interaction === 0) resetPointer();
      // Exact previous-hero relaxation and reach: no momentum or spring overshoot.
      const physicsDt = Math.min(dt, .04);
      const settle = Math.exp(-1.65 * physicsDt);
      pointer.power *= Math.exp(-2.8 * physicsDt);
      const reach = coarse.matches ? 80 : 110;
      let maxDisplacement = 0;
      for (let i = 0; i < offsetX.length; i++) {
        offsetX[i] = interaction === 0 ? 0 : offsetX[i] * settle;
        offsetY[i] = interaction === 0 ? 0 : offsetY[i] * settle;
      }

      const w = p.width;
      const h = p.height;
      const { cx, cy, scale } = layout(w, h);

      // Camera: one zoom on the centre dot, smooth in log-magnification, ending where that dot
      // covers the stage. Every dot (the centre one too) is k ^ sizePower times its resting size at
      // its own magnification k, so the centre dot grows exactly like its neighbours; it only fills
      // the screen because it sits on the axis while they stream outward past the edges. Under
      // reduced motion the rings are already formed, there is no dive, and the field fades as the
      // next section appears without zooming or rising.
      const f = field;
      const dive = CONFIG.dive;
      const reveal = CONFIG.reveal;
      const target = f.targetDepth;
      const targetDot = CONFIG.dotRadius.rings;
      const cover = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 2;
      const kEnd = (cover / targetDot) ** (1 / dive.sizePower);
      const zoom = still ? 0 : phase.dive ** dive.ease;
      const targetK = kEnd ** zoom;
      const camera = target * (1 - 1 / targetK);
      const dotRadius = phase.dive > 0 ? targetDot * targetK ** dive.sizePower : 0;
      const whiteProgress = still ? (phase.dive >= .85 ? 1 : 0)
        : clamp01((playhead - whiteStart) / (whiteEnd - whiteStart));
      // Never let the white seed overtake the green particle containing it.
      const whiteRadius = still ? cover * whiteProgress
        : Math.min(dotRadius, cover * smootherstep(whiteProgress));
      const offset = still ? 0 : (compact.matches ? Math.min(h * .24, 180) : Math.min(h * reveal.rise, reveal.maxRise))
        * (1 - smoothstep(0, 1, whiteProgress));
      applyReveal(cx, cy, whiteRadius, cover, offset);

      const travel = still ? 0 : smoothstep(0, 0.8, phase.dive);
      const fadeRadius = CONFIG.fadeRadius * scale * (1 + dive.fadeGrow * travel);
      const roll = travel * dive.roll;
      const cosR = Math.cos(roll), sinR = Math.sin(roll);
      const stillFade = still ? 1 - smoothstep(0, 0.4, phase.dive) : 1;

      const organize = CONFIG.organize;
      const swarm = CONFIG.swarm;
      const neb = CONFIG.nebula;
      const fadeIn = still ? 1 : clamp01(clock / CONFIG.fadeIn);
      // The swarm turns with the scroll (not under reduced motion).
      const turned = still ? 0 : clamp01(playhead / particleEnd);
      const slits = CONFIG.slits;
      // The cuts hold their position; only their displacement breathes gently.
      // Flattening a sine creates broad translated bands with soft, narrow seams.
      // Keep the seed intact and remove the distortion before the reveal expands.
      const slitStrength = (still ? 1 : .88 + .12 * Math.sin(clock * slits.breathRate))
        * (slits.nebulaStrength + (1 - slits.nebulaStrength) * smoothstep(0, 1, phase.organize))
        * (1 - smoothstep(slits.diveFade[0], slits.diveFade[1], phase.dive));

      // The waiting nebula shimmers until every dot has left. The shimmer's flow field is sampled on
      // a coarse grid once per frame and looked up per dot.
      const shimmering = !still && phase.organize < 1;
      if (shimmering) {
        const t = clock * neb.shimmer.rate;
        for (let row = 0, k = 0; row < FLOW.rows; row++) {
          const v = (row * FLOW.cell - FLOW.halfHeight) / FLOW.scale;
          for (let col = 0; col < FLOW.cols; col++, k++) {
            const u = (col * FLOW.cell - FLOW.halfWidth) / FLOW.scale;
            // Two octaves of Perlin noise sit mostly within 0.25–0.75, so ×4 maps them to about ±1.
            flowX[k] = (p.noise(u + 7.3, v, t) - 0.5) * 4;
            flowY[k] = (p.noise(u, v + 3.7, t + 19) - 0.5) * 4;
          }
        }
      }

      /**
       * Where dot i is at organise progress o with the swarm turned to track progress t (design px
       * from the centre), and its own progress e. Its slot turns with the swarm; the dot moves in a
       * straight line from its nebula position toward it, easing in and out.
       */
      const place = (i: number, o: number, t: number, out: Spot) => {
        const e = still ? 1 : clamp01((o - f.delay[i]) / organize.duration);
        const a = f.ringAngle[i] + f.rate[i] * t;
        const r = f.ringRadius[i] + (still ? 0 : swarm.wobble * Math.sin(swarm.waves * TAU * t + f.phase[i]));
        let x = Math.cos(a) * r;
        let y = Math.sin(a) * r;
        if (e < 1) {
          const k = smootherstep(e);
          let nx = f.nebulaX[i], ny = f.nebulaY[i];
          if (shimmering) {
            // Bilinear lookup in this frame's flow grid.
            const gx = Math.min(FLOW.cols - 1.001, Math.max(0, (nx + FLOW.halfWidth) / FLOW.cell));
            const gy = Math.min(FLOW.rows - 1.001, Math.max(0, (ny + FLOW.halfHeight) / FLOW.cell));
            const ix = gx | 0, iy = gy | 0;
            const fx = gx - ix, fy = gy - iy;
            const c = iy * FLOW.cols + ix;
            const c2 = c + FLOW.cols;
            const amount = neb.shimmer.amplitude * (1 - e);
            nx += amount * ((flowX[c] * (1 - fx) + flowX[c + 1] * fx) * (1 - fy) + (flowX[c2] * (1 - fx) + flowX[c2 + 1] * fx) * fy);
            ny += amount * ((flowY[c] * (1 - fx) + flowY[c + 1] * fx) * (1 - fy) + (flowY[c2] * (1 - fx) + flowY[c2 + 1] * fx) * fy);
          }
          x = nx + (x - nx) * k;
          y = ny + (y - ny) * k;
        }
        const coreBlend = smoothstep(slits.coreQuiet, slits.coreBlend, Math.hypot(x, y));
        const band = Math.tanh(Math.sin(x * Math.PI / slits.pitch) * slits.edgeSharpness);
        out.x = x + band * slits.shift * slitStrength * coreBlend;
        out.y = y;
        out.e = e;
      };

      // Motion blur: where the playhead was `shutter` seconds ago (capped).
      const lag = Math.max(-organize.maxBlur, Math.min(organize.maxBlur, velocity * organize.shutter));
      const lagPlayhead = clamp01(playhead - lag);
      const lagOrganize = phases(lagPlayhead).organize;
      const lagTurned = still ? 0 : clamp01(lagPlayhead / particleEnd);
      const blurring = !still && Math.abs(lag) > 1e-6 && phase.dive < 1;

      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, w, h);
      const dots = Array.from({ length: CONFIG.shades }, () => new Path2D());
      const streaks = Array.from({ length: CONFIG.shades }, () => new Path2D());
      const usedDots = new Uint8Array(CONFIG.shades);
      const usedStreaks = new Uint8Array(CONFIG.shades);

      // Once the dot covers the stage there is nothing left to draw.
      const count = !still && dotRadius >= cover ? 0 : f.count;
      for (let i = 0; i < count; i++) {
        place(i, phase.organize, turned, here);
        const e = here.e;

        // Camera: magnification k grows as the camera closes on the dot's depth.
        const z = f.depth[i];
        const gap = z - camera;
        if (gap <= 1e-6) continue;
        const k = z / gap;
        const m = scale * k;
        let sx = cx + (here.x * cosR - here.y * sinR) * m;
        let sy = cy + (here.x * sinR + here.y * cosR) * m;

        for (const sweep of sweeps) {
          const along = clamp01(((sx + offsetX[i] - sweep.x) * sweep.dx + (sy + offsetY[i] - sweep.y) * sweep.dy) / (sweep.length * sweep.length));
          const dx = sx + offsetX[i] - (sweep.x + sweep.dx * along);
          const dy = sy + offsetY[i] - (sweep.y + sweep.dy * along);
          const distance = Math.hypot(dx, dy);
          if (distance >= reach) continue;
          const influence = (1 - distance / reach) ** 2;
          const kick = Math.min(80, sweep.length) * (.16 + sweep.power * .6) * influence;
          offsetX[i] += (sweep.dx / sweep.length * .7 + dx / Math.max(1, distance) * .45 + scatterX[i] * .65) * kick;
          offsetY[i] += (sweep.dy / sweep.length * .7 + dy / Math.max(1, distance) * .45 + scatterY[i] * .65) * kick;
          const displacement = Math.hypot(offsetX[i], offsetY[i]);
          if (displacement > 120) { offsetX[i] *= 120 / displacement; offsetY[i] *= 120 / displacement; }
        }
        const shiftX = offsetX[i] * interaction, shiftY = offsetY[i] * interaction;
        maxDisplacement = Math.max(maxDisplacement, Math.hypot(shiftX, shiftY));
        sx += shiftX; sy += shiftY;

        const distance = Math.hypot(sx - cx, sy - cy);
        if (distance >= fadeRadius) continue;
        const shade = (1 - distance / fadeRadius) * fadeIn * stillFade;
        if (shade < 0.02) continue;

        const dot = (CONFIG.dotRadius.nebula + (CONFIG.dotRadius.rings - CONFIG.dotRadius.nebula) * e) * k ** dive.sizePower;
        if (sx < -dot || sy < -dot || sx > w + dot || sy > h + dot) continue;

        const s = Math.round(shade * (CONFIG.shades - 1));
        if (blurring) {
          place(i, lagOrganize, lagTurned, then);
          const lx = cx + (then.x * cosR - then.y * sinR) * m + shiftX;
          const ly = cy + (then.x * sinR + then.y * cosR) * m + shiftY;
          if (Math.abs(lx - sx) + Math.abs(ly - sy) > 1.2) {
            streaks[s].moveTo(lx, ly);
            streaks[s].lineTo(sx, sy);
            usedStreaks[s] = 1;
          }
        }
        dots[s].moveTo(sx + dot, sy);
        dots[s].arc(sx, sy, dot, 0, TAU);
        usedDots[s] = 1;
      }
      sweeps.length = 0;
      stage.dataset.pointerEnergy = pointer.power.toFixed(3);
      stage.dataset.displacement = maxDisplacement.toFixed(3);
      ctx.lineCap = 'round';
      ctx.lineWidth = CONFIG.dotRadius.rings * 1.6;
      for (let s = 1; s < CONFIG.shades; s++) {
        if (usedStreaks[s]) {
          ctx.strokeStyle = fills[s];
          ctx.stroke(streaks[s]);
        }
        if (usedDots[s]) {
          ctx.fillStyle = fills[s];
          ctx.fill(dots[s]);
        }
      }
      // The green destination is a real particle underneath the white aperture.
      // Content is never blended through it, even partway through the transition.
      if (!still && dotRadius > 0) {
        ctx.fillStyle = CONFIG.colors.foreground;
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius, 0, TAU);
        ctx.fill();
      }
    };
  }, stage);

  // Keep the prototype's drawing work local to its visible, active stage.
  const sync = () => {
    if (!ready || disposed) return;
    readTimeline();
    if (!visible || document.hidden || reducedMotion.matches) {
      resetPointer();
      if (reducedMotion.matches) { offsetX.fill(0); offsetY.fill(0); pointer.power = 0; }
      instance.noLoop();
      if (visible && !document.hidden) void instance.redraw();
    } else { lastFrame = performance.now(); instance.loop(); }
  };
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  visibility.observe(track);
  // The pin refresh can finish after the window resize event. Observe the
  // actual canvas host too, so rotation never leaves an old-width drawing.
  let resizeFrame = 0;
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { if (ready && !disposed) resizeField(); });
  });
  resize.observe(stage);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  return {
    redraw: () => { if (ready && reducedMotion.matches && !disposed) void instance.redraw(); },
    destroy: () => {
      disposed = true;
      visibility.disconnect();
      resize.disconnect();
      cancelAnimationFrame(resizeFrame);
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
      track.removeEventListener('pointermove', pointerMove);
      track.removeEventListener('pointerdown', pointerMove);
      track.removeEventListener('pointerleave', pointerLeave);
      track.removeEventListener('pointerup', pointerLeave);
      track.removeEventListener('pointercancel', resetPointer);
      instance.remove();
      content.style.removeProperty('opacity');
      content.style.removeProperty('transform');
      content.removeAttribute('data-hidden');
      content.inert = false;
      next.inert = false;
      next.removeAttribute('aria-hidden');
      next.style.removeProperty('clip-path');
      next.style.removeProperty('opacity');
      next.style.removeProperty('--reveal-offset');
      track.style.removeProperty('--hero-surface');
    },
  };
}
