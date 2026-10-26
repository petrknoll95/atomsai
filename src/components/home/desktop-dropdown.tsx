'use client';

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';

/** Keep a closing panel mounted just long enough to finish its exit. */
export function DesktopDropdown({ label, className, open, onToggle, trigger, children }: {
  label: string;
  className: string;
  open: boolean;
  onToggle: () => void;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const summaryRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [present, setPresent] = useState(open);
  const [previousOpen, setPreviousOpen] = useState(open);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Mount before paint when reopening, including while an exit is in flight.
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) setPresent(true);
  }

  useLayoutEffect(() => {
    const panel = slotRef.current?.firstElementChild;
    if (!panel) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1200px)');
    let tween: gsap.core.Tween;
    const update = () => {
      tween?.kill();
      tween = gsap.to(panel, {
        opacity: open ? 1 : 0,
        y: open ? 0 : -6,
        duration: motion.matches || !desktop.matches ? 0 : open ? 0.24 : 0.16,
        ease: 'power2.out',
        onComplete: () => { if (!open) setPresent(false); },
      });
    };
    update();
    motion.addEventListener('change', update);
    desktop.addEventListener('change', update);
    return () => {
      tween?.kill();
      motion.removeEventListener('change', update);
      desktop.removeEventListener('change', update);
    };
  }, [open, present]);

  useLayoutEffect(() => {
    const summary = summaryRef.current;
    if (!summary) return;
    const chevron = summary.querySelector('[data-menu-chevron]');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let background: gsap.core.Tween;
    let rotation: gsap.core.Tween;
    const update = () => {
      background?.kill();
      rotation?.kill();
      background = gsap.to(summary, {
        '--menu-emphasis': open || hovered || focused ? 1 : 0,
        duration: motion.matches ? 0 : 0.18, ease: 'power2.out',
      });
      if (chevron) rotation = gsap.to(chevron, {
        rotation: open ? 180 : 0,
        duration: motion.matches ? 0 : 0.22, ease: 'power2.out',
      });
    };
    update();
    motion.addEventListener('change', update);
    return () => {
      background?.kill();
      rotation?.kill();
      motion.removeEventListener('change', update);
    };
  }, [open, hovered, focused]);

  return <details className={className} data-menu={label} data-expanded={open} open={open || present}>
    <summary
      ref={summaryRef}
      aria-expanded={open}
      aria-controls={id}
      onClick={event => { event.preventDefault(); onToggle(); }}
      onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onPointerCancel={() => setHovered(false)}
      onFocus={event => setFocused(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
    >{trigger}</summary>
    {(open || present) && <div ref={slotRef} id={id} data-desktop-menu-slot style={{ display: 'contents' }} inert={!open} aria-hidden={!open}>{children}</div>}
  </details>;
}
