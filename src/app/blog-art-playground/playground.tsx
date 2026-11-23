'use client';

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import type { createCoverRenderer } from './renderer';
import { defaults, height, palettes, width, type Cover, type Settings } from './settings';
import styles from './playground.module.css';

type Source = Cover | { slug: string; title: string; file: File };
type Renderer = Awaited<ReturnType<typeof createCoverRenderer>>;
type LoadedImage = { source: Source; image: HTMLImageElement };
const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

function Slider({ label, value, min = 0, max = 100, unit = '%', disabled, onChange }: {
  label: string; value: number; min?: number; max?: number; unit?: string; disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return <label className={styles.slider}>
    <span>{label}<span className={styles.value} aria-hidden="true">{value}{unit}</span></span>
    <input type="range" min={min} max={max} value={value} disabled={disabled}
      onChange={event => onChange(event.currentTarget.valueAsNumber)} />
  </label>;
}

export function Playground({ covers }: { covers: Cover[] }) {
  const [source, setSource] = useState<Source>(covers[0]);
  const [settings, setSettings] = useState(defaults);
  const [square, setSquare] = useState(false);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [result, setResult] = useState<{ source: Source; settings: Settings; shaderAvailable: boolean } | null>(null);
  const [error, setError] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const queue = useRef(Promise.resolve());
  const hasPreview = result?.source === source;
  const ready = hasPreview && result.settings === settings;
  const shaderDisabled = result?.shaderAvailable === false;

  useEffect(() => {
    let cancelled = false;
    let instance: Renderer | undefined;
    void import('./renderer').then(module => module.createCoverRenderer()).then(created => {
      if (cancelled) created.dispose();
      else {
        instance = created;
        setRenderer(created);
      }
    }).catch(() => {
      if (!cancelled) setError('The playground could not start. Reload to try again.');
    });
    return () => {
      cancelled = true;
      if (instance) void queue.current.then(instance.dispose);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const url = 'file' in source ? URL.createObjectURL(source.file) : source.src;
    const image = new Image();
    image.src = url;
    void image.decode().then(() => {
      if (cancelled) return;
      if (image.naturalWidth > 8192 || image.naturalHeight > 8192 || image.naturalWidth * image.naturalHeight > 32_000_000) {
        setError('Use an image under 32 megapixels and no more than 8192 pixels on either side.');
        return;
      }
      setLoaded({ source, image });
    }).catch(() => {
      if (!cancelled) setError('This image could not be opened. Try a PNG, JPEG, WebP, or AVIF.');
    });
    return () => {
      cancelled = true;
      if ('file' in source) URL.revokeObjectURL(url);
    };
  }, [source]);

  useEffect(() => {
    if (!renderer || loaded?.source !== source) return;
    let cancelled = false;
    const delay = window.setTimeout(() => {
      queue.current = queue.current.then(async () => {
        if (cancelled) return;
        const rendered = await renderer.render(loaded.image, settings);
        if (cancelled) return;
        const context = canvas.current?.getContext('2d', { alpha: false });
        if (!context) throw new Error('Preview canvas unavailable.');
        context.drawImage(rendered.canvas, 0, 0);
        setResult({ source, settings, shaderAvailable: rendered.shaderAvailable });
      }).catch(() => {
        if (!cancelled) setError('The preview could not be rendered. Try a different image or reload the page.');
      });
    }, 80);
    return () => { cancelled = true; window.clearTimeout(delay); };
  }, [renderer, settings, source, loaded]);

  function change(key: keyof Settings, value: number) {
    setSettings(previous => ({ ...previous, [key]: value }));
    if (loaded?.source === source) setError('');
  }

  function selectCover(slug: string) {
    const cover = covers.find(item => item.slug === slug);
    if (!cover) return;
    setError('');
    setSource(cover);
    setSettings(previous => ({ ...previous, zoom: 100, imageX: 50, imageY: 50 }));
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (file.type ? !imageTypes.includes(file.type) : !/\.(png|jpe?g|webp|avif)$/i.test(file.name)) {
      setError('Choose a PNG, JPEG, WebP, or AVIF image.');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setError('Choose an image smaller than 16 MB.');
      return;
    }
    const title = file.name.replace(/\.[^.]+$/, '');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'blog';
    setError('');
    setSource({ file, title, slug });
    setSettings(previous => ({ ...previous, zoom: 100, imageX: 50, imageY: 50 }));
  }

  function download() {
    if (!ready) return;
    canvas.current?.toBlob(blob => {
      if (!blob) {
        setError('The PNG could not be saved. Try downloading again.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${source.slug}-cover.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    }, 'image/png');
  }

  return (
    <main data-blog-art-playground className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 id="hero-heading" className="display">Blog art playground</h1>
          <p>Layer Compressed Sunflower over an image and export a cover in the AtomsAI palette.</p>
        </div>
        <button type="button" className={styles.download} disabled={!ready} onClick={download}>Download PNG</button>
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
          <div className={styles.preview} data-square={square || undefined} aria-busy={!ready && !error}>
            <canvas ref={canvas} width={width} height={height} role="img" aria-label={`Cover preview for ${source.title}`}
              className={hasPreview ? styles.rendered : styles.empty} />
            {!hasPreview && <p>{error ? 'Preview unavailable' : 'Preparing preview…'}</p>}
          </div>
          <div className={styles.stageFooter}>
            <p>{source.title}</p>
            <p>{width} × {height} PNG</p>
          </div>
          {shaderDisabled && <p className={styles.message} role="status">WebGPU is unavailable. You can still preview and export the image layer in brand colors.</p>}
          {error && <p className={styles.message} role="alert">{error}</p>}
        </section>

        <aside className={styles.controls} aria-label="Cover controls">
          <fieldset>
            <legend>Image layer</legend>
            <label className={styles.select}>
              <span>Existing cover</span>
              <select value={'file' in source ? '' : source.slug} onChange={event => selectCover(event.currentTarget.value)}>
                {'file' in source && <option value="" disabled>Uploaded image</option>}
                {covers.map(cover => <option key={cover.slug} value={cover.slug}>{cover.title}</option>)}
              </select>
            </label>
            <label className={styles.file}>
              <span>Upload image</span>
              <input type="file" accept={imageTypes.join(',')} onChange={upload} />
            </label>
            <details className={styles.crop}>
              <summary>Image crop</summary>
              <Slider label="Zoom" min={100} max={200} value={settings.zoom} onChange={value => change('zoom', value)} />
              <Slider label="Horizontal position" value={settings.imageX} onChange={value => change('imageX', value)} />
              <Slider label="Vertical position" value={settings.imageY} onChange={value => change('imageY', value)} />
            </details>
          </fieldset>

          <fieldset>
            <legend>Palette</legend>
            <div className={styles.palettes}>
              {palettes.map(({ name, tokens }, index) => (
                <button type="button" key={name} aria-pressed={settings.palette === index} onClick={() => change('palette', index)}>
                  <span>{name}</span>
                  <span className={styles.swatches} aria-hidden="true">
                    {tokens.map(token => <i key={token} style={{ '--ink': `var(--palette-${token})` } as CSSProperties} />)}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={shaderDisabled}>
            <legend>Compressed Sunflower</legend>
            <Slider label="Overlay opacity" value={settings.opacity} onChange={value => change('opacity', value)} />
            <Slider label="Halftone frequency" min={48} max={240} value={settings.frequency} unit="" onChange={value => change('frequency', value)} />
            <Slider label="Compression quality" min={1} max={50} value={settings.quality} unit="" onChange={value => change('quality', value)} />
            <Slider label="Burst horizontal position" value={settings.burstX} onChange={value => change('burstX', value)} />
            <Slider label="Burst vertical position" value={settings.burstY} onChange={value => change('burstY', value)} />
          </fieldset>

          <button type="button" className={styles.reset} onClick={() => { setSettings(defaults); if (loaded?.source === source) setError(''); }}>Reset settings</button>
        </aside>
      </div>
    </main>
  );
}
