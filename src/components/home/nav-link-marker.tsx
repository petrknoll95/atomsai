'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import styles from './hero.module.css';

/** One silhouette grows from the leading dot into the complete link pill. */
export function NavLinkMarker({ children, active = false }: { children: ReactNode; active?: boolean }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const progress = useRef({ value: 0 });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const trigger = root?.parentElement;
    const pill = root?.querySelector<HTMLElement>('[data-nav-pill]');
    if (!root || !trigger || !pill) return;
    const text = root.querySelectorAll('[data-nav-ink]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let hovered = trigger.matches(':hover');
    let tween: gsap.core.Timeline | undefined;
    const update = (instant = false) => {
      const expanded = active || hovered || trigger.matches(':focus-visible');
      const { width, height } = root.getBoundingClientRect();
      tween?.kill();
      root.dataset.markerExpanded = String(expanded);
      // Animate a number instead of the CSS string: browsers collapse zero
      // insets into shorthand, which breaks interpolation during reversals.
      const paint = () => {
        const remaining = 1 - progress.current.value;
        const vertical = (height - 6) / 2 * remaining;
        pill.style.clipPath = `inset(${vertical}px ${(width - 6) * remaining}px ${vertical}px 0px round 999px)`;
      };
      paint();
      tween = gsap.timeline({ defaults: { duration: motion.matches || instant ? 0 : .52, ease: 'power3.inOut' } })
        .to(progress.current, { value: expanded ? 1 : 0, onUpdate: paint }, 0)
        .to(text, { x: expanded ? -3 : 0 }, 0);
    };
    const enter = (event: PointerEvent) => { if (event.pointerType !== 'touch') { hovered = true; update(); } };
    const leave = () => { hovered = false; update(); };
    const focus = () => update();
    let dimensions = `${root.offsetWidth}:${root.offsetHeight}`;
    let resizeFrame = 0;
    const resize = new ResizeObserver(() => {
      const next = `${root.offsetWidth}:${root.offsetHeight}`;
      if (next !== dimensions) {
        dimensions = next;
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => update(true));
      }
    });
    resize.observe(root);
    update();
    trigger.addEventListener('pointerenter', enter);
    trigger.addEventListener('pointerleave', leave);
    trigger.addEventListener('pointercancel', leave);
    trigger.addEventListener('focus', focus);
    trigger.addEventListener('blur', focus);
    motion.addEventListener('change', focus);
    return () => {
      tween?.kill();
      resize.disconnect();
      cancelAnimationFrame(resizeFrame);
      trigger.removeEventListener('pointerenter', enter);
      trigger.removeEventListener('pointerleave', leave);
      trigger.removeEventListener('pointercancel', leave);
      trigger.removeEventListener('focus', focus);
      trigger.removeEventListener('blur', focus);
      motion.removeEventListener('change', focus);
    };
  }, [active]);

  return <span ref={rootRef} className={styles.navMarker}>
    <span className={styles.navInk} data-nav-ink>{children}</span>
    <span className={styles.navPill} data-nav-pill aria-hidden='true'>
      <span className={styles.navInk} data-nav-ink>{children}</span>
    </span>
  </span>;
}
