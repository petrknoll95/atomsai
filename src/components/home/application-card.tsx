'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { MotionPlaybackContext } from '@/components/patterns/motion-playback-context';

/** One interaction boundary; the content and measured artwork remain server-composed. */
export function ApplicationCard({ name, className, children }: {
  name: string;
  className: string;
  children: ReactNode;
}) {
  const [patternPlaying, setPatternPlaying] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hover = window.matchMedia('(any-hover: hover)');
    let pointerInside = hover.matches && card.matches(':hover');
    let keyboardFocused = !!card.querySelector(':focus-visible');

    const context = gsap.context(() => {
      // Keep the shader moving through the reveal and pause once fully hidden.
      const reveal = gsap.to(card, {
        '--application-progress': 1, duration: 0.48, ease: 'power2.out', paused: true,
        onReverseComplete: () => setPatternPlaying(false),
      });
      const inset = gsap.quickTo(card, '--application-inset', { duration: 1.2, ease: 'power2.out' });
      const zoom = gsap.quickTo(card, '--application-zoom', { duration: 1.2, ease: 'power2.out' });
      const update = () => {
        const active = pointerInside || keyboardFocused;
        card.dataset.active = String(active);
        inset(active ? 12 : 0);
        zoom(active && !reducedMotion.matches ? 1.06 : 1);
        if (reducedMotion.matches) { inset.tween.progress(1).pause(); zoom.tween.progress(1).pause(); }
        if (active) setPatternPlaying(true);
        if (reducedMotion.matches) { reveal.progress(active ? 1 : 0).pause(); setPatternPlaying(active); }
        else if (active) reveal.timeScale(1).play();
        else reveal.timeScale(1.5).reverse();
      };
      const enter = (event: PointerEvent) => {
        if (event.pointerType === 'touch' || !hover.matches) return;
        pointerInside = true;
        update();
      };
      const leave = () => { pointerInside = false; update(); };
      const focus = () => { keyboardFocused = !!card.querySelector(':focus-visible'); update(); };
      const blur = (event: FocusEvent) => {
        if (event.relatedTarget instanceof Node && card.contains(event.relatedTarget)) return;
        keyboardFocused = false;
        update();
      };
      const changeHover = () => { if (!hover.matches) pointerInside = false; update(); };
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointerleave', leave);
      card.addEventListener('pointercancel', leave);
      card.addEventListener('focusin', focus);
      card.addEventListener('focusout', blur);
      reducedMotion.addEventListener('change', update);
      hover.addEventListener('change', changeHover);
      update();

      return () => {
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointerleave', leave);
        card.removeEventListener('pointercancel', leave);
        card.removeEventListener('focusin', focus);
        card.removeEventListener('focusout', blur);
        reducedMotion.removeEventListener('change', update);
        hover.removeEventListener('change', changeHover);
      };
    }, card);
    return () => context.revert();
  }, []);

  return <article ref={cardRef} className={className} data-application={name} data-active="false"><MotionPlaybackContext.Provider value={patternPlaying}>{children}</MotionPlaybackContext.Provider></article>;
}
