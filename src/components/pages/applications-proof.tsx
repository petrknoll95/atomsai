'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { assetPath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink, Eyebrow } from '@/components/ui';
import type { ApplicationsBlock } from './applications-product';
import styles from './applications-proof.module.css';

/**
 * Customer stories, one voice at a time: the customers' logos are tabs and the
 * selected customer's quote reads at the homepage story size. Tabs follow the
 * WAI-ARIA pattern with manual activation: arrow keys, Home and End move focus,
 * Enter or Space selects. Nothing plays by itself. Every panel stays mounted in
 * one grid cell, so the section keeps the tallest quote's height; each names
 * the product behind the story, so Tab moves from the tabs straight into it.
 */
export function ApplicationsProofStories({ stories }: { stories: ApplicationsBlock[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const prefix = useId();

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = stories.length - 1;
    const next = event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
    if (next === null) return;
    event.preventDefault();
    tabs.current[next]?.focus();
  }

  return <div className={styles.stories}>
    <div className={styles.tabs} role="tablist" aria-label="Customer stories">
      {stories.map((story, index) => <button key={story.company} type="button" role="tab" className={styles.tab}
        ref={element => { tabs.current[index] = element; }} id={`${prefix}-tab-${index}`} aria-controls={`${prefix}-panel-${index}`}
        aria-selected={active === index} tabIndex={active === index ? 0 : -1}
        onClick={() => setActive(index)} onKeyDown={event => move(event, index)}>
        {story.logo ? <img className={styles.logo} src={assetPath(story.logo)} alt={story.company} width="184" height="64" loading="lazy" decoding="async" />
          : <span className={`display ${styles.wordmark}`}>{story.company}</span>}
      </button>)}
    </div>
    <div className={styles.panels}>
      {stories.map((story, index) => <div key={story.company} className={styles.panel} role="tabpanel"
        id={`${prefix}-panel-${index}`} aria-labelledby={`${prefix}-tab-${index}`} data-active={active === index} inert={active !== index}>
        <Eyebrow href={`#${story.label.toLowerCase()}`}>with {story.label}</Eyebrow>
        <figure className={styles.figure}>
          <blockquote className={`display ${styles.quote}`}>{story.quote}</blockquote>
          <figcaption className={styles.person}><span>{story.attribution}</span><span>{story.role}</span></figcaption>
        </figure>
        <ButtonLink href={story.links[0].href} target="_blank" rel="noopener noreferrer" size="small" variant="outline" className={styles.story}>
          {story.links[0].label}<span className="sr-only">: {story.company} (opens in a new tab)</span><ArrowIcon direction="up-right" size={14} />
        </ButtonLink>
      </div>)}
    </div>
  </div>;
}
