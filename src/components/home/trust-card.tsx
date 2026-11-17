'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';

/** The homepage card hover from OfferingCard: the painted background insets 12px, the layout stays put. */
export function TrustCard({ href, className, clipClassName, children }: {
  href: string;
  className: string;
  clipClassName: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const card = ref.current;
    const clip = card?.querySelector<HTMLElement>('[data-trust-clip]');
    if (!card || !clip) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(any-hover: hover)');
    let inside = hover.matches && card.matches(':hover');
    const context = gsap.context(() => {
      const inset = gsap.quickTo(clip, '--trust-inset', { duration: 1.2, ease: 'power2.out' });
      const update = () => {
        const active = inside || card.matches(':focus-visible');
        card.dataset.active = String(active);
        inset(active ? 12 : 0);
        if (reduced.matches) inset.tween.progress(1).pause();
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

  return <Link ref={ref} href={href} className={className} data-active="false">
    <span className={clipClassName} data-trust-clip aria-hidden="true" />
    {children}
  </Link>;
}
