// The three left slits of the official mark, with their joins cut along the
// existing vertical edges. Reflect them to make the right side.
const markScale = .94 / 440;
export const carouselLogoTransform = `translate(${.5 - 220 * markScale} ${.5 - 200 * markScale}) scale(${markScale})`;
const centerSlit = [
  125, 0,
  173.035, 36.0783, 207.632, 89.0586, 220.5, 150.107,
  220.5, 249.883,
  207.634, 310.935, 173.037, 363.92, 125, 400,
];
const innerLobe = [
  50, 38.7695,
  87.2287, 67.0939, 114.337, 108.015, 125.5, 155.176,
  125.5, 244.814,
  114.338, 291.979, 87.23, 332.904, 50, 361.23,
];
const outerLobe = [
  0, 95.1465,
  24.8734, 122.994, 40, 159.734, 40, 200.01,
  40, 200.01,
  39.9996, 240.283, 24.8712, 277.016, 0, 304.863,
];

function normalize(points: number[], anchor: number, side: number) {
  return points.map((value, i) => .5 + (i % 2 ? value - 200 : (value - anchor) * side) * markScale);
}

function slitPath(points: number[]) {
  const coords = (start: number, size: number) =>
    points.slice(start, start + size).map(value => Number(value.toFixed(5))).join(' ');
  return `M${coords(0, 2)}C${coords(2, 6)}L${coords(8, 2)}C${coords(10, 6)}Z`;
}

// Two tangent cubic arcs describe a circle segment to the right of its chord.
function circleSegment(crop: number, side: number, radius: number) {
  const cut = Math.max(.5 - radius, Math.min(.5 + radius, crop));
  const angle = Math.acos(Math.min(1, Math.max(-1, (cut - .5) / radius)));
  const handle = (4 * radius / 3) * Math.tan(angle / 4);
  const tip = .5 + radius;
  const y = radius * Math.sin(angle);
  const dx = handle * Math.sin(angle);
  const dy = handle * Math.cos(angle);
  const points = [
    cut, .5 - y,
    cut + dx, .5 - y + dy, tip, .5 - handle, tip, .5,
    tip, .5,
    tip, .5 + handle, cut + dx, .5 + y - dy, cut, .5 + y,
  ];
  return side < 0 ? points : points.map((value, i) => i % 2 ? value : 1 - value);
}

export const carouselCirclePath = 'M0 .5A.5 .5 0 1 1 1 .5A.5 .5 0 1 1 0 .5Z';

/** Trace the two circular arcs and the straight edges of the masked disc. */
export function maskedCirclePath(radius: number, maskLeft: number, maskRight: number) {
  const left = Math.max(.5 - radius, maskLeft);
  const right = Math.min(.5 + radius, maskRight);
  if (left >= right) return '';

  const depth = (x: number) => Math.sqrt(Math.max(0, radius * radius - (x - .5) ** 2));
  const [lt, lb, rt, rb] = [.5 - depth(left), .5 + depth(left), .5 - depth(right), .5 + depth(right)];
  const fmt = (value: number) => Number(value.toFixed(5));
  const arc = `A${fmt(radius)} ${fmt(radius)} 0 0 1`;
  return `M${fmt(left)} ${fmt(lt)}${arc} ${fmt(right)} ${fmt(rt)}L${fmt(right)} ${fmt(rb)}${arc} ${fmt(left)} ${fmt(lb)}Z`;
}

export const carouselLogoCenter = 3;
export const carouselLogoProfiles = [20, 87.5, 172.5, 220, 267.5, 352.5, 420].map((anchor, index) => {
  const slot = index - carouselLogoCenter;
  if (slot === 0) return null;

  const side = Math.sign(slot);
  const source = [centerSlit, innerLobe, outerLobe][Math.abs(slot) - 1];
  const points = normalize(source, side > 0 ? 440 - anchor : anchor, side > 0 ? -1 : 1);
  return {
    offset: (anchor - 220) * markScale,
    morph(progress: number, crop: number, radius: number) {
      const target = circleSegment(crop, side, radius);
      return slitPath(points.map((value, i) => value + (target[i] - value) * progress));
    },
  };
});
