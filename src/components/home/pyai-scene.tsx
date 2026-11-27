import { useState, type RefObject } from 'react';
import { assetPath } from '@/lib/base-path';
import { serviceAgentExamples } from './application-examples';
import { callTime } from './use-scripted-call';
import styles from './pyai-scene.module.css';

const sample = serviceAgentExamples[1].lines[0];
const sampleDuration = 6.108;
// RMS amplitudes from the checked-in rescheduling clip.
const bars = [44, 74, 85, 56, 30, 23, 42, 69, 54, 78, 70, 55, 82, 53, 29, 71, 65, 39, 48, 60, 56, 66, 54, 61, 62, 39, 50, 55, 55, 42, 17, 12, 66, 42, 72, 81, 53, 46, 49, 34];
const output = [['intent', 'reschedule'], ['day', 'Friday'], ['language', 'en']];

export function PyAIScene({ field, audioRef }: { field: 'intent' | 'day' | 'language'; audioRef: RefObject<HTMLAudioElement | null> }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioError, setAudioError] = useState(false);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setAudioError(false);
    if (audio.error) audio.load();
    if (audio.ended) audio.currentTime = 0;
    void audio.play().catch((error: DOMException) => {
      if (error.name !== 'AbortError') setAudioError(true);
    });
  }

  return <div className={styles.system} data-pyai-system>
    <div className={styles.console} aria-hidden="true">
      <header><span className={styles.title}>Voice playground</span><span className={styles.status}>Speech to text</span></header>
      <div className={styles.consoleTabs}><span>Speech to text</span><span>Text to speech</span><span>Voice agents</span></div>
      <div className={styles.consoleRows}>{['Audio input', 'Transcription', 'Structured output', 'Request details'].map(label => <div key={label}><span>{label}</span><span>✓</span></div>)}</div>
      <footer><span>Mono · MP3</span><span>Transcription complete</span></footer>
    </div>
    <div className={styles.foreground}>
      <div className={`${styles.card} ${styles.input}`}>
        <header className={styles.header}><img src={assetPath('/assets/products/pyai-mark.svg')} width="24" height="24" alt="" /><span className={styles.title}>PyAI</span><span className={styles.muted}>Speech to text</span></header>
        <div className={styles.content}>
          <div className={styles.label}><span>Input audio</span><span className={styles.muted}>Mono · MP3</span></div>
          <audio ref={audioRef} src={sample.audio} preload="none" hidden
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
            onError={() => setAudioError(true)} onTimeUpdate={event => setElapsed(event.currentTarget.currentTime)} />
          <div className={styles.audio}>
            <button type="button" className={styles.play} onClick={togglePlayback} aria-label={playing ? 'Pause PyAI audio' : 'Play PyAI audio'}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d={playing ? 'M5 3.5h2v9H5zm4 0h2v9H9z' : 'M5 3.5 12 8l-7 4.5Z'} fill="currentColor" /></svg>
            </button>
            <div className={styles.wave} aria-hidden="true">{bars.map((height, index) => <i key={index} data-played={elapsed / sampleDuration > index / bars.length} style={{ height: `${height}%` }} />)}</div>
          </div>
          <div className={styles.time}><span>reschedule-1.mp3</span><span>{callTime(elapsed)} / {callTime(sampleDuration)}</span></div>
          {audioError && <p className={styles.audioError} role="status">Audio couldn’t play. Try again or read the transcript.</p>}
          <p className={styles.label}>Transcript</p>
          <p className={styles.transcript}>{sample.text}</p>
        </div>
        <div className={styles.footer}><i/><span>Transcription complete</span><span className={styles.muted}>English</span></div>
      </div>
      <div className={`${styles.card} ${styles.result}`}>
        <header className={styles.header}><span className={styles.title}>Structured output</span><span className={styles.muted}>JSON</span></header>
        <div className={styles.content}><pre>{'{\n'}{output.map(([key, value], index) => <span key={key} className={styles.outputLine} data-selected={field === key}>{'  '}<b>&quot;{key}&quot;</b>{`: "${value}"${index < output.length - 1 ? ',' : ''}\n`}</span>)}{'}'}</pre></div>
        <div className={styles.footer}><i/><span>Ready for your workflow</span></div>
      </div>
    </div>
  </div>;
}
