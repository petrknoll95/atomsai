// Recipe for the trust "Reliability" card: render with the AtomsAI illustration kit
// (atoms-ai-brand skills/atomsai-illustrations/scripts/render.mjs), copy neutral-light.svg to
// public/assets/illustrations/trust-reliability.svg, then run scripts/trust-line-art.mjs.
export const title = 'Level on uneven ground';
export const reference = 'modular';
// A deck held perfectly level by pillars that each reach a different ground height.
export default function ({ scene, box }) {
  const s = scene();
  s.hiddenLines = 'omit';
  const cell = 60, deckY = 80, deckT = 8, pillar = 10;
  const heights = [[-1, -1, 36], [1, -1, 14], [-1, 1, 4], [1, 1, 24]];
  for (const [i, k, h] of heights) {
    const x = i * cell / 2, z = k * cell / 2;
    box(s, [x, h / 2, z], [cell, h, cell]);
    const len = deckY - h;
    box(s, [x, h + len / 2, z], [pillar, len, pillar]);
  }
  const deck = box(s, [0, deckY + deckT / 2, 0], [cell * 2, deckT, cell * 2]);
  const face = deck.faces.find(f => f.normal[1] > .99);
  s.highlights.push({ points: face.points, normal: face.normal, kind: 'diamond', gradient: [] });
  return s;
}
