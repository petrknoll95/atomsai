'use client';

import { ArrowIcon } from '@/components/arrow-icon';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MotionPattern } from './motion-pattern';
import { motionPresets, type PatternMotion } from './motion-presets';
import { homePatternPlacements } from './home-pattern';
import type { PatternKind } from './types';
import styles from './motion-lab.module.css';

const families = [{ id: 'drift', name: 'Drift' }, { id: 'offset', name: 'Offset' }, { id: 'single-band', name: 'Single band' }, { id: 'concentric', name: 'Concentric' }] as const;
const irisPlacement = { drift: 'applications-drift', offset: 'applications-offset', 'single-band': 'applications-band', concentric: 'applications-concentric' } as const;

export function MotionLab() {
  const [motion, setMotion] = useState<PatternMotion>('ripple');
  const [kind, setKind] = useState<PatternKind>('concentric');
  const [palette, setPalette] = useState('forest-dark');
  const [count, setCount] = useState(15);
  const [duration, setDuration] = useState(8);
  const [intensity, setIntensity] = useState(0.7);
  const [playing, setPlaying] = useState(true);
  const [phase, setPhase] = useState<number | undefined>();
  const [progress, setProgress] = useState(0);
  const [original, setOriginal] = useState(false);
  const [available, setAvailable] = useState(true);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReduced(media.matches); if (media.matches) setPlaying(false); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const studies = motionPresets.filter(item => item.id !== 'ripple' || kind === 'concentric');
  const preset = motionPresets.find(item => item.id === motion)!;
  const presets = kind === 'concentric' ? [15, 29] : [5, 10, 20, 40];
  const cycle = phase ?? progress;
  return <main className={styles.lab}>
    <header className={styles.header}>
      <Link href="/" aria-label="AtomsAI home"><img src="/assets/figma/hero-Logo.svg" alt="AtomsAI" width="136" height="24" /></Link>
      <span>Motion studies <span className={styles.edition}>/ Light & waves</span></span>
      <Link href="/patterns"><span className="link-underline">Still-pattern studio</span> <span aria-hidden="true"><ArrowIcon direction="up-right" /></span></Link>
    </header>
    <section className={styles.intro} aria-labelledby="hero-heading">
      <div><p className={styles.eyebrow}>A quiet change in light</p><h1 id="hero-heading" tabIndex={-1} className={`display ${styles.title}`}>Light in motion.<br />Waves without end.</h1></div>
      <p>Light Tide washes through the linear patterns.<br />Concentric rings flow outward in endless waves.<br />The palette stays the same.</p>
    </section>
    <div className={styles.workspace}>
      <section className={styles.preview} aria-label="Motion preview">
        <div className={styles.previewTop}><span>{families.find(family => family.id === kind)!.name} <span className={styles.quiet}>/ {count} {kind === 'concentric' ? 'rings' : 'slits'}</span></span><span className={styles.status}><i data-playing={playing && available && !reduced && !original && phase === undefined} />{!available ? 'Preview unavailable' : original ? 'Original still' : reduced ? 'Reduced motion' : playing && phase === undefined ? 'Playing' : 'Paused'}</span></div>
        <div className={styles.canvasFrame} data-motion-preview data-light={palette === 'forest-light'}>
          <MotionPattern kind={kind} count={count} mode={palette === 'forest-light' ? 'light' : 'dark'} colors={palette === 'iris' ? homePatternPlacements[irisPlacement[kind]].options.colors : undefined} motion={motion} duration={duration} intensity={original ? 0 : intensity} playing={playing && !original} phase={phase} onProgress={setProgress} onAvailabilityChange={setAvailable} />
          <div className={styles.previewCaption} aria-hidden="true"><span>{String(preset.shader + 1).padStart(2, '0')}</span><span>{preset.name}<small>{duration}s seamless loop</small></span></div>
        </div>
        <div className={styles.transport}>
          <button type="button" className={styles.play} disabled={reduced || original || !available} onClick={() => { setPhase(undefined); setPlaying(!playing || phase !== undefined); }}>{playing && phase === undefined ? 'Pause' : 'Play'}</button>
          <label className={styles.timeline}><span className={styles.srOnly}>Loop position</span><input aria-label="Loop position" aria-valuetext={`${Math.round(cycle * 100)}% of loop`} type="range" min="0" max="100" step="0.1" value={cycle * 100} onChange={event => { setPlaying(false); setPhase(Number(event.target.value) / 100); }} /><span>{Math.round(cycle * 100)}%</span></label>
          <button type="button" className={styles.compare} aria-pressed={original} onClick={() => setOriginal(!original)}>Compare still</button>
        </div>
        <p className={styles.note}>{reduced ? 'Your reduced-motion preference is on. Use the timeline to inspect individual frames.' : 'Pause anywhere, scrub a full cycle, or compare with the original still.'}</p>
      </section>
      <aside className={styles.controls} aria-label="Motion controls">
        <div className={styles.sectionLabel}><h2>Choose a movement</h2><span>{studies.length} studies</span></div>
        <div className={styles.studies} role="group" aria-label="Motion studies">
          {studies.map((item, index) => <button type="button" key={item.id} aria-pressed={motion === item.id} onClick={() => { setMotion(item.id); setDuration(item.duration); setPhase(playing ? undefined : 0); setOriginal(false); }}><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span><span><strong>{item.name}</strong><small>{item.description}</small></span><span aria-hidden="true" className={styles.selection}>{motion === item.id ? '●' : '○'}</span></button>)}
        </div>
        <div className={styles.settings}>
          <div className={styles.selects}><label>Pattern<select value={kind} onChange={event => { const next = event.target.value as PatternKind; setKind(next); setCount(next === 'concentric' ? 15 : 5); const movement = next === 'concentric' ? 'ripple' : 'tide'; setMotion(movement); setDuration(motionPresets.find(item => item.id === movement)!.duration); setPhase(playing ? undefined : 0); setOriginal(false); }} aria-label="Pattern family">{families.map(family => <option key={family.id} value={family.id}>{family.name}</option>)}</select></label><label>Palette<select aria-label="Palette" value={palette} onChange={event => setPalette(event.target.value)}><option value="forest-dark">Forest dark</option><option value="forest-light">Forest light</option><option value="iris">Iris</option></select></label></div>
          <div className={styles.density}><span>{kind === 'concentric' ? 'Rings' : 'Slits'}</span><div role="group" aria-label="Pattern density">{presets.map(value => <button type="button" key={value} aria-pressed={count === value} onClick={() => setCount(value)}>{value}</button>)}</div></div>
          <label className={styles.range}><span>Intensity <output>{Math.round(intensity * 100)}%</output></span><input aria-label="Intensity" type="range" min="0" max="1" step="0.05" value={intensity} onChange={event => setIntensity(Number(event.target.value))} /><small>{motion === 'ripple' ? 'Blend from the still pattern into flowing waves. Full flow at 70%.' : 'Gentle changes to existing tones. No hue cycling.'}</small></label>
          <label className={styles.range}><span>Loop duration <output>{duration}s</output></span><input aria-label="Loop duration" type="range" min="8" max="40" step="1" value={duration} onChange={event => setDuration(Number(event.target.value))} /></label>
        </div>
      </aside>
    </div>
    <footer className={styles.footer}><span>Fixed palette. Light in motion. Waves without end.</span><span>Playback rests when the preview is off screen.</span><Link href="/">Back to homepage <ArrowIcon direction="up-right" /></Link></footer>
  </main>;
}
