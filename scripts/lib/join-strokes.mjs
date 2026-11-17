// Joins a projected frame's visible strokes so corners render as true miters.
//
// The illustration renderer emits every structural edge as its own butt-capped path. Where two
// or three edges meet at a shared vertex, the butt ends leave a V-shaped notch on the outside of
// the corner. This pass works on the projected 2D polylines only; it never moves a point:
//  1. Ends that meet exactly two other ends are chained into one path, so SVG draws a miter.
//  2. At a three-way corner, the two edges whose angle contains the third are chained (the outer
//     outline); at a Y-junction, the widest pair. Either way the third edge's butt end lies
//     wholly inside the joined pair's stroke, so no end needs extending (extending pokes square
//     corners out past the miter).
// Ends created by occlusion (a line passing behind a solid) meet nothing and stay as they are.

const key = p => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;
const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-3 && Math.abs(a[1] - b[1]) < 1e-3;
const unit2 = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
const angle = (u, v) => Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1])));

/** Direction pointing away from the junction along the path at this end. */
function outward(path, atStart) {
  const pts = path.points, a = atStart ? pts[0] : pts.at(-1);
  for (let i = 1; i < pts.length; i++) {
    const b = atStart ? pts[i] : pts[pts.length - 1 - i];
    if (!same(a, b)) return unit2(a, b);
  }
  return [0, 0];
}

function isClosed(path) { return path.closed || (path.points.length > 2 && same(path.points[0], path.points.at(-1))); }

/**
 * @param {{points:number[][], closed?:boolean, width:number, dash?:number[]}[]} lines
 * @returns same shape, joined; dashed and closed paths pass through untouched.
 */
export function joinStrokes(lines) {
  // The serializer never writes Z, so a closed loop starts and ends butt-capped at one corner.
  // Re-entering its first segment turns that seam into an ordinary mitered vertex.
  const fixed = lines.filter(l => l.dash || isClosed(l)).map(l => {
    if (l.dash || l.points.length < 3) return l;
    const pts = same(l.points[0], l.points.at(-1)) ? l.points : [...l.points, l.points[0]];
    return { ...l, points: [...pts, pts[1]] };
  });
  let open = lines.filter(l => !l.dash && !isClosed(l)).map(l => ({ ...l, points: [...l.points] }));

  // Steps 1–2: repeatedly chain one pair of ends at a junction until nothing changes.
  for (let changed = true; changed;) {
    changed = false;
    const ends = new Map();
    open.forEach((path, index) => {
      for (const atStart of [true, false]) {
        const k = key(atStart ? path.points[0] : path.points.at(-1));
        if (!ends.has(k)) ends.set(k, []);
        ends.get(k).push({ index, atStart });
      }
    });
    for (const list of ends.values()) {
      if (list.length < 2 || list.length > 3) continue;
      let pair = list.slice(0, 2);
      if (list.length === 3) {
        const dirs = list.map(e => outward(open[e.index], e.atStart));
        pair = null;
        for (const [i, j, k] of [[0, 1, 2], [0, 2, 1], [1, 2, 0]]) {
          const whole = angle(dirs[i], dirs[j]);
          if (Math.abs(angle(dirs[i], dirs[k]) + angle(dirs[k], dirs[j]) - whole) < 1e-6) { pair = [list[i], list[j]]; break; }
        }
        if (!pair) { // A Y-junction: join the widest pair; the third fills the miter's open side.
          const options = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => ({ i, j, a: angle(dirs[i], dirs[j]) }));
          const { i, j } = options.sort((x, y) => y.a - x.a)[0];
          pair = [list[i], list[j]];
        }
      }
      const [a, b] = pair;
      if (a.index === b.index) continue; // Would close a loop; leave it.
      const A = open[a.index], B = open[b.index];
      const first = a.atStart ? [...A.points].reverse() : A.points; // ends at the junction
      const second = b.atStart ? B.points : [...B.points].reverse(); // starts at the junction
      open[a.index] = { ...A, points: [...first, ...second.slice(1)] };
      open = open.filter((_, i) => i !== b.index);
      changed = true;
      break;
    }
  }

  return [...open, ...fixed];
}

/** Joins a projectScene frame in place: visible and accent strokes merge into one front pass. */
export function joinFrame(frame) {
  frame.front = joinStrokes([...frame.front, ...frame.accent]);
  frame.accent = [];
  return frame;
}
