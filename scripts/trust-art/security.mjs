// Recipe for the trust "Security" card: render with the AtomsAI illustration kit
// (atoms-ai-brand skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/trust-security.svg, then run scripts/trust-line-art.mjs.
export const title = 'Padlock';
export const reference = 'modular';
// A solid body with a keyhole, and a bar shackle spanning almost its full width.
export default function ({ scene, box, stroke }) {
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
  // Shackle: outer and inner edges of a 12-unit bar in the body's mid plane. The legs start
  // inside the body, so the top face hides where they enter.
  const legTop = top + 30, base = top - 20;
  const arch = radius => {
    const pts = [[-radius, base, 0], [-radius, legTop, 0]];
    for (let i = 1; i < 64; i++) { const a = Math.PI - i / 64 * Math.PI; pts.push([radius * Math.cos(a), legTop + radius * Math.sin(a), 0]); }
    return [...pts, [radius, legTop, 0], [radius, base, 0]];
  };
  stroke(s, arch(44));
  stroke(s, arch(32));
  return s;
}
