import { generateSlits, markBounds } from '@/lib/slit-logo';

// One half of the AtomsAI mark drawn as outlines: the three left slits, or their mirror.
// Each slit is a circle clipped to a vertical strip; the circle's rightmost point meets the
// strip's right edge, so a slit is its strip's left edge closed by one circular arc.
// Slits that overlap merge into one silhouette, traced as a single closed path.
const round = (value: number) => +value.toFixed(3);
const slits = generateSlits().sort((a, b) => a.x - b.x);
/** Half-height of a slit's circle at x. */
const reach = (s: (typeof slits)[number], x: number) => Math.sqrt(s.r ** 2 - (x - s.cx) ** 2);
const left = slits[0].x;
const right = Math.max(...slits.map(s => s.x + s.w));
// Crop to the ink: the tallest slit sets the height.
const { y: top, height } = markBounds();

// Group slits whose strips overlap (a slit's right edge passes the next one's left edge).
const groups: (typeof slits)[] = [];
for (const s of slits) {
  const last = groups.at(-1);
  if (last && last.at(-1)!.x + last.at(-1)!.w > s.x) last.push(s);
  else groups.push([s]);
}

// Walk each group clockwise: up the first left edge, along each arc until it meets the next
// slit's left edge, up that edge, round the last slit's tip, then back the same way below.
// Every arc runs clockwise on screen (sweep 1) and is under a half circle.
const arc = (r: number, x: number, y: number) => `A${round(r)} ${round(r)} 0 0 1 ${round(x)} ${round(y)}`;
const paths = groups.map((group, index) => {
  const d = [`M${round(group[0].x)} ${round(50 - reach(group[0], group[0].x))}`];
  group.forEach((s, i) => {
    const next = group[i + 1];
    if (next) d.push(arc(s.r, next.x, 50 - reach(s, next.x)), `L${round(next.x)} ${round(50 - reach(next, next.x))}`);
    else d.push(arc(s.r, s.x + s.w, 50), arc(s.r, s.x, 50 + reach(s, s.x)));
  });
  for (let i = group.length - 1; i > 0; i--) {
    const s = group[i], previous = group[i - 1];
    d.push(`L${round(s.x)} ${round(50 + reach(previous, s.x))}`, arc(previous.r, previous.x, 50 + reach(previous, previous.x)));
  }
  // The outermost slit's straight edge sits on the viewport edge; leave it open so no border shows there.
  return d.join('') + (index === 0 ? '' : 'Z');
});

export function FooterMarkHalf({ side, className }: { side: 'start' | 'end'; className?: string }) {
  // The end half mirrors the start half around the mark's center line (x = 50).
  const viewBox = side === 'start'
    ? [left, top, right - left, height]
    : [100 - right, top, right - left, height];
  return <div className={className} data-side={side} aria-hidden="true">
    <svg viewBox={viewBox.map(round).join(' ')} preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" strokeWidth="1" focusable="false">
      <g transform={side === 'end' ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        {paths.map(d => <path key={d} d={d} vectorEffect="non-scaling-stroke" />)}
      </g>
    </svg>
  </div>;
}
