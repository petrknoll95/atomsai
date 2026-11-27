'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { SceneCanvas, SceneMark, SceneMuted, ScenePill, SceneRow, SceneWindow } from './scene-kit';
import styles from './applications-hero-stage.module.css';

export type HeroEvent = { product: string; mark: string; kind: string; text: string; time: string; meta: string; state: string };

/** How long each conversation stays on screen while the panel plays by itself. */
const advanceAfter = 5000;

/**
 * The hero's product moment, built like the homepage "Now it's your turn" panel:
 * one dark-green panel, a row of choices on its inner frame, and one scene at a
 * time. Each scene is the window an application shows after a hello; behind it
 * a stencil list of the same conversations, as the homepage scenes keep a faint
 * dashboard behind their cards.
 *
 * It plays by itself only while it is on screen, the tab is visible, the pointer
 * is elsewhere and motion is welcome. Any click, tap or keyboard focus inside the
 * panel stops it for good, so the visitor's choice is never taken away.
 */
export function ApplicationsHeroStage({ events, className = '' }: { events: HeroEvent[]; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [running, setRunning] = useState(false);
  const scenesId = useId();

  useEffect(() => {
    const element = root.current;
    if (!element || stopped) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let hovered = false;
    const update = () => setRunning(visible && !hovered && !document.hidden && !reduced.matches);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .35 });
    const enter = () => { hovered = true; update(); };
    const leave = () => { hovered = false; update(); };
    const stop = () => { setRunning(false); setStopped(true); };
    observer.observe(element);
    element.addEventListener('pointerenter', enter);
    element.addEventListener('pointerleave', leave);
    element.addEventListener('pointerdown', stop);
    element.addEventListener('focusin', stop);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      element.removeEventListener('pointerenter', enter);
      element.removeEventListener('pointerleave', leave);
      element.removeEventListener('pointerdown', stop);
      element.removeEventListener('focusin', stop);
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
    };
  }, [stopped]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setActive(current => (current + 1) % events.length), advanceAfter);
    return () => window.clearTimeout(timer);
  }, [running, active, events.length]);

  return <div ref={root} className={`theme-dark ${styles.panel} ${className}`} data-theme="dark">
    <div className={styles.frame}>
      <div className={styles.choices} role="group" aria-label="Conversations">
        {events.map((event, index) => <button key={event.text} type="button" aria-pressed={active === index} aria-controls={scenesId}
          onClick={() => { setStopped(true); setActive(index); }}>{event.kind}</button>)}
      </div>
      <div className={styles.scenes} id={scenesId}>
        <div className={styles.composition}>
          <div className={styles.feed} aria-hidden="true">
            {events.map((event, index) => <div key={event.text} className={styles.feedRow} data-active={active === index}>
              <SceneMark src={`${event.mark}-mark.svg`} />
              <span className={styles.feedProduct}>{event.product}</span>
              <span className={styles.feedMeta}>{event.kind} · {event.time}</span>
            </div>)}
          </div>
          <div className={styles.windows}>
            {events.map((event, index) => <div key={event.text} className={styles.scene} data-active={active === index} aria-hidden={active !== index}>
              <SceneCanvas width={34}>
                <SceneWindow title={event.product} mark={`${event.mark}-mark.svg`} meta={event.kind}>
                  <p className={styles.eventText}>{event.text}</p>
                  <SceneRow end={<ScenePill tone="success">{event.state}</ScenePill>}><SceneMuted>{event.time} · {event.meta}</SceneMuted></SceneRow>
                </SceneWindow>
              </SceneCanvas>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </div>;
}
