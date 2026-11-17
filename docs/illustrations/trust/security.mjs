export const title = 'Sealed core';
export const reference = 'nested';
// A gridded transparent enclosure around one highlighted solid core, both centred.
export default function ({ scene, box }) {
  const s = scene();
  box(s, [0, 0, 0], [150, 150, 150], { wire: true, grid: true });
  box(s, [0, 0, 0], [72, 72, 72], { highlight: true });
  return s;
}
export function verify(s, api, assert) {
  assert.equal(s.highlights.length, 1);
}
