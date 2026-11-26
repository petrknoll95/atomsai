'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { assetPath } from '@/lib/base-path';
import styles from './applications.module.css';

export type HeroEvent = { product: string; mark: string; kind: string; text: string; time: string; meta: string; state: string };

/** Route geometry in stage pixels: from the Hello chip to each event card. */
type Geometry = { width: number; height: number; startX: number; startY: number; endX: number; ends: number[] };

const advanceAfter = (clock: string, seconds: number) => {
  const [h, m, s] = clock.split(':').map(Number);
  const total = (h * 3600 + m * 60 + s + seconds) % 86400;
  return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map(part => String(part).padStart(2, '0')).join(':');
};

function route(geometry: Geometry, end: number) {
  const { startX, startY, endX } = geometry;
  const bend = startX + (endX - startX) * .5;
  return `M${startX} ${startY} C${bend} ${startY} ${bend} ${end} ${endX} ${end}`;
}

/**
 * The hero's conversation stage: one Hello, three outcomes. Each event takes a
 * turn: its route draws in from the chip and its progress line runs (a CSS
 * animation, paused off screen) before the next one takes over. The three
 * outcomes are read as a list; the chip with its ticking clock, the routes and
 * the progress lines are decoration and hidden from assistive technology.
 * Reduced motion keeps the first event connected and the clock still.
 */
export function ApplicationsHeroStage({ source, events }: { source: { label: string; time: string }; events: HeroEvent[] }) {
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const [clock, setClock] = useState(source.time);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  // Measure the real chip and card positions, so routes meet each card at any width.
  // The observer's first callback does the initial measure: a synchronous state
  // update here would land mid-mount and throw off the smooth-scroll deep-link offset.
  useEffect(() => {
    const stage = root.current;
    if (!stage) return;
    const measure = () => {
      const bounds = stage.getBoundingClientRect();
      const from = chip.current?.getBoundingClientRect();
      const targets = cards.current.map(card => card?.getBoundingClientRect());
      if (!from || !bounds.width || targets.some(target => !target)) return;
      setGeometry({
        width: bounds.width, height: bounds.height,
        startX: from.right - bounds.left, startY: from.top + from.height / 2 - bounds.top,
        endX: Math.min(...targets.map(target => target!.left)) - bounds.left,
        ends: targets.map(target => target!.top + target!.height / 2 - bounds.top),
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    cards.current.forEach(card => card && observer.observe(card));
    return () => observer.disconnect();
  }, []);

  // Run only while the stage is on screen, the tab is visible and motion is welcome.
  useEffect(() => {
    const stage = root.current;
    if (!stage) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => {
      const run = visible && !document.hidden && !reduced.matches;
      setRunning(run);
      if (reduced.matches) { setActive(0); setClock(source.time); }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .2 });
    observer.observe(stage);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
    };
  }, [source.time]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setClock(current => advanceAfter(current, 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  return <div ref={root} className={styles.stage} data-running={running}>
    <span className={styles.stageGlow} aria-hidden="true" />
    {geometry && <svg className={styles.routes} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false">
      {geometry.ends.map((end, index) => <path key={`base-${index}`} className={styles.route} d={route(geometry, end)} />)}
      {geometry.ends.map((end, index) => <path key={`active-${index}`} className={styles.routeActive} data-on={index === active} d={route(geometry, end)} pathLength={1} />)}
    </svg>}
    <div ref={chip} className={`theme-dark ${styles.source}`} aria-hidden="true">
      <span className={`display ${styles.sourceLabel}`}>{source.label}</span>
      <span className={styles.clock}>{clock}</span>
      <span className={styles.sourcePulse} />
    </div>
    <ol className={styles.events}>
      {events.map((event, index) => <li key={event.text} ref={element => { cards.current[index] = element; }} className={styles.event} data-on={index === active}>
        <div className={styles.eventHead}>
          <span className={styles.eventProduct}>
            <span className={styles.eventMark} aria-hidden="true" style={{ maskImage: assetPath(`url("/assets/products/${event.mark}-mark.svg")`) } as CSSProperties} />
            {event.product}
          </span>
          <span className={styles.eventKind}>{event.kind}</span>
        </div>
        <div className={styles.eventBody}>
          <p>{event.text}</p>
          <div className={styles.eventMeta}><span>{event.time}</span><span>{event.meta}</span><span className={styles.eventState}>{event.state}</span></div>
          <span className={styles.eventProgress} aria-hidden="true">
            <span onAnimationEnd={() => setActive(current => (current + 1) % events.length)} />
          </span>
        </div>
      </li>)}
    </ol>
  </div>;
}
