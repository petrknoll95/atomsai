import { generateSlits, markBounds } from '@/lib/slit-logo';

// One half of the AtomsAI mark drawn as outlines: the three left slits, or their mirror.
// Each slit is a circle clipped to a vertical strip; the circle's rightmost point meets the
// strip's right edge, so the outline is the strip's left edge closed by one circular arc.
const slits = generateSlits();
const round = (value: number) => +value.toFixed(3);
const left = Math.min(...slits.map(s => s.x));
const right = Math.max(...slits.map(s => s.x + s.w));
// Crop to the ink: the tallest slit sets the height.
const { y: top, height } = markBounds();
const paths = slits.map(({ x, w, cx, r }) => {
  const half = Math.sqrt(r ** 2 - (x - cx) ** 2);
  return `M${round(x)} ${round(50 - half)}A${r} ${r} 0 0 1 ${round(x + w)} 50A${r} ${r} 0 0 1 ${round(x)} ${round(50 + half)}Z`;
});

export function FooterMarkHalf({ side, className }: { side: 'start' | 'end'; className?: string }) {
  // The end half mirrors the start half around the mark's center line (x = 50).
  const viewBox = side === 'start'
    ? [left, top, right - left, height]
    : [100 - right, top, right - left, height];
  return <div className={className} aria-hidden="true">
    <svg viewBox={viewBox.map(round).join(' ')} preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" focusable="false">
      <g transform={side === 'end' ? 'matrix(-1 0 0 1 100 0)' : undefined}>
        {paths.map(d => <path key={d} d={d} vectorEffect="non-scaling-stroke" />)}
      </g>
    </svg>
  </div>;
}
