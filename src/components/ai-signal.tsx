'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import { createSignal, signalMotion } from '@/lib/signal-engine';

type SignalState = 'idle' | 'listening' | 'thinking' | 'speaking';

// The six-slit Signal SVG from the brand kit (static/atomsai-signal-idle-*.svg), filled with
// currentColor. The brand engine owns circle transforms and slit openings while mounted.
const blades = signalMotion.blades;

/** AtomsAI Signal, the brand's AI identity, driven by the approved motion engine. Decorative: pair it with a visible status label. */
export function AiSignal({ state, className }: { state: SignalState; className?: string }) {
  const id = useId().replace(/:/g, '');
  const ref = useRef<SVGSVGElement>(null);
  const engine = useRef<ReturnType<typeof createSignal> | null>(null);

  useLayoutEffect(() => {
    const signal = createSignal(ref.current!, signalMotion);
    engine.current = signal;
    return () => { signal.destroy(); engine.current = null; };
  }, []);
  useLayoutEffect(() => { engine.current?.setState(state); }, [state]);

  return <svg ref={ref} className={className} viewBox="8 10 84 80" fill="currentColor" data-state="idle" aria-hidden="true" focusable="false">
    <defs>{blades.map((blade, i) => <clipPath key={i} id={`${id}-slit-${i}`} clipPathUnits="userSpaceOnUse">
      <rect x={blade.x} y="0" width={blade.width} height="100" />
    </clipPath>)}</defs>
    {blades.map((blade, i) => <g key={i} clipPath={`url(#${id}-slit-${i})`}>
      <circle cx={blade.cx} cy="50" r={blade.radius} />
    </g>)}
  </svg>;
}
