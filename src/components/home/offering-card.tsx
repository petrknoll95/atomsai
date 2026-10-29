'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';

/** Inset the rounded clip and zoom its background without resizing the shader. */
export function OfferingCard({ name, href, className, children }: {
  name: string;
  href: string;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const card = ref.current;
    const clip = card?.querySelector<HTMLElement>('[data-offering-clip]');
    const background = card?.querySelector<HTMLElement>('[data-offering-background]');
    if (!card || !clip || !background) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(any-hover: hover)');
    let inside = hover.matches && card.matches(':hover');
    const context = gsap.context(() => {
      const inset = gsap.quickTo(clip, '--offering-inset', { duration: 1.2, ease: 'power2.out' });
      const zoom = ['scaleX', 'scaleY'].map(axis =>
        gsap.quickTo(background, axis, { duration: 1.2, ease: 'power2.out' }));
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

  return <a ref={ref} href={href} className={className} data-offering={name} data-active="false">{children}</a>;
}
