'use client';

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import { assetPath } from '@/lib/base-path';
import { drawCoverText, loadCoverFont } from './cover-text.mjs';
import config from './offsets.json';
import { offsetCount } from './seed.mjs';
import styles from './playground.module.css';

type Article = { slug: string; title: string };
type Renderer = Awaited<ReturnType<typeof import('./render-offsets.mjs').createOffsetsRenderer>>;
type RenderResult = { key: string; url: string } | { key: string; error: string };

function encodePng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')), 'image/png');
  });
}

export function Playground({ articles }: { articles: Article[] }) {
  const [palette, setPalette] = useState(config.palettes[0]);
  const [article, setArticle] = useState('');
  const [title, setTitle] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [draft, setDraft] = useState(String(config.defaultSeed));
  const [seed, setSeed] = useState(config.defaultSeed);
  const [result, setResult] = useState<RenderResult | null>(null);
  const caption = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Promise<Renderer> | null>(null);
  const queue = useRef(Promise.resolve());
  const key = `${palette.id}:${seed}`;
  const current = result?.key === key ? result : null;
  const renderUrl = current && 'url' in current ? current.url : null;
  const message = current && 'error' in current ? current.error : null;
  const pending = seed !== config.defaultSeed && !current;
  const source = renderUrl ?? assetPath(`/assets/blog/offsets/${palette.id}.png`);
  const previewSeed = renderUrl ? seed : config.defaultSeed;
  const seedSuffix = renderUrl ? `-${seed}` : '';
  const filename = `${article || `offsets-${palette.id}${seedSuffix}`}-cover.png`;
  const coverText = title.trim();

  useEffect(() => {
    const context = caption.current?.getContext('2d');
    if (!context) return;
    let stale = false;
    context.clearRect(0, 0, config.width, config.height);
    if (coverText) {
      void loadCoverFont(coverText).then(() => {
        if (!stale) drawCoverText(context, coverText);
      }, () => undefined);
    }
    return () => { stale = true; };
  }, [coverText]);

  useEffect(() => {
    if (seed === config.defaultSeed) return;
    let stale = false;
    queue.current = queue.current.then(async () => {
      if (stale) return;
      try {
        renderer.current ??= import('./render-offsets.mjs').then(module => module.createOffsetsRenderer(config));
        const engine = await renderer.current;
        if (stale) return;
        if (!engine) {
          setResult({ key, error: 'New seeds require WebGPU. You can download the default still.' });
          return;
        }

        const styles = getComputedStyle(document.documentElement);
        const colors = palette.tokens.map(token => styles.getPropertyValue(`--palette-${token}`).trim());
        const blob = await encodePng(await engine.render(seed, colors));
        if (!stale) setResult({ key, url: URL.createObjectURL(blob) });
      } catch {
        void renderer.current?.then(engine => engine?.dispose(), () => undefined);
        renderer.current = null;
        if (!stale) setResult({ key, error: 'This seed could not be rendered. The default still is available.' });
      }
    });
    return () => { stale = true; };
  }, [key, palette, seed]);

  useEffect(() => {
    if (!result || !('url' in result)) return;
    return () => URL.revokeObjectURL(result.url);
  }, [result]);

  useEffect(() => () => {
    const queued = queue.current;
    void queued.then(() => renderer.current).then(engine => engine?.dispose(), () => undefined);
  }, []);

  function applySeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(draft);
    if (draft === '' || !Number.isInteger(value) || value < 0 || value > config.maxSeed) return;
    setSeed(value);
  }

  function randomize() {
    let next: number;
    do {
      next = Math.floor(Math.random() * (config.maxSeed + 1));
    } while (offsetCount(next) === offsetCount(seed));
    setDraft(String(next));
    setSeed(next);
  }

  async function downloadWithText() {
    setExporting(true);
    setExportError(false);
    try {
      const image = new window.Image();
      image.src = source;
      await Promise.all([image.decode(), loadCoverFont(coverText)]);
      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('The export canvas could not be opened.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      drawCoverText(context, coverText);
      const url = URL.createObjectURL(await encodePng(canvas));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 id="hero-heading" className="display">Blog art playground</h1>
          <p>Seeded Offsets stills in the AtomsAI palette.</p>
        </div>
        {coverText ? (
          <button type="button" className={styles.download} disabled={pending || exporting} onClick={downloadWithText}>
            {exporting ? 'Preparing PNG…' : 'Download PNG'}
          </button>
        ) : (
          <a href={pending ? undefined : source} role={pending ? 'link' : undefined} download={filename}
            className={styles.download} aria-disabled={pending}>Download PNG</a>
        )}
      </header>

      <div className={styles.workspace}>
        <section className={styles.stage} aria-labelledby="preview-heading">
          <div className={styles.stageHeader}>
            <h2 id="preview-heading">Preview</h2>
          </div>
          <div className={styles.preview} aria-busy={pending}>
            <Image src={source} alt={`Offsets in ${palette.name}`} fill unoptimized
              sizes="(max-width: 820px) 90vw, 65vw" />
            <canvas ref={caption} className={styles.caption} width={config.width} height={config.height} aria-hidden="true" />
          </div>
          <div className={styles.stageFooter}>
            <p aria-live="polite">{pending ? 'Rendering still…' : `Seed ${previewSeed} · ${offsetCount(previewSeed)} offsets`}</p>
            <p>{config.width} × {config.height} PNG</p>
          </div>
          {message && <p className={styles.message} role="status">{message}</p>}
          {exportError && <p className={styles.message} role="status">The PNG could not be exported. Try downloading it again.</p>}
        </section>

        <aside className={styles.controls} aria-label="Cover controls">
          <label className={styles.select}>
            <span>Cover text</span>
            <input type="text" value={title} onChange={event => setTitle(event.currentTarget.value)} />
          </label>

          <form className={styles.seedControl} onSubmit={applySeed}>
            <label className={styles.select}>
              <span>Noise seed</span>
              <input type="number" required min={0} max={config.maxSeed} step={1}
                value={draft} onChange={event => setDraft(event.currentTarget.value)} />
            </label>
            <div className={styles.seedActions}>
              <button type="submit">Apply seed</button>
              <button type="button" onClick={randomize}>Randomize</button>
            </div>
          </form>

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
