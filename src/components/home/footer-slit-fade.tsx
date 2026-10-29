'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { getCoordinates } from 'tw-easing-gradients';
import { Pattern } from '@/components/patterns/pattern';
import styles from './footer-slit-fade.module.css';

const fade = `linear-gradient(to bottom, ${getCoordinates('ease-in-out').map(({ x, y }) =>
  `color-mix(in oklab, var(--palette-forest-shade) ${(1 - y) * 100}%, transparent) ${x * 90}%`).join(', ')})`;

/** A still Offset field fading out of the solid footer at its top edge. */
export function FooterSlitFade() {
  const [columns, setColumns] = useState(8);
  useEffect(() => {
    const narrow = matchMedia('(max-width: 767px)');
    const update = () => setColumns(narrow.matches ? 4 : 8);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  }, []);
  const count = columns + 2;
  return <div className={styles.fade} aria-hidden="true" data-footer-slit-fade
    style={{ '--slit-columns': columns, '--slit-count': count } as CSSProperties}>
    <div className={styles.pattern}>
      <Pattern kind="offset" count={count} mode="dark" fit="stretch" loading="lazy" />
    </div>
    {Array.from({ length: count }, (_, index) => {
      const distance = (Math.abs(index - (count - 1) / 2) - .5) / (count / 2 - 1);
      return <span key={index} className={styles.slit} style={{
        left: `calc((100vw - var(--slit-track) * var(--slit-columns)) / 2 + var(--slit-track) * ${index - 1})`,
        height: `${72 + 28 * distance ** 2}%`,
        backgroundImage: fade,
      }} />;
    })}
  </div>;
}
