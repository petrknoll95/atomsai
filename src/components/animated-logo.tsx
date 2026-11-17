'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import { keyTimesOf, listeningMotion, listeningRetreat, markBounds, slitBlades, slitClip, slitMotion, smootherstep } from '@/lib/slit-logo';

// Port of atoms-ai-brand/src/components/MarkReveal.astro, using its original
// slit geometry, timing and easing from src/data/slitLogo.ts.
const round = (value: number) => +value.toFixed(4);
const bounds = markBounds();
const viewBox = [bounds.x, bounds.y, bounds.width, bounds.height].map(round).join(' ');
const blades = slitBlades();

export function AnimatedLogo({ className, playOnHover = false }: { className?: string; playOnHover?: boolean }) {
  const id = useId();
  const ref = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = ref.current!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (playOnHover) {
      // Hover plays the AI identity Listening loop for as long as the pointer
      // (or focus) stays, then blends back to the still mark.
      const trigger = svg.closest('a') ?? svg;
      const circles = [...svg.querySelectorAll('circle')];
      let frame = 0;
      let listenStart = 0;
      let blend = { from: 0, to: 0, start: 0 };
      const weightAt = (time: number) => blend.from + (blend.to - blend.from) * smootherstep((time - blend.start) / listeningMotion.transitionMs);
      const render = (time: number) => {
        const weight = weightAt(time);
        blades.forEach((blade, index) => {
          const retreat = weight * listeningRetreat(time - listenStart, blade.n);
          circles[index].setAttribute('cx', String(round(blade.cx - blade.direction * blade.w * retreat)));
        });
        return weight;
      };
      const tick = (time: number) => {
        const weight = render(time);
        frame = blend.to === 0 && weight <= 0 ? 0 : requestAnimationFrame(tick);
      };
      const listen = (on: boolean) => {
        if (motion.matches || blend.to === Number(on)) return;
        const now = performance.now();
        const weight = weightAt(now);
        // Restart the loop only from rest; re-entering mid-fade keeps its rhythm.
        if (on && weight <= 0) listenStart = now;
        blend = { from: weight, to: Number(on), start: now };
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const start = () => listen(true);
      const end = (event: Event) => {
        if (event.type === 'focusout' && trigger.contains((event as FocusEvent).relatedTarget as Node | null)) return;
        // Keyboard focus keeps it listening; a mouse click's focus does not.
        if (event.type === 'focusout' || !(trigger.matches(':focus-visible') || trigger.querySelector(':focus-visible'))) listen(false);
      };
      const reset = () => {
        if (!motion.matches) return;
        cancelAnimationFrame(frame);
        frame = 0;
        blend = { from: 0, to: 0, start: 0 };
        render(performance.now());
      };
      trigger.addEventListener('pointerenter', start);
      trigger.addEventListener('pointerleave', end);
      trigger.addEventListener('focusin', start);
      trigger.addEventListener('focusout', end);
      motion.addEventListener('change', reset);
      return () => {
        cancelAnimationFrame(frame);
        circles.forEach((circle, index) => circle.setAttribute('cx', String(round(blades[index].cx))));
        trigger.removeEventListener('pointerenter', start);
        trigger.removeEventListener('pointerleave', end);
        trigger.removeEventListener('focusin', start);
        trigger.removeEventListener('focusout', end);
        motion.removeEventListener('change', reset);
      };
    }
    const update = () => {
      // Skip the opening hold for brief loading states; preserve the brand loop.
      svg.setCurrentTime(motion.matches ? 0 : 1.2);
      if (motion.matches) svg.pauseAnimations();
      else svg.unpauseAnimations();
    };
    update();
    motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, [playOnHover]);

  return <svg ref={ref} className={className} viewBox={viewBox} width="28" height="24"
    fill="currentColor" aria-hidden="true" focusable="false" data-animated-logo>
    <defs>
      {blades.map((blade, index) => <clipPath key={index} id={`${id}-slit-${index}`} clipPathUnits="userSpaceOnUse">
        <rect x={round(blade.x)} y={slitClip.y} width={round(blade.w)} height={slitClip.height} />
      </clipPath>)}
    </defs>
    {blades.map((blade, index) => <g key={index} clipPath={`url(#${id}-slit-${index})`}>
      <circle cx={round(blade.cx)} cy="50" r={round(blade.r)}>
        {!playOnHover && <animate attributeName="cx"
          values={[blade.cx, blade.cx, blade.cx - blade.direction * blade.distance,
            blade.cx - blade.direction * blade.distance, blade.cx, blade.cx].map(round).join(';')}
          dur={`${slitMotion.seconds}s`} repeatCount="indefinite" calcMode="spline"
          keyTimes={keyTimesOf(blade.n)} keySplines={slitMotion.keySplines} />}
      </circle>
    </g>)}
  </svg>;
}
