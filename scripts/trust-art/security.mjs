// Recipe for the trust "Security" card: render with the AtomsAI illustration kit
// (atoms-ai-brand skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/trust-security.svg, then run scripts/trust-line-art.mjs.
export const title = 'Padlock';
export const reference = 'modular';
// Padlock: solid body, U shackle drawn as inner and outer arcs in the body's mid plane, keyhole on the face.
export default function ({ scene, box, ring, stroke, add, mul, X, Y, Z, around, transformScene }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const w = 140, h = 104, d = 40, top = h / 2;
  const body = box(s, [0, 0, 0], [w, h, d]);
  const face = body.faces.find(f => f.normal[2] > .99);
  s.highlights.push({ points: face.points, normal: face.normal, kind: 'diamond', gradient: [] });
  const arc = (r, legTop) => {
    const pts = [[-r, top, 0], [-r, legTop, 0]];
    for (let i = 0; i <= 64; i++) { const a = Math.PI - i / 64 * Math.PI; pts.push([r * Math.cos(a), legTop + r * Math.sin(a), 0]); }
    pts.push([r, top, 0]);
    return pts;
  };
  const legTop = top + 32;
  stroke(s, arc(46, legTop));
  stroke(s, arc(32, legTop));
  const key = [0, -6, d / 2];
  ring(s, key, 10, X, Y);
  stroke(s, [add(key, [0, -10, 0]), add(key, [0, -30, 0])]);
  const turn = p => around(p, Y, Math.PI / 7);
  transformScene(s, turn, turn);
  return s;
}
