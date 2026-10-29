'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pattern } from '@/components/patterns/pattern';
import type { PatternKind, PatternMode } from '@/components/patterns/types';
import styles from './pattern-lab.module.css';

type Settings = {
  kind: PatternKind;
  count: number;
  mode: PatternMode;
  rotation: number;
  zoom: number;
  panX: number;
  panY: number;
};

const families: { kind: PatternKind; name: string; description: string; presets: number[] }[] = [
  { kind: 'drift', name: 'Drift', description: 'Soft fields, interrupted by a steady rhythm.', presets: [5, 10, 20, 40] },
  { kind: 'offset', name: 'Offset', description: 'Shifted fields with a luminous edge.', presets: [5, 10, 20, 40] },
  { kind: 'single-band', name: 'Single band', description: 'A concentrated band of light and repetition.', presets: [5, 10, 20, 40] },
  { kind: 'concentric', name: 'Concentric', description: 'Rings that gather around a shared center.', presets: [15, 29] },
];

const initial: Settings = { kind: 'drift', count: 5, mode: 'light', rotation: 0, zoom: 1, panX: 0, panY: 0 };

function RangeControl({ label, value, display, min, max, step, onChange }: {
  label: string; value: number; display: string; min: number; max: number; step: number; onChange: (value: number) => void;
}) {
  return (
    <label className={styles.rangeControl}>
      <span className={styles.rangeLabel}><span>{label}</span><span className={styles.value} aria-hidden="true">{display}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} aria-label={label} aria-valuetext={display} />
    </label>
  );
}

