'use client';

import { useState } from 'react';
import { BlogArt } from './blog-art';
import styles from './blog.module.css';

export type Story = { title: string; excerpt: string; category: string; artwork: string };

const GRID_COUNT = 6;

/** Topic filter, a three-up story grid, and the "More stories" list that takes the rest. */
export function BlogStories({ stories }: { stories: Story[] }) {
  const topics = ['All', ...new Set(stories.map(story => story.category))];
  const [topic, setTopic] = useState('All');
  const visible = topic === 'All' ? stories : stories.filter(story => story.category === topic);
  const grid = visible.slice(0, GRID_COUNT);
  const more = visible.slice(GRID_COUNT);

  return <section className={styles.stories} id="all" aria-labelledby="all-notes-title">
    <h2 className="sr-only" id="all-notes-title">All notes</h2>
    <div className={styles.filters} role="group" aria-label="Filter by topic">
      {topics.map(name => <button key={name} type="button" aria-pressed={topic === name}
        className={`button button-small ${topic === name ? 'button-primary' : 'button-ghost'}`}
        onClick={() => setTopic(name)}>{name}</button>)}
    </div>

    <ul className={styles.grid}>
      {grid.map(story => <li key={story.title}><article className={styles.card}>
        <div className={styles.cardImage}>
          <BlogArt artwork={story.artwork} sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw" />
          <span className={styles.tag}>{story.category}</span>
        </div>
        <div className={styles.cardCopy}>
          <h3 className={`display ${styles.cardTitle}`}>{story.title}</h3>
          <p className={styles.excerpt}>{story.excerpt}</p>
        </div>
      </article></li>)}
    </ul>

    {more.length > 0 && <div className={styles.more}>
      <h2 className={styles.moreLabel}>More stories</h2>
      <ul className={styles.moreList}>
        {more.map(story => <li key={story.title}><article className={styles.moreRow}>
          <div className={styles.moreCopy}>
            <p className={styles.meta}>{story.category}</p>
            <div className={styles.moreText}>
              <h3 className={`display ${styles.moreTitle}`}>{story.title}</h3>
              <p className={styles.excerpt}>{story.excerpt}</p>
            </div>
          </div>
          <div className={styles.moreImage}><BlogArt artwork={story.artwork} sizes="(max-width: 767px) 100vw, 33vw" /></div>
        </article></li>)}
      </ul>
    </div>}
  </section>;
}
