// Recipe for the trust "Security" card: render with the AtomsAI illustration kit
// (atoms-ai-brand skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/trust-security.svg, then run scripts/trust-line-art.mjs.
export const title = 'Padlock';
export const reference = 'modular';
// A solid body with a keyhole, and a bar shackle spanning almost its full width.
export default function ({ scene, box, stroke, add, sub, mul, cross, unit, circlePoints, X, Z }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const w = 112, h = 92, d = 44, top = h / 2, f = d / 2;
  const body = box(s, [0, 0, 0], [w, h, d]);
  const face = body.faces.find(q => q.normal[2] > .99);
  s.highlights.push({ points: face.points, normal: face.normal, kind: 'diamond', gradient: [] });
  // Keyhole: a round head opening into a tapered slot, one closed outline on the front face.
  const kc = [0, 6], r = 10, open = Math.asin(5 / r), key = [];
  for (let i = 0; i <= 48; i++) {
    const a = -Math.PI / 2 + open + i / 48 * (2 * Math.PI - 2 * open);
    key.push([kc[0] + r * Math.cos(a), kc[1] + r * Math.sin(a), f]);
  }
  key.push([-8, -22, f], [8, -22, f], key[0]);
  stroke(s, key);
  // Shackle: a real round bar swept along a U in the body's mid plane. Its surface is an
  // occluding mesh; the visible outline is the exact silhouette for the neutral camera
  // (path ± bar radius along cross(tangent, view)), so it reads as a tube, not two arches.
  // The legs stand on the top face; a circular collar marks where each round leg enters.
  const R = 37, bar = 7.5, legTop = top + 30, base = top;
  const view = unit([Math.SQRT1_2 * Math.sqrt(3) / 2, .5, Math.SQRT1_2 * Math.sqrt(3) / 2]);
  const leg = x => Array.from({ length: 13 }, (_, i) => [x, base + (legTop - base) * i / 12, 0]);
  const arc = Array.from({ length: 97 }, (_, i) => { const a = Math.PI - i / 96 * Math.PI; return [R * Math.cos(a), legTop + R * Math.sin(a), 0]; });
  const parts = [leg(-R), arc, leg(R).reverse()];
  parts.forEach((path, k) => {
    const owner = 9100 + k, ring = 32;
    const frames = path.map((p, i) => {
      const t = unit(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]));
      const n = [0, 0, 1], b = unit(cross(t, n));
      return { p, t, n, b };
    });
    const circle = ({ p, n, b }) => Array.from({ length: ring }, (_, j) => { const a = j / ring * Math.PI * 2; return add(p, add(mul(n, bar * Math.cos(a)), mul(b, bar * Math.sin(a)))); });
    const rings = frames.map(circle);
    for (let i = 0; i + 1 < rings.length; i++) for (let j = 0; j < ring; j++) {
      const q = (j + 1) % ring;
      s.faces.push({ points: [rings[i][j], rings[i][q], rings[i + 1][q], rings[i + 1][j]], owner });
    }
    for (const side of [1, -1]) stroke(s, frames.map(({ p, t }) => add(p, mul(unit(cross(t, view)), side * bar))), { owner, silhouette: true });
  });
  for (const x of [-R, R]) stroke(s, circlePoints([x, top, 0], bar, X, Z, 96), { closed: true });
  return s;
}
