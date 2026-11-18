import type { ReactNode } from 'react';
import { MenuPatternHero } from './menu-hero/hero';
import { ProductFamily } from './story-sections';
import styles from './menu-hero/hero.module.css';

/** The dark hero and light follow-up retain their own themes in normal flow. */
export function MenuHero({ children }: { children: ReactNode }) {
  return <div className={styles.surface} data-theme="dark" data-hero-theme-surface>
    <MenuPatternHero productFamily={<ProductFamily className={styles.foldProducts} />}>{children}</MenuPatternHero>
  </div>;
}
