'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './scene-panel.module.css';

export type ScenePanelItem = { id: string; title: string; detail?: ReactNode; scene: ReactNode };

/**
 * The homepage "Now it's your turn" panel, for interior pages: one dark-green
 * panel with a list of steps on the left and the selected step's product scene
 * on the right. Each step is a disclosure button, so its detail can hold links.
 * Arrow keys, Home and End move between steps, as on the homepage.
 * Scenes picture what the detail says and stay hidden from assistive tech. Below
 * 900px the frame beside the list gives way to the open step's scene inside it.
 */
export function ScenePanel({ label, items, aside, className = '', visualClassName = '' }: {
  label: string; items: ScenePanelItem[]; aside?: ReactNode; className?: string; visualClassName?: string;
}) {
  const [active, setActive] = useState(0);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const prefix = useId();

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const next = event.key === 'ArrowDown' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowUp' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
    if (next === null) return;
    event.preventDefault();
    triggers.current[next]?.focus();
  }

  return <div className={`theme-dark ${styles.panel} ${className}`} data-theme="dark" role="group" aria-label={label}>
    <div className={styles.copy}>
      <ul className={styles.list}>
        {items.map((item, index) => {
          const open = active === index;
          return <li key={item.id} className={styles.item} data-active={open}>
            <h3 className={styles.heading}>
              <button type="button" className={styles.trigger} ref={element => { triggers.current[index] = element; }}
                id={`${prefix}-${item.id}-trigger`} aria-expanded={open} aria-controls={item.detail ? `${prefix}-${item.id}-detail` : undefined}
                onClick={() => setActive(index)} onKeyDown={event => move(event, index)}>
                <span className={`display ${styles.title}`}>{item.title}</span>
              </button>
            </h3>
            {item.detail && <div className={styles.detail} id={`${prefix}-${item.id}-detail`} role="region" aria-labelledby={`${prefix}-${item.id}-trigger`}
              aria-hidden={!open} inert={!open}>
              <div>
                <div className={styles.detailCopy}>{item.detail}</div>
                {/* Phones show the step's scene right under it, where the tap happened. */}
                <div className={styles.inlineVisual} aria-hidden="true"><div className={styles.inlineScene}>{open && item.scene}</div></div>
              </div>
            </div>}
          </li>;
        })}
      </ul>
      {aside && <div className={styles.aside}>{aside}</div>}
    </div>
    <div className={`${styles.visual} ${visualClassName}`} aria-hidden="true">
      {items.map((item, index) => <div key={item.id} className={styles.scene} data-active={active === index}>{item.scene}</div>)}
    </div>
  </div>;
}
