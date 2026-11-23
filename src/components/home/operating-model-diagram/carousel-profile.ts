// The official mark's middle contour and its two left lobes, with their joins
// cut along the existing vertical edges. Reflect the lobes to get the right side.
const markScale = .94 / 440;
const center = [
  125, 0,
  173.035, 36.0783, 207.632, 89.0586, 220, 150.107,
  232.368, 89.0586, 266.965, 36.0783, 315, 0,
  315, 400,
  266.963, 363.92, 232.366, 310.935, 220, 249.883,
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

const k = (Math.sqrt(2) - 1) * 2 / 3;
const circle = [
  0, .5,
  0, .5 - k, .5 - k, 0, .5, 0,
  .5 + k, 0, 1, .5 - k, 1, .5,
  1, .5,
  1, .5 + k, .5 + k, 1, .5, 1,
  .5 - k, 1, 0, .5 + k, 0, .5,
];

function profilePath(points: number[], middle: boolean) {
  const coords = (start: number, size: number) =>
    points.slice(start, start + size).map(value => Number(value.toFixed(5))).join(' ');
  return middle
    ? `M${coords(0, 2)}C${coords(2, 12)}L${coords(14, 2)}C${coords(16, 12)}`
    : `M${coords(0, 2)}C${coords(2, 6)}L${coords(8, 2)}C${coords(10, 6)}`;
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

export const carouselCirclePath = profilePath(circle, true);

export const carouselLogoProfiles = [20, 87.5, 220, 352.5, 420].map((anchor, index) => {
  const slot = index - 2;
  const side = Math.sign(slot);
  const middle = slot === 0;
  const source = middle ? center : Math.abs(slot) === 1 ? innerLobe : outerLobe;
  const points = normalize(source, side > 0 ? 440 - anchor : anchor, side > 0 ? -1 : 1);
  return {
    offset: (anchor - 220) * markScale,
    path: profilePath(points, middle),
    morph(progress: number, crop: number) {
      const target = middle ? circle : circleSegment(crop, side);
      return profilePath(points.map((value, i) => value + (target[i] - value) * progress), middle);
    },
  };
});