export function PatternLab() {
  const [settings, setSettings] = useState<Settings>(initial);
  const [countDraft, setCountDraft] = useState(String(initial.count));
  const [compare, setCompare] = useState(false);
  const [nativeSize, setNativeSize] = useState(false);
  const [referenceFailed, setReferenceFailed] = useState(false);
  const family = families.find((item) => item.kind === settings.kind)!;
  const unit = settings.kind === 'concentric' ? 'rings' : 'slits';
  const sourceCount = family.presets.includes(settings.count);
  const defaultView = settings.mode === 'light' && settings.rotation === 0 && settings.zoom === 1 && settings.panX === 0 && settings.panY === 0;
  const referenceAvailable = sourceCount && defaultView;
  const showReference = compare && referenceAvailable && !referenceFailed;

  function update(changes: Partial<Settings>) {
    setSettings((previous) => ({ ...previous, ...changes }));
    setCompare(false);
    setReferenceFailed(false);
  }

  function updateCount(count: number) {
    setCountDraft(String(count));
    update({ count });
  }

  function reset() {
    setSettings(initial);
    setCountDraft(String(initial.count));
    setCompare(false);
    setReferenceFailed(false);
    setNativeSize(false);
  }

  return (
    <main className={styles.lab} id="hero-heading">
      <header className={styles.header}>
        <Link href="/" className={`display ${styles.brand}`}>AtomsAI<span aria-hidden="true">↗</span></Link>
        <span className={styles.headerLabel}>Pattern studio</span>
      </header>

      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>AtomsAI visual language</p>
          <h1 className={`display ${styles.heading}`}>Make room for variation.</h1>
        </div>
        <p className={styles.introText}>Explore four pattern families. Adjust their rhythm and framing, or return to the original settings.</p>
      </div>

      <div className={styles.workspace}>
        <section className={styles.preview} aria-label="Pattern preview">
          <div className={styles.previewHeader}>
            <div><h2 className={`display ${styles.familyName}`}>{family.name}</h2><p>{family.description}</p></div>
            <span className={styles.countBadge}>{settings.count} {unit}</span>
          </div>
          <div className={`${styles.canvasViewport} ${nativeSize ? styles.nativeViewport : ''}`}>
            <div className={`${styles.canvasFrame} ${nativeSize ? styles.nativeFrame : ''}`}>
              <Pattern {...settings} className={styles.canvas} label={`${family.name} pattern with ${settings.count} ${unit}, ${settings.mode} palette`} />
              {showReference && <img key={`${settings.kind}-${settings.count}`} className={styles.reference} src={`/pattern-references/${settings.kind}-${settings.count}.png`} width="800" height="800" alt="" aria-hidden="true" onError={() => setReferenceFailed(true)} />}
            </div>
          </div>
          <div className={styles.previewTools}>
            <label className={styles.checkbox}><input type="checkbox" checked={nativeSize} onChange={(event) => setNativeSize(event.currentTarget.checked)} /><span>View at original size <span className={styles.quiet}>(800 × 800)</span></span></label>
            <span className={styles.previewState}>{showReference ? 'Reference overlay · 50%' : 'Live pattern'}</span>
          </div>
          <p className={styles.renderNote}>Drawn live from shapes and gradients. Reference images are used only for comparison; the pattern never samples them.</p>
        </section>

        <aside className={styles.controls} aria-label="Pattern controls">
          <div className={styles.controlsHeading}><h2 className={`display ${styles.panelHeading}`}>Your settings</h2><button type="button" className={`link-underline ${styles.reset}`} onClick={reset}>Reset all</button></div>

          <fieldset className={styles.group}>
            <legend>Structure</legend>
            <label className={styles.field}>
              <span>Pattern family</span>
              <select value={settings.kind} onChange={(event) => {
                const kind = event.currentTarget.value as PatternKind;
                const nextCount = families.find((item) => item.kind === kind)!.presets[0];
                setCountDraft(String(nextCount));
                update({ kind, count: nextCount });
              }}>
                {families.map(({ kind, name }) => <option value={kind} key={kind}>{name}</option>)}
              </select>
            </label>
            <label className={`${styles.field} ${styles.countField}`}>
              <span>Number of {unit}</span>
              <input type="number" min="1" max="80" step="1" inputMode="numeric" value={countDraft} aria-describedby="pattern-count-help" onChange={(event) => {
                setCountDraft(event.currentTarget.value);
                const value = event.currentTarget.valueAsNumber;
                if (Number.isInteger(value) && value >= 1 && value <= 80) update({ count: value });
              }} onBlur={() => {
                const value = Number(countDraft);
                updateCount(countDraft.trim() && Number.isFinite(value) ? Math.max(1, Math.min(80, Math.round(value))) : settings.count);
              }} />
            </label>
            <p className={styles.helper} id="pattern-count-help">Choose any whole number from 1 to 80.</p>
            <div className={styles.presets} role="group" aria-label="Original count presets">
              {family.presets.map((count) => <button type="button" key={count} aria-pressed={settings.count === count} onClick={() => updateCount(count)}>{count}</button>)}
            </div>
            <p className={styles.helper}>Original counts from the design.</p>
          </fieldset>

          <fieldset className={styles.group}>
            <legend>Palette</legend>
            <div className={styles.modeChoices}>
              {(['light', 'dark'] as const).map((mode) => <label key={mode} className={styles.modeChoice} data-focus-surface><input type="radio" name="pattern-mode" value={mode} checked={settings.mode === mode} onChange={() => update({ mode })} /><span className={styles.modeSwatch} data-mode={mode} /><span>{mode === 'light' ? 'Light' : 'Dark'}</span></label>)}
            </div>
          </fieldset>

          <fieldset className={`${styles.group} ${styles.composition}`}>
            <legend>Framing</legend>
            <RangeControl label="Rotation" value={settings.rotation} display={`${settings.rotation}°`} min={-180} max={180} step={1} onChange={(rotation) => update({ rotation })} />
            <RangeControl label="Zoom" value={settings.zoom} display={`${settings.zoom.toFixed(2)}×`} min={1} max={3} step={0.05} onChange={(zoom) => update({ zoom })} />
            <RangeControl label="Horizontal crop" value={settings.panX} display={`${Math.round(settings.panX * 100)}%`} min={-1} max={1} step={0.05} onChange={(panX) => update({ panX })} />
            <RangeControl label="Vertical crop" value={settings.panY} display={`${Math.round(settings.panY * 100)}%`} min={-1} max={1} step={0.05} onChange={(panY) => update({ panY })} />
            <p className={styles.helper}>Crop moves within the available edge area. Zoom in to reveal more room to move.</p>
          </fieldset>

          <section className={styles.comparison} aria-labelledby="comparison-heading">
            <div className={styles.statusLine}><span className={styles.statusDot} data-source={referenceAvailable} /><h3 id="comparison-heading">{referenceAvailable ? 'Source settings' : 'Derived variation'}</h3></div>
            <p>{referenceAvailable ? 'An original count, light palette and unchanged framing. Turn on the reference to inspect the match.' : 'These settings extend the original design. Use a source count, the light palette and default framing to compare.'}</p>
            <button type="button" className={styles.compareButton} aria-pressed={showReference} disabled={!referenceAvailable || referenceFailed} onClick={() => setCompare((value) => !value)}>{showReference ? 'Hide reference overlay' : 'Compare with original'}</button>
            {referenceFailed && <p role="status" className={styles.referenceError}>This reference is unavailable. The live pattern is still shown.</p>}
          </section>
        </aside>
      </div>
      <footer className={styles.footer}><span>AtomsAI · Pattern studio</span><Link href="/">Back to the homepage <span aria-hidden="true">↗</span></Link></footer>
    </main>
  );
}
