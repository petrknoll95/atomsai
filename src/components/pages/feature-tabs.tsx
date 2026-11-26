'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './feature-tabs.module.css';

export type FeatureTab = { id: string; title: string; meta?: string; panel: ReactNode };

/**
 * Numbered list of steps beside one stage that shows the selected step.
 * WAI-ARIA tabs with automatic activation: arrow keys, Home and End move
 * between steps. Every panel stays mounted in one grid cell, so the stage
 * keeps the height of its tallest step and can crossfade between them.
 */
export function FeatureTabs({ label, items, className = '', stageClassName = '' }: {
  label: string; items: FeatureTab[]; className?: string; stageClassName?: string;
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const prefix = useId();

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus({ preventScroll: true });
  }

  return <div className={`${styles.tabs} ${className}`}>
    <div className={styles.list} role="tablist" aria-label={label} aria-orientation="vertical">
      {items.map((item, index) => <button key={item.id} type="button" role="tab" ref={element => { tabs.current[index] = element; }}
        id={`${prefix}-${item.id}-tab`} aria-controls={`${prefix}-${item.id}-panel`} aria-selected={active === index}
        tabIndex={active === index ? 0 : -1} className={styles.tab} data-active={active === index}
        onClick={() => setActive(index)} onKeyDown={event => navigate(event, index)}>
        <span className={styles.index} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.copy}><span className={styles.title}>{item.title}</span>{item.meta && <span className={styles.meta}>{item.meta}</span>}</span>
      </button>)}
    </div>
    <div className={`${styles.stage} ${stageClassName}`}>
      {items.map((item, index) => <div key={item.id} id={`${prefix}-${item.id}-panel`} role="tabpanel" aria-labelledby={`${prefix}-${item.id}-tab`}
        className={styles.panel} data-active={active === index} aria-hidden={active !== index} inert={active !== index}>
        {item.panel}
      </div>)}
    </div>
  </div>;
}
