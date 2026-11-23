export const modelDotRadius = .0034;
export const modelDotRings = Array.from({ length: 12 }, (_, index) => {
  const ring = index + 1;
  return { radius: ring * .04, count: Math.round(2 * Math.PI * ring), stagger: index % 2 / 2 };
});
