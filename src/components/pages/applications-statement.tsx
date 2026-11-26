'use client';

import { Fragment, useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './applications.module.css';

type Need = { index: string; title: string; body: string };

/** Words as spans, so scroll progress can light them in reading order. */
function Words({ text, emphasis = '' }: { text: string; emphasis?: string }) {
  const words = text.split(' ');
  const emphasised = emphasis && text.endsWith(emphasis) ? emphasis.split(' ').length : 0;
  return words.map((word, index) => <Fragment key={index}>
    <span data-word className={index >= words.length - emphasised ? styles.emphasis : undefined}>{word}</span>{index < words.length - 1 ? ' ' : ''}
  </Fragment>);
}

/**
 * "All that engineering": the statement reads in as the section scrolls
 * through the viewport, word by word from muted to full colour. Server HTML,
 * reduced motion and print show every word at full colour.
 */
export function ApplicationsStatement({ id, title, needs, statement, emphasis, kicker }: {
  id: string; title: string; needs: Need[]; statement: string; emphasis?: string; kicker: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    gsap.registerPlugin(ScrollTrigger);
    const words = [...element.querySelectorAll<HTMLElement>('[data-word]')];
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      let lit = -1;
      const light = (progress: number) => {
        const count = Math.round(progress * words.length * 1.02);
        if (count !== lit) {
          words.forEach((word, index) => { word.dataset.lit = String(index < count); });
          lit = count;
        }
        bar.current?.style.setProperty('--statement-progress', progress.toFixed(3));
      };
      element.dataset.statement = 'scroll';
      const trigger = ScrollTrigger.create({
        trigger: element,
        start: 'top 78%',
        end: 'bottom 52%',
        onUpdate: self => light(self.progress),
        onRefresh: self => light(self.progress),
      });
      light(trigger.progress);
      return () => {
        trigger.kill();
        delete element.dataset.statement;
        words.forEach(word => { delete word.dataset.lit; });
        bar.current?.style.removeProperty('--statement-progress');
      };
    });
    return () => media.revert();
  }, []);

  return <div ref={root} className={styles.statement}>
    {kicker}
    <h2 id={id} className={`display ${styles.statementTitle}`} data-text-reveal="off"><Words text={title} /></h2>
    <div className={styles.needs}>
      {needs.map(need => <div key={need.title} className={styles.need}>
        <p className={styles.needLabel}><span>{need.index}</span><span className={styles.needRule} aria-hidden="true" />{need.title}</p>
        <p className={styles.needText}><Words text={need.body} /></p>
      </div>)}
    </div>
    <p className={styles.statementText}><Words text={statement} emphasis={emphasis} /></p>
    <span ref={bar} className={styles.statementBar} aria-hidden="true" />
  </div>;
}
