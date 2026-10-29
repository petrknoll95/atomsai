'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { mountFeedback } from './mount-feedback';
import styles from './feedback.module.css';

export function Feedback() {
  const pathname = usePathname();
  return <FeedbackControls key={pathname} pathname={pathname} />;
}

function FeedbackControls({ pathname }: { pathname: string }) {
  const controls = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controls.current) return mountFeedback(controls.current, pathname);
  }, [pathname]);

  return <div ref={controls} className={styles.feedback} data-feedback>
    <button type="button" aria-expanded="false" aria-label="Feedback" title="Feedback" data-feedback-toggle>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" data-feedback-icon="open">
        <path d="M2.66675 3H13.3334V10.3333H7.33341L4.66675 13V10.3333H2.66675V3Z" strokeWidth="1.33333" stroke="currentColor" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" data-feedback-icon="close">
        <path d="M3.33325 3.33334L12.6666 12.6667M3.33325 12.6667L7.06659 8.93334M8.93325 7.06667L12.6666 3.33334" strokeWidth="1.33333" stroke="currentColor" />
      </svg>
    </button>
    <p role="status" aria-live="polite" hidden data-feedback-status />
    <button type="button" hidden data-feedback-retry>Retry saving</button>
  </div>;
}
