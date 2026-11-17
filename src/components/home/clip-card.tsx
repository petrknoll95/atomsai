'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';

/**
 * The homepage card hover from OfferingCard, as a whole-card link. On hover or keyboard focus the
 * child marked data-clip-inset insets 12px through its --clip-inset clip-path, and an optional
 * child marked data-clip-zoom scales to 1.06 inside it. The layout never moves.
 */
export function ClipCard({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const card = ref.current;
    const clip = card?.querySelector<HTMLElement>('[data-clip-inset]');
    if (!card || !clip) return;
    const zoomTarget = card.querySelector<HTMLElement>('[data-clip-zoom]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(any-hover: hover)');
    let inside = hover.matches && card.matches(':hover');
    const context = gsap.context(() => {
      const ease = { duration: 1.2, ease: 'power2.out' };
      const inset = gsap.quickTo(clip, '--clip-inset', ease);
      const zoom = zoomTarget ? ['scaleX', 'scaleY'].map(axis => gsap.quickTo(zoomTarget, axis, ease)) : [];
      const update = () => {
        const active = inside || card.matches(':focus-visible');
        card.dataset.active = String(active);
        inset(active ? 12 : 0);
        if (reduced.matches) inset.tween.progress(1).pause();
        zoom.forEach(setScale => {
          setScale(active && !reduced.matches ? 1.06 : 1);
          if (reduced.matches) setScale.tween.progress(1).pause();
        });
      };
      const enter = (event: PointerEvent) => {
        if (!hover.matches || event.pointerType === 'touch') return;
        inside = true;
        update();
      };
      const leave = () => { inside = false; update(); };
      const hoverChange = () => { if (!hover.matches) inside = false; update(); };
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointerleave', leave);
      card.addEventListener('pointercancel', leave);
      card.addEventListener('focus', update);
      card.addEventListener('blur', update);
      reduced.addEventListener('change', update);
      hover.addEventListener('change', hoverChange);
      update();
      return () => {
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointerleave', leave);
        card.removeEventListener('pointercancel', leave);
        card.removeEventListener('focus', update);
        card.removeEventListener('blur', update);
        reduced.removeEventListener('change', update);
        hover.removeEventListener('change', hoverChange);
      };
    }, card);
    return () => context.revert();
  }, []);

  return <Link ref={ref} href={href} className={className} data-active="false">{children}</Link>;
}
