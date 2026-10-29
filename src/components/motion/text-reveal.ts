import { gsap } from 'gsap';

/** The shared recipe for text reveals. Keep timing and movement out of sections. */
export const textReveal = {
  duration: .72,
  stagger: .09,
  distance: 14,
  ease: 'power3.out',
  viewportEntry: .88,
  fontWaitLimit: 1500,
} as const;

export const headlineSelector = 'h1.display, h2.display, [data-text-reveal]';

export function revealTextLines(lines: Element[], onComplete: () => void) {
  return gsap.fromTo(lines, { opacity: 0, y: textReveal.distance }, {
    opacity: 1, y: 0, duration: textReveal.duration,
    stagger: textReveal.stagger, ease: textReveal.ease,
    paused: true, onComplete,
  });
}
