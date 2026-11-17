'use client';

import { useRef, type ComponentPropsWithoutRef } from 'react';
import { useHeadlineReveals } from './use-headline-reveals';
import styles from './section-reveals.module.css';

/** A plain div whose headlines reveal line by line as they scroll into view. */
export function HeadlineRevealScope({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  const rootRef = useRef<HTMLDivElement>(null);
  useHeadlineReveals(rootRef);
  return <div ref={rootRef} className={`${styles.scope} ${className}`.trim()} {...props} />;
}
