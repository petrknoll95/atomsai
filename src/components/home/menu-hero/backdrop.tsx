'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { getCoordinates } from 'tw-easing-gradients';
import dynamic from 'next/dynamic';
import menu from '../fullscreen-menu.module.css';
import styles from './hero.module.css';

const MotionPattern = dynamic(() => import('@/components/patterns/motion-pattern').then(module => module.MotionPattern), { ssr: false });
// Use the plugin's easing function, with an opaque tail in the same paint layer.
// Its stock utility always ends at 100%, directly on the clipped section edge.
const slitFade = `linear-gradient(to bottom, ${getCoordinates('ease-in-out').map(({ x, y }) =>
  `color-mix(in oklab, var(--palette-paper) ${y * 100}%, transparent) ${x * 90}%`).join(', ')})`;

/** One live shader behind the hero's column fades. */
export function MenuHeroBackdrop() {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(8);
  useEffect(() => {
    const narrow = matchMedia('(max-width: 767px)');
    const update = () => setColumns(narrow.matches ? 4 : 8);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  }, []);
  // No intro reveal: the backdrop starts open and the shader plays straight away.
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    backdrop.dataset.heroPatternState = 'open';
    const copy = backdrop.closest('[data-hero-stage]')?.querySelector<HTMLElement>('[data-hero-copy]');
    if (copy) copy.dataset.heroCopyState = 'open';
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
  return <div ref={backdropRef} className={`${menu.patternBackdrop} ${styles.backdrop}`} data-menu-hero-background
    style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', '--menu-columns': columns, '--menu-pattern-count': slitCount } as CSSProperties}>
    <div className={`${menu.patternField} ${styles.source}`} data-hero-pattern-source>
      <MotionPattern kind="offset" count={slitCount} mode="dark" fit="stretch" motion="tide" duration={12} intensity={0.7} resolution="display" playing />
    </div>
    {Array.from({ length: slitCount }, (_, index) => <div key={index} className={styles.slit} style={{ left: left(index) }} data-hero-slit={index}>
      <div className={styles.slitStrip} data-hero-slit-strip>
        {[0, 1].map(cell => <div key={cell} className={styles.slitCell} data-hero-slit-cell>
          <canvas className={styles.slitContent} data-hero-slit-content />
        </div>)}
      </div>
      <span aria-hidden="true" data-hero-slit-fade className={styles.slitFade} style={fadeStyle(index)} />
    </div>)}
  </div>;
}
