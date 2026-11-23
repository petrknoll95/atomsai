// The three left slits of the official mark, with their joins cut along the
// existing vertical edges. Reflect them to make the right side.
const markScale = .94 / 440;
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
function circleSegment(cut: number, side: number) {
  const angle = Math.acos(Math.min(1, Math.max(-1, cut * 2 - 1)));
  const handle = (2 / 3) * Math.tan(angle / 4);
  const y = .5 * Math.sin(angle);
  const dx = handle * Math.sin(angle);
  const dy = handle * Math.cos(angle);
  const points = [
    cut, .5 - y,
    cut + dx, .5 - y + dy, 1, .5 - handle, 1, .5,
    1, .5,
    1, .5 + handle, cut + dx, .5 + y - dy, cut, .5 + y,
  ];
  return side < 0 ? points : points.map((value, i) => i % 2 ? value : 1 - value);
}

export const carouselCirclePath = 'M0 .5A.5 .5 0 1 1 1 .5A.5 .5 0 1 1 0 .5Z';

export const carouselLogoCenter = 3;
export const carouselLogoProfiles = [20, 87.5, 172.5, 220, 267.5, 352.5, 420].map((anchor, index) => {
  const slot = index - carouselLogoCenter;
  if (slot === 0) return null;

  const side = Math.sign(slot);
  const source = [centerSlit, innerLobe, outerLobe][Math.abs(slot) - 1];
  const points = normalize(source, side > 0 ? 440 - anchor : anchor, side > 0 ? -1 : 1);
  return {
    offset: (anchor - 220) * markScale,
    morph(progress: number, crop: number) {
      const target = circleSegment(crop, side);
      return slitPath(points.map((value, i) => value + (target[i] - value) * progress));
    },
  };
});
