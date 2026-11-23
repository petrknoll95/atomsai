'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { assetPath } from '@/lib/base-path';
import config from './offsets.json';
import styles from './playground.module.css';

type Article = { slug: string; title: string };

export function Playground({ articles }: { articles: Article[] }) {
  const [palette, setPalette] = useState(config.palettes[0]);
  const [article, setArticle] = useState('');
  const [square, setSquare] = useState(false);
  const source = assetPath(`/assets/blog/offsets/${palette.id}.png`);
  const filename = `${article || `offsets-${palette.id}`}-cover.png`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 id="hero-heading" className="display">Blog art playground</h1>
          <p>Offsets stills in the AtomsAI palette.</p>
        </div>
        <a href={source} download={filename} className={styles.download}>Download PNG</a>
      </header>

      <div className={styles.workspace}>
        <section className={styles.stage} aria-labelledby="preview-heading">
          <div className={styles.stageHeader}>
            <h2 id="preview-heading">Preview</h2>
            <div className={styles.viewSwitch} role="group" aria-label="Preview crop">
              <button type="button" aria-pressed={!square} onClick={() => setSquare(false)}>Wide cover</button>
              <button type="button" aria-pressed={square} onClick={() => setSquare(true)}>Square crop</button>
            </div>
          </div>
          <div className={styles.preview} data-square={square || undefined}>
            <Image src={source} alt={`Offsets in ${palette.name}`} fill unoptimized
              sizes="(max-width: 820px) 90vw, 65vw" />
          </div>
          <div className={styles.stageFooter}>
            <p>{palette.name}</p>
            <p>{config.width} × {config.height} PNG</p>
          </div>
        </section>

        <aside className={styles.controls} aria-label="Cover controls">
          <fieldset>
            <legend>Palette</legend>
            <div className={styles.palettes}>
              {config.palettes.map(item => (
                <button type="button" key={item.id} aria-pressed={palette.id === item.id} onClick={() => setPalette(item)}>
                  <span>{item.name}</span>
                  <span className={styles.swatches} aria-hidden="true">
                    {item.tokens.map(token => <i key={token} style={{ '--ink': `var(--palette-${token})` } as CSSProperties} />)}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className={styles.select}>
            <span>Article filename</span>
            <select value={article} onChange={event => setArticle(event.currentTarget.value)}>
              <option value="">Use palette name</option>
              {articles.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
            </select>
          </label>
        </aside>
      </div>
    </main>
  );
}
