'use client';

import { useEffect } from 'react';
import type { EmblaCarouselType } from 'embla-carousel';
import { gsap } from 'gsap';

/** Embla owns the slide cross-fade; GSAP reveals only the incoming objects. */
export function useStoryReveal(embla: EmblaCarouselType | undefined) {
  useEffect(() => {
    if (!embla) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const slides = embla.slideNodes();
    const context = gsap.context(() => {}, embla.rootNode());
    const reset = () => context.revert();
    const reveal = () => {
      // Restore the outgoing objects and release the previous timeline, including
      // when another selection interrupts a reveal. No timelines accumulate.
      reset();
      if (motion.matches) return;
      const incoming = slides[embla.selectedScrollSnap()];
      context.add(() => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(incoming.querySelectorAll('[data-story-reveal]'),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: .6, stagger: .055 }, .06);
      });
    };
    embla.on('select', reveal).on('reInit', reset);
    motion.addEventListener('change', reset);
    return () => {
      embla.off('select', reveal).off('reInit', reset);
      motion.removeEventListener('change', reset);
      context.revert();
    };
  }, [embla]);
}
