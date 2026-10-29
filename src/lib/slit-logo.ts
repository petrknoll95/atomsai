// The animated mark, ported from the atoms-ai-slit-logo sketch (sketch.js, default preset).
// Geometry is in a 100 × 100 space centered on x = 50: each slit clips a circle whose rightmost
// point meets the slit's right edge, mirrored around the center.

export const slitDefaults = {
  copies: 2,
  width: 20,
  widthRatio: 0.75,
  taper: 32 / 45,
  radius: 50,
  radiusFloor: 0.36,
  radiusRatio: 0.75,
  gap: -2,
  gapStep: 4,
  overlap: 2,
};

export interface Slit {
  /** 0 is the central pair, counting outward. */
  n: number;
  /** Left edge and width of the left-hand slit. */
  x: number;
  w: number;
  /** Center x and radius of the left-hand circle. */
  cx: number;
  r: number;
}

export function generateSlits(p = slitDefaults): Slit[] {
  const slits: Slit[] = [];
  let right = 50 + p.overlap / 2;
  for (let n = 0; n <= p.copies; n++) {
    const w = Math.max(0.5, p.width * p.widthRatio ** n * p.taper ** ((n * (n - 1)) / 2));
    const r = p.radius * (p.radiusFloor + (1 - p.radiusFloor) * p.radiusRatio ** n);
    if (n > 0) {
      const gap = Math.max(-0.8 * Math.min(w, slits[n - 1].w), p.gap + p.gapStep * (n - 1));
      right = slits[n - 1].x - gap;
    }
    slits.push({ n, x: right - w, w, cx: right - r, r });
  }
  return slits;
}

/**
 * One 4 s cycle: hold the full mark, circles retreat outward until they clear their slits, hold,
 * then return. Each pair is staggered, outer pair first and center pair last.
 */
export const slitMotion = {
  seconds: 4,
  stagger: 0.1,
  hide: [0.3, 0.52],
  reveal: [0.64, 0.86],
  /** How far each circle retreats beyond its slit width. */
  clearance: 2,
  easing: 'cubic-bezier(0.7, 0, 0.3, 1)',
  keySplines: '0 0 1 1;0.7 0 0.3 1;0 0 1 1;0.7 0 0.3 1;0 0 1 1',
};

/** Stagger as a fraction of the cycle: 0 for the outermost pair, `stagger` for the center pair. */
export const staggerOf = (n: number, copies = slitDefaults.copies) =>
  copies ? ((copies - n) / copies) * slitMotion.stagger : 0;

/** SMIL keyTimes for a pair: hold, hide, hold, reveal, hold. */
export const keyTimesOf = (n: number) => {
  const s = staggerOf(n);
  const { hide, reveal } = slitMotion;
  return [0, hide[0] + s, hide[1] + s, reveal[0] + s, reveal[1] + s, 1].map((t) => +t.toFixed(4)).join(';');
};

/** cubic-bezier(0.7, 0, 0.3, 1), solved for x as the sketch does (its y curve is smoothstep). */
export function ease(t: number) {
  const x = Math.max(0, Math.min(1, t));
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const u = (low + high) / 2;
    const curveX = 3 * (1 - u) * (1 - u) * u * 0.7 + 3 * (1 - u) * u * u * 0.3 + u * u * u;
    if (curveX < x) low = u;
    else high = u;
  }
  const u = (low + high) / 2;
  return u * u * (3 - 2 * u);
}

/** 0 while a pair fills its slits, 1 once it has cleared them, at a point in the cycle (0–1, before stagger). */
export function concealment(phase: number) {
  const { hide, reveal } = slitMotion;
  if (phase < hide[1]) return ease((phase - hide[0]) / (hide[1] - hide[0]));
  return 1 - ease((phase - reveal[0]) / (reveal[1] - reveal[0]));
}

export interface Blade {
  n: number;
  /** 1 for the left-hand blade, −1 for its mirror. */
  direction: 1 | -1;
  /** Slit left edge and width, circle center x and radius, in the 100 × 100 space. */
  x: number;
  w: number;
  cx: number;
  r: number;
  /** How far the circle retreats to clear its slit. */
  distance: number;
  /** Cycle offset for this pair. */
  stagger: number;
}

/** Every blade of the mark, both sides, in paint order. */
export function slitBlades(): Blade[] {
  return generateSlits().flatMap((s) =>
    ([1, -1] as const).map((direction) => ({
      n: s.n,
      direction,
      x: direction === 1 ? s.x : 100 - s.x - s.w,
      w: s.w,
      cx: direction === 1 ? s.cx : 100 - s.cx,
      r: s.r,
      distance: s.w + slitMotion.clearance,
      stagger: staggerOf(s.n),
    })),
  );
}

/** Clip height for every slit: the full height of the central circle. */
export const slitClip = { y: 50 - slitDefaults.radius, height: slitDefaults.radius * 2 };

/** The mark's bounding box: outermost slit edges and its tallest blade. */
export function markBounds() {
  const slits = generateSlits();
  const left = Math.min(...slits.map((s) => s.x));
  const half = Math.max(...slits.map((s) => Math.sqrt(s.r ** 2 - (s.x - s.cx) ** 2)));
  return { x: left, y: 50 - half, width: 100 - 2 * left, height: 2 * half };
}
