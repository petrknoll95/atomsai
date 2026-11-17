'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { getCoordinates } from 'tw-easing-gradients';
import dynamic from 'next/dynamic';
import type { MotionPatternProps } from '@/components/patterns/motion-pattern';
import menu from '../fullscreen-menu.module.css';
import styles from './hero.module.css';

function UnavailablePattern({ onAvailabilityChange }: MotionPatternProps) {
  useEffect(() => { onAvailabilityChange?.(false); }, [onAvailabilityChange]);
  return null;
}
const MotionPattern = dynamic<MotionPatternProps>(() => import('@/components/patterns/motion-pattern')
  .then(module => module.MotionPattern).catch(() => UnavailablePattern), { ssr: false });
// Use the plugin's easing function, with an opaque tail in the same paint layer.
// Its stock utility always ends at 100%, directly on the clipped section edge.
const slitFade = `linear-gradient(to bottom, ${getCoordinates('ease-in-out').map(({ x, y }) =>
  `color-mix(in oklab, var(--palette-paper) ${y * 100}%, transparent) ${x * 90}%`).join(', ')})`;

/** One live shader behind the hero's column fades. */
export function MenuHeroBackdrop({ onAvailabilityChange }: { onAvailabilityChange: (available: boolean) => void }) {
  const [columns, setColumns] = useState(8);
  useEffect(() => {
    const narrow = matchMedia('(max-width: 767px)');
    const update = () => setColumns(narrow.matches ? 4 : 8);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  }, []);
  const slitCount = columns + 2;
  const fadeStyle = (index: number): CSSProperties => {
    const distance = (Math.abs(index - (slitCount - 1) / 2) - .5) / (slitCount / 2 - 1);
    // A symmetric parabola keeps the central pair low and lifts both edges.
    return {
      backgroundImage: slitFade,
      '--hero-fade-height': `${42 + 36 * distance ** 2}%`,
      '--hero-fade-growth': .12 + .45 * distance ** 2,
    } as CSSProperties;
  };
  const left = (index: number) => `calc((100vw - var(--menu-track) * var(--menu-columns)) / 2 + var(--menu-track) * ${index - 1})`;
  return <div className={styles.backdrop} data-menu-hero-background
    style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', '--menu-columns': columns, '--menu-pattern-count': slitCount } as CSSProperties}>
    <div className={`${menu.patternBackdrop} ${styles.patternEntrance}`} data-hero-pattern-entrance>
      <div className={menu.patternField} data-hero-pattern-source>
        <MotionPattern kind="offset" count={slitCount} mode="dark" fit="stretch" motion="tide" duration={12} intensity={0.7} resolution="display" playing onAvailabilityChange={onAvailabilityChange} />
      </div>
      {Array.from({ length: slitCount }, (_, index) => <div key={index} className={styles.slit} style={{ left: left(index) }} data-hero-slit={index}>
        <span aria-hidden="true" data-hero-slit-fade className={styles.slitFade} style={fadeStyle(index)} />
      </div>)}
    </div>
  </div>;
}
