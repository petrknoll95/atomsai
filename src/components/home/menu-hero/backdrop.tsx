'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { getCoordinates } from 'tw-easing-gradients';
import dynamic from 'next/dynamic';
import menu from '../fullscreen-menu.module.css';
import styles from './hero.module.css';

const MotionPattern = dynamic(() => import('@/components/patterns/motion-pattern').then(module => module.MotionPattern), { ssr: false });
// Use the plugin's easing function, with an opaque tail in the same paint layer.
// Its stock utility always ends at 100%, directly on the clipped section edge.
const slitFade = `linear-gradient(to bottom, ${getCoordinates('ease-in-out').map(({ x, y }) =>
  `color-mix(in oklab, var(--palette-paper) ${y * 100}%, transparent) ${x * 90}%`).join(', ')})`;

/** One live shader; each reveal mask holds a sliding pair of equal pattern slits. */
export function MenuHeroBackdrop() {
  const backdropRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const failedRef = useRef(false);
  const [columns, setColumns] = useState(8);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const narrow = matchMedia('(max-width: 767px)');
    const update = () => setColumns(narrow.matches ? 4 : 8);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  }, []);
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    const copy = backdrop.closest('[data-hero-stage]')?.querySelector<HTMLElement>('[data-hero-copy]');
    const surfaces = copy ? [backdrop, copy] : [backdrop];
    if (copy) {
      const css = getComputedStyle(backdrop);
      for (const property of ['--menu-columns', '--hero-slit-masks', '--hero-slit-positions']) {
        copy.style.setProperty(property, backdrop.style.getPropertyValue(property) || css.getPropertyValue(property));
      }
    }
    const slitCount = columns + 2;
    const strips = Array.from(backdrop.querySelectorAll<HTMLElement>('[data-hero-slit-strip]'));
    const tiles = Array.from(backdrop.querySelectorAll<HTMLCanvasElement>('[data-hero-slit-content]'));
    const values = (value: string) => Object.fromEntries(Array.from({ length: slitCount }, (_, index) => [`--hero-slit-${index}`, value]));
    if (completedRef.current) {
      gsap.set(surfaces, values('100%'));
      backdrop.dataset.heroPatternState = 'open';
      if (copy) copy.dataset.heroCopyState = 'open';
      return;
    }
    backdrop.dataset.heroPatternState = 'opening';
    if (copy) copy.dataset.heroCopyState = 'opening';
    gsap.set(surfaces, values('0%'));
    // One full slit travels through each mask. The other slit starts outside it.
    // Each half travels outward in the same direction as its expanding mask.
    gsap.set(strips, { xPercent: (index: number) => index < slitCount / 2 ? 0 : -50 });
    gsap.set(tiles, {
      scale: 1.2,
      yPercent: (index: number) => Math.floor(index / 2) % 2 === 0 ? -10 : 10,
    });
    if (!ready) {
      if (failedRef.current && copy) copy.dataset.heroCopyState = 'open';
      return;
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let reveal: gsap.core.Timeline | undefined;
    const finish = () => {
      completedRef.current = true;
      backdrop.dataset.heroPatternState = 'open';
      if (copy) copy.dataset.heroCopyState = 'open';
      setPlaying(true);
    };
    // Freeze the shader at its first frame while the crops reveal, then resume
    // that same canvas. No extra WebGL contexts or continuous canvas copies.
    let disposed = false;
    const frame = requestAnimationFrame(async () => {
      await document.fonts.ready;
      if (disposed) return;
      const source = backdrop.querySelector<HTMLCanvasElement>('[data-hero-pattern-source] canvas');
      if (!source) return;
      const sourceBounds = source.getBoundingClientRect();
      for (const tile of tiles) {
        const bounds = tile.closest<HTMLElement>('[data-hero-slit]')!.getBoundingClientRect();
        const density = source.width / sourceBounds.width;
        tile.width = Math.ceil(bounds.width * density);
        tile.height = source.height;
        const context = tile.getContext('2d');
        context?.drawImage(source,
          (bounds.left - sourceBounds.left) * density, 0, bounds.width * density, source.height,
          0, 0, tile.width, tile.height);
      }
      reveal = gsap.timeline({ onComplete: finish });
      const middle = (slitCount - 1) / 2;
      const timing = { duration: 1.7, ease: 'power3.inOut' };
      for (let index = 0; index < slitCount; index++) {
        const delay = (Math.abs(index - middle) - .5) * .09;
        // Each pair travels exactly one cell while its own mask opens, with
        // matching easing for the horizontal shift, zigzag, and zoom.
        reveal.to(strips[index], { xPercent: index < slitCount / 2 ? -50 : 0, ...timing }, delay);
        reveal.to(tiles.slice(index * 2, index * 2 + 2), { yPercent: 0, scale: 1, ...timing }, delay);
        reveal.to(surfaces, { [`--hero-slit-${index}`]: '100%', ...timing }, delay);
      }
      if (reduced.matches) reveal.progress(1).pause();
    });
    const settle = () => { if (reduced.matches) reveal?.progress(1).pause(); };
    reduced.addEventListener('change', settle);
    return () => { disposed = true; cancelAnimationFrame(frame); reveal?.kill(); reduced.removeEventListener('change', settle); };
  }, [ready, columns]);
  const availability = useCallback((available: boolean) => {
    failedRef.current = !available;
    setReady(available);
    if (!available) {
      const copy = backdropRef.current?.closest('[data-hero-stage]')?.querySelector<HTMLElement>('[data-hero-copy]');
      if (copy) copy.dataset.heroCopyState = 'open';
    }
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
  const masks = Array.from({ length: slitCount }, (_, index) => `linear-gradient(to ${index < slitCount / 2 ? 'left' : 'right'}, #000 0%, #000 var(--hero-slit-${index}, 0%), transparent var(--hero-slit-${index}, 0%))`).join(', ');
  const left = (index: number) => `calc((100vw - var(--menu-track) * var(--menu-columns)) / 2 + var(--menu-track) * ${index - 1})`;
  const positions = Array.from({ length: slitCount }, (_, index) => `${left(index)} 0`).join(', ');
  return <div ref={backdropRef} className={`${menu.patternBackdrop} ${styles.backdrop}`} data-menu-hero-background
    style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', '--menu-columns': columns, '--menu-pattern-count': slitCount, '--hero-slit-masks': masks, '--hero-slit-positions': positions } as CSSProperties}>
    <div className={`${menu.patternField} ${styles.source}`} data-hero-pattern-source>
      <MotionPattern kind="offset" count={slitCount} mode="dark" fit="stretch" motion="tide" duration={12} intensity={0.7} resolution="display" playing={playing} onAvailabilityChange={availability} />
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
