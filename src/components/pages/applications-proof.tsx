'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { assetPath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink, Eyebrow } from '@/components/ui';
import type { ApplicationsBlock } from './applications-product';
import styles from './applications-proof.module.css';

type Stat = { value: string; label: string; company?: string };

/**
 * Customer stories, one voice at a time: a row of customer logos are the tabs,
 * and the selected customer's story fills the row beneath, set like the homepage
 * story: the quote on the left; on the right the person, the figure the stats
 * strip credits to the same company (when there is one) and the story link.
 * Tabs follow the WAI-ARIA pattern with manual activation: arrow keys, Home and
 * End move focus, Enter or Space selects. Nothing plays by itself. Every panel
 * stays mounted in one grid cell, so the section keeps the tallest story's height.
 */
export function ApplicationsProofStories({ stories, stats = [], initial = 0 }: { stories: ApplicationsBlock[]; stats?: Stat[]; initial?: number }) {
  const [active, setActive] = useState(initial);
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
      {stories.map((story, index) => {
        const figure = stats.find(stat => stat.company === story.company);
        return <div key={story.company} className={styles.panel} role="tabpanel"
          id={`${prefix}-panel-${index}`} aria-labelledby={`${prefix}-tab-${index}`} data-active={active === index} inert={active !== index}>
          <Eyebrow href={`#${story.label.toLowerCase()}`} className={styles.eyebrow}>with {story.label}</Eyebrow>
          <blockquote className={`display ${styles.quote}`}>{story.quote}</blockquote>
          <div className={styles.aside}>
            <p className={styles.person}><span>{story.attribution}</span><span>{story.role}</span></p>
            {figure && <p className={styles.figure}><span className="display">{figure.value}</span><span>{figure.label}</span></p>}
            <ButtonLink href={story.links[0].href} target="_blank" rel="noopener noreferrer" variant="outline">
              {story.links[0].label}<span className="sr-only">: {story.company} (opens in a new tab)</span><ArrowIcon direction="up-right" size={16} />
            </ButtonLink>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
