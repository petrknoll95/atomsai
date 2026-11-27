'use client';

import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './scene-panel.module.css';

export type ScenePanelItem = { id: string; title: string; label?: string; detail?: ReactNode; scene: ReactNode };

/** Scroll the page by a few pixels at once, whether ScrollSmoother or the browser is scrolling it. */
function scrollPageBy(delta: number) {
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTop(smoother.scrollTop() + delta);
  else window.scrollBy({ top: delta, behavior: 'instant' });
}

/**
 * The homepage "Now it's your turn" panel, for interior pages: one dark-green
 * panel with a list of steps on the left and the selected step's product scene
 * on the right. Each step is a disclosure button, so its detail can hold links.
 * Arrow keys, Home and End move between steps, as on the homepage.
 * Scenes picture what the detail says and stay hidden from assistive tech. Below
 * 900px the frame beside the list gives way to the open step's scene inside it.
 */
export function ScenePanel({ label, items, aside, className = '', visualClassName = '', tone = 'dark' }: {
  label: string; items: ScenePanelItem[]; aside?: ReactNode; className?: string; visualClassName?: string;
  /** light: the same panel on the pale scene shell, for a page that already has a dark step panel. */
  tone?: 'dark' | 'light';
}) {
  const [active, setActive] = useState(0);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const anchor = useRef<{ index: number; top: number } | null>(null);
  const prefix = useId();

  function select(index: number) {
    if (index === active) return;
    // On phones the open step's detail and scene sit in the list, so closing one above the
    // tapped step would pull it up out of view: remember where it was and keep it there.
    const trigger = triggers.current[index];
    if (trigger && window.matchMedia('(max-width: 899px)').matches) anchor.current = { index, top: trigger.getBoundingClientRect().top };
    setActive(index);
  }

  useLayoutEffect(() => {
    const saved = anchor.current;
    anchor.current = null;
    const trigger = saved && triggers.current[saved.index];
    if (!saved || !trigger) return;
    const top = trigger.getBoundingClientRect().top;
    let delta = top - saved.top;
    // A step tapped low on the screen opens below the fold: lift it toward the header,
    // just far enough for its detail and scene to come into view.
    const detail = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    const overflow = detail ? detail.getBoundingClientRect().bottom - window.innerHeight + 16 : 0;
    if (overflow > 0) delta += Math.min(overflow, Math.max(0, saved.top - 112));
    if (Math.abs(delta) >= 1) scrollPageBy(delta);
  }, [active]);

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const next = event.key === 'ArrowDown' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowUp' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
    if (next === null) return;
    event.preventDefault();
    triggers.current[next]?.focus();
  }

  const dark = tone === 'dark';
  return <div className={`${dark ? 'theme-dark ' : ''}${styles.panel} ${className}`} data-theme={tone} data-tone={tone} role="group" aria-label={label}>
    <div className={styles.copy}>
      <ul className={styles.list}>
        {items.map((item, index) => {
          const open = active === index;
          return <li key={item.id} className={styles.item} data-active={open}>
            <h3 className={styles.heading}>
              <button type="button" className={styles.trigger} ref={element => { triggers.current[index] = element; }}
                id={`${prefix}-${item.id}-trigger`} aria-expanded={open} aria-controls={item.detail ? `${prefix}-${item.id}-detail` : undefined}
                onClick={() => select(index)} onKeyDown={event => move(event, index)}>
                {item.label && <span className={styles.label}>{item.label}</span>}
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
