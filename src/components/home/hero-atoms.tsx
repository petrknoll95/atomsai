'use client';

import { assetPath } from '@/lib/base-path';

import { useEffect, useRef, useState } from 'react';
import styles from './hero-atoms.module.css';

export function HeroAtoms() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let destroy: (() => void) | undefined;
    const load = async () => {
      try {
        const { mountHeroAtoms } = await import('./hero-atoms-sketch');
        if (!disposed) destroy = mountHeroAtoms(element);
      } catch {
        // Show static artwork only on failure, never during the canvas handoff.
        if (!disposed) {
          element.dataset.state = 'fallback';
          setFailed(true);
        }
      }
    };
    // Keep p5's parsing and initialization out of the initial content render.
    const idle = 'requestIdleCallback' in window
      ? window.requestIdleCallback(() => void load(), { timeout: 800 })
      : undefined;
    const timer = idle === undefined ? window.setTimeout(() => void load(), 80) : undefined;
    return () => {
      disposed = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
      destroy?.();
    };
  }, []);

  // Without its positioning CSS, p5's canvas would grow its own measured host
  // on every resize. Keep this optional artwork hidden until that CSS exists.
  return <div ref={host} className={styles.artwork} style={{ display: 'var(--hero-atoms-display, none)' }} aria-hidden='true' data-hero-atoms data-state='loading'>
    {failed && <img className={styles.fallback} src={assetPath('/assets/figma/hero-atoms-fallback.webp')} width='1600' height='960' alt='' />}
    <noscript><img className={styles.fallback} src={assetPath('/assets/figma/hero-atoms-fallback.webp')} width='1600' height='960' alt='' /></noscript>
  </div>;
}
