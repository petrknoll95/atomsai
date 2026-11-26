'use client';

import { useId, useState, type CSSProperties } from 'react';
import styles from './infrastructure.module.css';

export type BandwidthContent = {
  label: string; title: string; body: string; from: string; to: string;
  kept: string; transcriptLabel: string; transcript: string;
};

const bars = 72;
/** The share of the visible spectrum that a phone line keeps: 3.4 of 20 kHz. */
const phoneBand = .17;
// The prototype's speech envelope at rest: energy falls away towards 20 kHz.
const spectrum = Array.from({ length: bars }, (_, index) => {
  const u = index / bars;
  return { peak: Math.exp(-u * 2.2) * (.7 + .3 * Math.sin(index * 2.1)), rest: .55 + .45 * Math.abs(Math.sin(index * .9)) };
});

/** Slider from studio microphone (20 kHz) to phone line (3.4 kHz), as in the prototype. */
export function InfrastructureBandwidth({ content }: { content: BandwidthContent }) {
  const [value, setValue] = useState(0);
  const id = useId();
  const kept = 20 - 16.6 * value / 100;
  const keptLabel = `${kept < 10 ? kept.toFixed(1) : Math.round(kept)} kHz`;
  const end = value === 0 ? `${content.from}, ` : value === 100 ? `${content.to}, ` : '';
  const cutoff = 1 - value / 100 * (1 - phoneBand);

  return <div className={styles.tryIt}>
    <div className={styles.tryCopy}>
      <p className={styles.tryLabel}>{content.label}</p>
      <h3 className={`display ${styles.tryTitle}`}>{content.title}</h3>
      <p className={styles.tryBody}>{content.body}</p>
      <div className={styles.rangeField}>
        <label htmlFor={id} className={styles.rangeLabels}><span>{content.from}</span><span>{content.to}</span></label>
        <input id={id} className={styles.range} type="range" min={0} max={100} step={1} value={value}
          onChange={event => setValue(Number(event.target.value))}
          aria-valuetext={`${end}${keptLabel} ${content.kept.toLowerCase()}`}
          style={{ '--value': `${value}%` } as CSSProperties} />
      </div>
      <dl className={styles.tryOutput}>
        <div><dt>{content.kept}</dt><dd>{keptLabel}</dd></div>
        <div><dt>{content.transcriptLabel}</dt><dd>{content.transcript}</dd></div>
      </dl>
    </div>
    {/* Beside the copy the header stays on the page's theme; stacked, the zone turns it dark over the spectrum. */}
    <div className={styles.spectrum} data-theme="dark" data-header-theme="light" aria-hidden="true">
      <span className={styles.headerZone} data-header-theme="dark" />
      <div className={styles.spectrumBars} style={{ '--cutoff': `${cutoff * 100}%` } as CSSProperties}>
        {spectrum.map(({ peak, rest }, index) => <i key={index} data-kept={index / bars < cutoff} data-band={index / bars < phoneBand}
          style={{ height: `${(peak * 78).toFixed(2)}%`, '--rest': rest.toFixed(3), animationDelay: `${-(index * 630) % 2200}ms` } as CSSProperties} />)}
        <span className={styles.cutoff} />
        <span className={styles.cutoffLabel}>{value > 2 ? `${keptLabel} cutoff` : 'full band'}</span>
      </div>
      <div className={styles.spectrumScale}><span>0 Hz</span><span>20 kHz</span></div>
    </div>
  </div>;
}
