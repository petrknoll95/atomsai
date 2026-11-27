'use client';

import { useId, useState } from 'react';
import { SceneCanvas, SceneMark, SceneMuted, ScenePill, SceneRow, SceneWindow } from './scene-kit';
import styles from './applications-hero-stage.module.css';

export type HeroEvent = { product: string; mark: string; kind: string; text: string; time: string; meta: string; state: string };

/**
 * The hero's product moment, built like the homepage "Now it's your turn" panel:
 * one dark-green panel, a row of choices on its inner frame, and one scene at a
 * time. Each scene is the window an application shows after a hello; behind it
 * a stencil list of the same conversations, as the homepage scenes keep a faint
 * dashboard behind their cards. The first conversation shows on load; only the
 * visitor's choice changes it, so nothing moves under a reader.
 */
export function ApplicationsHeroStage({ events, className = '' }: { events: HeroEvent[]; className?: string }) {
  const [active, setActive] = useState(0);
  const scenesId = useId();

  return <div className={`theme-dark ${styles.panel} ${className}`} data-theme="dark">
    <div className={styles.frame}>
      <div className={styles.choices} role="group" aria-label="Conversations">
        {events.map((event, index) => <button key={event.text} type="button" aria-pressed={active === index} aria-controls={scenesId}
          onClick={() => setActive(index)}>{event.kind}</button>)}
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
