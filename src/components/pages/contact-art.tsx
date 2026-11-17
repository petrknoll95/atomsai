'use client';

import { useEffect, useRef } from 'react';
import { assetPath } from '@/lib/base-path';
import styles from './contact.module.css';

// Frames rendered by scripts/contact-motion.mjs; frame 0 is the still, so swapping between the
// mask image and the inline SVG is seamless.
type Motion = { viewBox: [number, number, number, number]; fps: number; frames: string[] };
const loads = new Map<string, Promise<Motion>>();
function load(name: string) {
  let motion = loads.get(name);
  if (!motion) {
    motion = fetch(assetPath(`/assets/illustrations/contact-motion/${name}.json`)).then(response => {
      if (!response.ok) throw new Error(`contact motion ${name}: ${response.status}`);
      return response.json() as Promise<Motion>;
    });
    motion.catch(() => loads.delete(name));
    loads.set(name, motion);
  }
  return motion;
}

/**
 * Line illustration for a contact card. At rest it is a CSS mask tinted with the text colour.
 * While its card is hovered or focused it plays its loop; on leave it finishes the current
 * cycle back to the still. Reduced motion keeps the still.
 */
export function ContactArt({ name, ink }: { name: string; ink: [number, number] }) {
  const root = useRef<HTMLSpanElement>(null);
  const path = useRef<SVGPathElement>(null);

  useEffect(() => {
    const element = root.current, line = path.current, card = element?.closest('a');
    if (!element || !line || !card) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let active = false, frame = 0, start = 0, end = Infinity, motion: Motion | undefined;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.removeAttribute('data-playing');
    };
    const tick = (now: number) => {
      if (!motion) return;
      const index = Math.floor((now - start) / 1000 * motion.fps);
      if (index >= end) return stop();
      line.setAttribute('d', motion.frames[index % motion.frames.length]);
      frame = requestAnimationFrame(tick);
    };
    const enter = () => {
      if (reduce.matches) return;
      active = true;
      end = Infinity;
      load(name).then(loaded => {
        motion = loaded;
        if (!active || frame) return;
        line.ownerSVGElement?.setAttribute('viewBox', loaded.viewBox.join(' '));
        line.setAttribute('d', loaded.frames[0]);
        element.setAttribute('data-playing', '');
        start = performance.now();
        frame = requestAnimationFrame(tick);
      }, () => {});
    };
    const leave = () => {
      active = false;
      if (!frame || !motion) return;
      // Run to the end of the current cycle; its last frame leads back into the still.
      const index = Math.floor((performance.now() - start) / 1000 * motion.fps), count = motion.frames.length;
      end = Math.ceil((index + 1) / count) * count;
    };

    card.addEventListener('pointerenter', enter);
    card.addEventListener('pointerleave', leave);
    card.addEventListener('focus', enter);
    card.addEventListener('blur', leave);
    return () => {
      card.removeEventListener('pointerenter', enter);
      card.removeEventListener('pointerleave', leave);
      card.removeEventListener('focus', enter);
      card.removeEventListener('blur', leave);
      stop();
    };
  }, [name]);

  const [width, height] = ink;
  return <span className={styles.contactArt} aria-hidden="true">
    <span ref={root} className={styles.artInk} style={{ aspectRatio: `${width} / ${height}`, height: `calc(100% * ${height} / 219.734)` }}>
      <span className={styles.artStill} style={{ maskImage: `url("${assetPath(`/assets/illustrations/contact-${name}-line.svg`)}")` }} />
      <svg className={styles.artMotion} data-art={name} preserveAspectRatio="none">
        <path ref={path} fill="none" stroke="currentColor" strokeWidth="1.28" strokeLinejoin="miter" strokeLinecap="butt" />
      </svg>
    </span>
  </span>;
}
