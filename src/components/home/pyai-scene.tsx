import { assetPath } from '@/lib/base-path';
import styles from './pyai-scene.module.css';

const bars = Array.from({ length: 40 }, (_, i) => 10 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * .31)) * 70);

export function PyAIScene({ field = 'intent' }: { field?: 'intent' | 'day' | 'language' }) {
  return <div className={styles.system} data-pyai-system aria-hidden="true">
    <div className={styles.console}>
      <header><span className={styles.title}>Voice playground</span><span className={styles.status}>API connected</span></header>
      <div className={styles.consoleTabs}><span>Speech to text</span><span>Text to speech</span><span>Voice agents</span></div>
      <div className={styles.consoleRows}>{['Audio input', 'Transcription', 'Structured output', 'Request details'].map(label => <div key={label}><span>{label}</span><span>✓</span></div>)}</div>
      <footer><span>8 kHz · WAV</span><span>Transcription complete</span></footer>
    </div>
    <div className={styles.foreground}>
      <div className={`${styles.card} ${styles.input}`}>
        <header className={styles.header}><img src={assetPath('/assets/products/pyai-mark.svg')} width="24" height="24" alt="" /><span className={styles.title}>PyAI</span><span className={styles.muted}>Speech to text</span></header>
        <div className={styles.content}>
          <div className={styles.label}><span>Input audio</span><span className={styles.muted}>8 kHz · WAV</span></div>
          <div className={styles.audio}><span className={styles.play}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5 12 8l-7 4.5Z" fill="currentColor"/></svg></span><div className={styles.wave}>{bars.map((height, index) => <i key={index} style={{height:`${Math.round(height)}%`}}/>)}</div></div>
          <div className={styles.time}><span>appointment.wav</span><span>00:08</span></div>
          <p className={styles.label}>Transcript</p>
          <p className={styles.transcript}>Can we move my appointment to <mark>Thursday</mark>?</p>
        </div>
        <div className={styles.footer}><i/><span>Transcription complete</span><span className={styles.muted}>English</span></div>
      </div>
      <div className={`${styles.card} ${styles.result}`}>
        <header className={styles.header}><span className={styles.title}>Structured output</span><span className={styles.muted}>JSON</span></header>
        <div className={styles.content}><pre>{'{\n'}{[['intent', 'reschedule'], ['day', 'Thursday'], ['language', 'en']].map(([key, value], index) => <span key={key} className={styles.outputLine} data-selected={field === key}>{'  '}<b>&quot;{key}&quot;</b>{`: "${value}"${index < 2 ? ',' : ''}\n`}</span>)}{'}'}</pre></div>
        <div className={styles.footer}><i/><span>Ready for your workflow</span></div>
      </div>
    </div>
  </div>;
}
