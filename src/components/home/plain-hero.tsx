'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { StarfieldHero } from './starfield-hero/hero';
import styles from './plain-hero.module.css';

/** The dark homepage composition with a quiet, noninteractive particle field. */
export function PlainHero({ children }: { children: ReactNode }) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const hero = surface?.querySelector<HTMLElement>('[data-section="hero"]');
    if (!surface || !hero) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const scrollRatio = () => {
      const stage = hero.querySelector<HTMLElement>('[data-hero-stage]');
      const range = hero.offsetHeight - (stage?.offsetHeight ?? 0);
      return range > 0 ? -hero.getBoundingClientRect().top / range : 0;
    };
    const themeThreshold = .42;
    let light = scrollRatio() >= themeThreshold;
    const blend = { progress: 0 };
    const paint = () => {
      surface.style.setProperty('--hero-theme-mix', `${blend.progress * 100}%`);
      surface.dataset.theme = blend.progress < .48 ? 'dark' : 'light';
    };
    const transition = gsap.to(blend, {
      progress: 1,
      duration: 1.1,
      ease: 'power2.inOut',
      paused: true,
      onUpdate: paint,
    });
    const settleMotion = () => {
      transition.progress(light ? 1 : 0).pause();
      paint();
    };
    const update = () => {
      // Both directions cross the same threshold and play the same timed
      // animation forwards or backwards, including a mid-transition reversal.
      const nextLight = scrollRatio() >= themeThreshold;
      if (nextLight === light) return;
      light = nextLight;
      if (reduced.matches) settleMotion();
      else if (light) transition.play();
      else transition.reverse();
    };
    settleMotion();
    gsap.ticker.add(update);
    reduced.addEventListener('change', settleMotion);
    return () => {
      transition.kill();
      gsap.ticker.remove(update);
      reduced.removeEventListener('change', settleMotion);
    };
  }, []);

  return <div ref={surfaceRef} className={styles.surface} data-theme="dark" data-hero-theme-surface>
    <StarfieldHero interactive={false}>{children}</StarfieldHero>
  </div>;
}
