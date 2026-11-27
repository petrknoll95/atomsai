'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { getCoordinates } from 'tw-easing-gradients';
import dynamic from 'next/dynamic';
import type { FlutedPatternProps } from './fluted-pattern';
import { assetPath } from '@/lib/base-path';
import menu from '../fullscreen-menu.module.css';
import styles from './hero.module.css';

function UnavailablePattern({ onAvailabilityChange }: FlutedPatternProps) {
  useEffect(() => { onAvailabilityChange?.(false); }, [onAvailabilityChange]);
  return null;
}
const FlutedPattern = dynamic<FlutedPatternProps>(() => import('./fluted-pattern')
  .then(module => module.FlutedPattern).catch(() => UnavailablePattern), { ssr: false });
// Use the plugin's easing function, with an opaque tail in the same paint layer.
// Its stock utility always ends at 100%, directly on the clipped section edge.
const slitFade = `linear-gradient(to bottom, ${getCoordinates('ease-in-out').map(({ x, y }) =>
  `color-mix(in oklab, var(--palette-paper) ${y * 100}%, transparent) ${x * 90}%`).join(', ')})`;

/** One live shader behind the hero's column fades. */
export function MenuHeroBackdrop() {
  const [patternReady, setPatternReady] = useState(false);
  const [columns, setColumns] = useState<number>();
  useEffect(() => {
    const narrow = matchMedia('(max-width: 767px)');
    const update = () => setColumns(narrow.matches ? 4 : 8);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  }, []);
  const fadeStyle = (index: number): CSSProperties => {
    const distance = (count: number) => ((Math.abs(index - (count - 1) / 2) - .5) / (count / 2 - 1)) ** 2;
    return {
      '--wide-height': `${42 + 36 * distance(10)}%`, '--wide-growth': .12 + .45 * distance(10),
      '--narrow-height': `${42 + 36 * distance(6)}%`, '--narrow-growth': .12 + .45 * distance(6),
    } as CSSProperties;
  };
  const left = (index: number) => `calc((100vw - var(--menu-track) * var(--menu-columns)) / 2 + var(--menu-track) * ${index - 1})`;
  return <div className={`${styles.backdrop} bg-ease-in-out-to-b from-(--palette-forest-shade) to-(--palette-paper)`} data-menu-hero-background
    style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', '--slit-fade': slitFade } as CSSProperties}>
    <div className={`${menu.patternBackdrop} ${styles.patternEntrance}`} data-hero-pattern-entrance data-ready={patternReady}>
      <picture className={styles.slitPoster}>
        <source media="(max-width: 767px)" srcSet={assetPath('/assets/figma/hero-slits-mobile.webp')} />
        <img src={assetPath('/assets/figma/hero-slits-desktop.webp')} alt="" fetchPriority="high" />
      </picture>
      <div className={styles.glassField} data-hero-pattern-source>
        {columns && <FlutedPattern count={columns + 2} onAvailabilityChange={setPatternReady} />}
      </div>
      {Array.from({ length: 10 }, (_, index) => <div key={index} className={styles.slit} style={{ left: left(index) }} data-hero-slit={index}>
        <span aria-hidden="true" data-hero-slit-fade className={styles.slitFade} style={fadeStyle(index)} />
      </div>)}
    </div>
  </div>;
}
