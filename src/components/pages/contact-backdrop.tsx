'use client';

import dynamic from 'next/dynamic';
import styles from './contact.module.css';

const MotionPattern = dynamic(() => import('@/components/patterns/motion-pattern').then(module => module.MotionPattern), { ssr: false });

/** Live slit pattern behind the contact hero panel; the panel colour shows until it loads. */
export function ContactBackdrop() {
  return <div className={styles.backdrop} aria-hidden="true">
    <MotionPattern kind="offset" count={10} mode="dark" fit="cover" motion="tide" duration={14} intensity={0.6} resolution="balanced" playing />
  </div>;
}
