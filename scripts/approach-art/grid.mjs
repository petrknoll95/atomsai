// Shared footprint for the /approach stage illustrations: a 3 × 3 grid of 50-unit cells.
// Every scene stays inside the same 150-unit square so the reference fit gives one scale.
// i runs along X, j along Z; (0, 0) is the back corner from the neutral camera.
export const CELL = 50, SPAN = 150, BLOCK = 46, SLAB = 8;
export const cell = (i, j, y = 0) => [(i - 1) * CELL, y, (j - 1) * CELL];
export const topFace = b => b.faces.find(f => f.normal[1] > .99);
// Shared base slab for the build, validate and hand-over stages.
export const slab = (box, s, options) => box(s, [0, SLAB / 2, 0], [SPAN, SLAB, SPAN], options);
// Modules stacked BLOCK high from the slab; heights[i][j] counts modules per cell.
export function stacks(box, s, heights) {
  heights.forEach((row, i) => row.forEach((n, j) => {
    for (let k = 0; k < n; k++) box(s, cell(i, j, SLAB + BLOCK * (k + .5)), [BLOCK, BLOCK, BLOCK]);
  }));
}
