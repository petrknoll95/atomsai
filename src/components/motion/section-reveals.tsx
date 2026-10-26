'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import styles from './section-reveals.module.css';

/** Shared page-entry rhythm. Opacity only: measured layout and artwork stay still. */
export const sectionRevealSettings = {
  duration: 0.7,
  ease: 'power2.out',
  viewportEntry: 0.85,
} as const;

export function SectionReveals({ children, id }: { children: ReactNode; id?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Only outer sections: nested semantic sections must not fade twice.
    const sections = Array.from(root.querySelectorAll<HTMLElement>('section, footer')).filter(section =>
      !section.parentElement?.closest('section, footer') && section.dataset.reveal !== 'off');
    const revealed = new Set<HTMLElement>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let context: gsap.Context | undefined;

    const configure = () => {
      context?.revert();
      context = undefined;
      if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
      context = gsap.context(() => {
        const animations = new Map<HTMLElement, gsap.core.Tween>();
        let observer: IntersectionObserver | undefined;
        let resizeFrame = 0;
        let disposed = false;
        const showImmediately = (section: HTMLElement) => {
          revealed.add(section);
          const animation = animations.get(section);
          animation?.progress(1).pause();
          observer?.unobserve(section);
          section.dataset.revealState = 'visible';
        };
        const showTarget = (target: Element | null) => {
          if (!target) return;
          const section = sections.find(section => section.contains(target) || target.contains(section));
          if (section) showImmediately(section);
        };
        const showHashTarget = () => {
          try {
            const hash = decodeURIComponent(window.location.hash.slice(1));
            if (hash) showTarget(document.getElementById(hash));
          } catch { /* A malformed URL fragment should never affect page content. */ }
        };
        const showFocusedSection = (event: FocusEvent) => {
          if (event.target instanceof Element) showTarget(event.target);
        };

        sections.forEach(section => {
          const bounds = section.getBoundingClientRect();
          // Preserve the first paint, deep links and browser-restored scroll positions.
          // Sections already passed also stay visible when scrolling back up.
          if (revealed.has(section) || bounds.top < window.innerHeight || !bounds.height) {
            revealed.add(section);
            section.dataset.revealState = 'visible';
            return;
          }
          section.dataset.revealState = 'pending';
          animations.set(section, gsap.fromTo(section, { opacity: 0 }, {
            opacity: 1,
            paused: true,
            duration: sectionRevealSettings.duration,
            ease: sectionRevealSettings.ease,
            clearProps: 'opacity',
            onStart: () => { revealed.add(section); section.dataset.revealState = 'revealing'; },
            onComplete: () => { revealed.add(section); section.dataset.revealState = 'visible'; },
          }));
        });

        // Native observation tracks font loads, FAQ expansion and layout changes
        // without touching scroll position. GSAP owns only the opacity animation.
        const observe = () => {
          if (disposed) return;
          observer?.disconnect();
          observer = new IntersectionObserver(entries => {
            if (disposed) return;
            entries.forEach(entry => {
              if (!entry.isIntersecting) return;
              const section = entry.target as HTMLElement;
              observer?.unobserve(section);
              animations.get(section)?.play();
            });
          }, { rootMargin: `0px 0px -${Math.round(innerHeight * (1 - sectionRevealSettings.viewportEntry))}px 0px`, threshold: 0 });
          animations.forEach((_animation, section) => { if (!revealed.has(section)) observer?.observe(section); });
        };
        const resize = () => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(observe);
        };
        observe();

        root.addEventListener('focusin', showFocusedSection);
        window.addEventListener('hashchange', showHashTarget);
        window.addEventListener('resize', resize);
        showTarget(document.activeElement);
        showHashTarget();

        return () => {
          disposed = true;
          cancelAnimationFrame(resizeFrame);
          observer?.disconnect();
          root.removeEventListener('focusin', showFocusedSection);
          window.removeEventListener('hashchange', showHashTarget);
          window.removeEventListener('resize', resize);
          sections.forEach(section => { delete section.dataset.revealState; });
        };
      }, root);
    };
    configure();
    reducedMotion.addEventListener('change', configure);

    root.dataset.revealsReady = 'true';
    return () => {
      // Reverts only this scope's animations, including Strict Mode reruns.
      reducedMotion.removeEventListener('change', configure);
      context?.revert();
      delete root.dataset.revealsReady;
    };
  }, []);

  return <div id={id} ref={rootRef} className={styles.scope}>{children}</div>;
}
