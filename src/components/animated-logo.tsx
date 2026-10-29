'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { keyTimesOf, markBounds, slitBlades, slitClip, slitMotion } from '@/lib/slit-logo';

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
      const trigger = svg.closest('a') ?? svg;
      const circles = svg.querySelectorAll('circle');
      const timeline = gsap.timeline({ paused: true });
      blades.forEach((blade, index) => {
        timeline.to(circles[index], {
          attr: { cx: blade.cx - blade.direction * blade.distance },
          duration: .6, ease: 'power3.inOut',
        }, blade.stagger * 1.5).to(circles[index], {
          attr: { cx: blade.cx }, duration: .75, ease: 'power3.inOut',
        }, .8 + blade.stagger * 1.5);
      });
      const play = () => {
        if (!motion.matches && !timeline.isActive()) timeline.restart();
      };
      const stop = () => { if (motion.matches) timeline.progress(1).pause(); };
      trigger.addEventListener('pointerenter', play);
      trigger.addEventListener('focusin', play);
      motion.addEventListener('change', stop);
      return () => {
        timeline.kill();
        trigger.removeEventListener('pointerenter', play);
        trigger.removeEventListener('focusin', play);
        motion.removeEventListener('change', stop);
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
