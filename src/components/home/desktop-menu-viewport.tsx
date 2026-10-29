'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import styles from './mega-menu.module.css';

export type DesktopMenuItem = { label: string; content: ReactNode };

export function DesktopMenuViewport({ active, items, idPrefix, onClose }: {
  active: string | null;
  items: DesktopMenuItem[];
  idPrefix: string;
  onClose: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastHeight = useRef(0);
  const [layoutMenu, setLayoutMenu] = useState(active);
  const [present, setPresent] = useState<string[]>(active ? [active] : []);
  const [previousProp, setPreviousProp] = useState(active);
  if (active !== previousProp) {
    setPreviousProp(active);
    if (active) {
      setLayoutMenu(active);
      if (!present.includes(active)) setPresent([...present, active]);
    }
  }

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return;
    const panes = [...viewport.querySelectorAll<HTMLElement>('[data-dropdown-pane]')];
    const incoming = panes.find(pane => pane.dataset.dropdownPane === active);
    const previous = previousActive.current;
    previousActive.current = active;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let resize: ResizeObserver | undefined;
    const duration = () => reduced.matches ? 0 : .42;
    const switching = previous !== null && active !== null && previous !== active;
    const oldHeight = stage.style.height ? stage.getBoundingClientRect().height : lastHeight.current;
    const measure = () => incoming ? Math.min((incoming.firstElementChild as HTMLElement).offsetHeight, Math.max(0, innerHeight - viewport.getBoundingClientRect().top)) : 0;
    const fit = () => {
      const nextHeight = measure();
      if (!incoming || Math.abs(nextHeight - lastHeight.current) < .5) return;
      lastHeight.current = nextHeight;
      // This is only the already-open tab-to-tab resize. Opening and closing
      // remain intrinsic and are handled by the outer CSS 0fr / 1fr grid.
      if (switching) gsap.to(stage, { height: nextHeight, duration: duration(), ease: 'power3.out', overwrite: 'auto', clearProps: 'height' });
    };
    const animate = () => {
      gsap.killTweensOf([stage, ...panes]);
      if (!incoming) return;
      incoming.scrollTop = 0;
      const direction = items.findIndex(item => item.label === active) > items.findIndex(item => item.label === previous) ? 1 : -1;
      if (switching) {
        gsap.set(stage, { height: oldHeight });
        gsap.to(stage, { height: measure(), duration: duration(), ease: 'power3.out', clearProps: 'height' });
      } else gsap.set(stage, { clearProps: 'height' });
      lastHeight.current = measure();
      panes.forEach(pane => {
        if (pane === incoming) {
          if (getComputedStyle(pane).visibility === 'hidden') gsap.set(pane, { x: switching ? direction * 64 : 0, opacity: 0 });
          gsap.set(pane, { visibility: 'visible', zIndex: 2 });
          gsap.to(pane, { x: 0, opacity: 1, duration: duration(), ease: 'power3.out', onComplete: () => {
            setPresent(current => current.filter(label => label === active));
          } });
        } else {
          gsap.set(pane, { zIndex: 1 });
          gsap.to(pane, { x: -direction * 64, autoAlpha: 0, duration: reduced.matches ? 0 : .24, ease: 'power2.out' });
        }
      });
    };
    animate();
    if (incoming) {
      resize = new ResizeObserver(fit);
      resize.observe(incoming.firstElementChild!);
    }
    reduced.addEventListener('change', animate);
    return () => {
      resize?.disconnect();
      reduced.removeEventListener('change', animate);
      gsap.killTweensOf([stage, ...panes]);
    };
  }, [active, items]);

  return <div ref={viewportRef} className={`theme-light ${styles.viewport}`} data-desktop-menu-viewport data-open={Boolean(active)} inert={!active} aria-hidden={!active}
    onTransitionEnd={event => {
      if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows' && !active) setPresent([]);
    }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const pane = viewportRef.current?.querySelector<HTMLElement>('[data-dropdown-active="true"]');
      const links = pane?.querySelectorAll<HTMLAnchorElement>('a[href]');
      const trigger = document.querySelector<HTMLElement>(`[aria-controls="${idPrefix}-${active}"]`);
      if (!links?.length || !trigger) return;
      if (event.shiftKey && document.activeElement === links[0]) {
        event.preventDefault(); trigger.focus();
      } else if (!event.shiftKey && document.activeElement === links[links.length - 1]) {
        event.preventDefault();
        const next = trigger.closest('details')?.nextElementSibling;
        const target = next?.matches('a') ? next : next?.querySelector('summary');
        (target as HTMLElement | null)?.focus();
        if (!target) trigger.closest('header')?.querySelector<HTMLElement>('a[href="/company/contact"]')?.focus();
        onClose();
      }
    }}>
    <div className={styles.clip}>
    <div ref={stageRef} className={styles.stage}>
    {items.filter(item => present.includes(item.label)).map(item => <div key={item.label} id={`${idPrefix}-${item.label}`} className={styles.pane}
      data-dropdown-pane={item.label} data-dropdown-layout={layoutMenu === item.label} data-dropdown-active={active === item.label} inert={active !== item.label} aria-hidden={active !== item.label}>
      {item.content}
    </div>)}
    </div>
    </div>
  </div>;
}
