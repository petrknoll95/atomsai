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
    let light = scrollRatio() >= .42;
    const blend = { progress: light ? 1 : 0 };
    let transition: gsap.core.Tween | undefined;
    const paint = () => {
      surface.style.setProperty('--hero-theme-mix', `${blend.progress * 100}%`);
      surface.dataset.theme = blend.progress < .48 ? 'dark' : 'light';
    };
    const changeTheme = (nextLight: boolean) => {
      light = nextLight;
      transition?.kill();
      transition = gsap.to(blend, {
        progress: light ? 1 : 0,
        duration: reduced.matches ? 0 : 1.1,
        ease: 'power2.inOut',
        onUpdate: paint,
      });
    };
    const update = () => {
      // Scroll selects a destination only. The timed tween finishes even when
      // scrolling stops; a separate return threshold avoids boundary chatter.
      const ratio = scrollRatio();
      if (!light && ratio >= .42) changeTheme(true);
      else if (light && ratio <= .28) changeTheme(false);
    };
    const settleMotion = () => {
      transition?.kill();
      blend.progress = light ? 1 : 0;
      paint();
    };
    paint();
    gsap.ticker.add(update);
    reduced.addEventListener('change', settleMotion);
    return () => {
      transition?.kill();
      gsap.ticker.remove(update);
      reduced.removeEventListener('change', settleMotion);
    };
  }, []);

  return <div ref={surfaceRef} className={styles.surface} data-theme="dark" data-hero-theme-surface>
    <StarfieldHero interactive={false}>{children}</StarfieldHero>
  </div>;
}
