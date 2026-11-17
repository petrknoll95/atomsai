// Recipe for a contact directory card: render with the AtomsAI illustration kit
// (skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/contact-security.svg, then run scripts/contact-line-art.mjs.
// The kit requires one focal highlight; contact-line-art.mjs strips its Iris fill, so the
// delivered art is line only.
export const title = 'Signed document stack';
export const reference = 'modular';
// Three equal sheets with even gaps; the top one carries a checkmark and two lines of text.
export default function ({ scene, box, stroke }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const w = 110, d = 140, t = 6, gap = 16;
  let top;
  for (let i = 0; i < 3; i++) top = box(s, [0, i * gap, 0], [w, t, d]);
  const face = top.faces.find(f => f.normal[1] > .99);
  s.highlights.push({ points: face.points, normal: face.normal, kind: 'diamond', gradient: [] });
  const y = 2 * gap + t / 2, up = { normals: [[0, 1, 0]] };
  // Etched on the top face, in its own plane: two text rules near the head of the page and a centred check below.
  const x0 = -w / 2 + 18;
  stroke(s, [[x0, y, -d / 2 + 24], [x0 + 62, y, -d / 2 + 24]], up);
  stroke(s, [[x0, y, -d / 2 + 40], [x0 + 44, y, -d / 2 + 40]], up);
  // In plan the check is skewed so its projection reads as a tick: +X runs down-right on screen,
  // −Z up-right.
  stroke(s, [[-16, y, 22], [0, y, 30], [10, y, -14]], up);
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.primitiveCounts.box, 3);
}
