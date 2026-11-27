import styles from './serviceagent-scene.module.css';
import type { ReactNode } from 'react';
import { ArrowIcon } from '@/components/arrow-icon';
import { assetPath } from '@/lib/base-path';
import { idleCall, type CallPlayback } from '@/lib/scripted-call-player';
import { serviceAgentExamples } from './application-examples';

type ServiceAgentExample = (typeof serviceAgentExamples)[number];

export function ServiceAgentScene() {
  return <ServiceAgentDemo example={serviceAgentExamples[0]} playback={{ ...idleCall, phase: 'complete' }} />;
}

export function ServiceAgentDemo({ example, playback, controls }: { example: ServiceAgentExample; playback: CallPlayback; controls?: ReactNode }) {
  const preview = controls == null;
  const speaking = playback.phase === 'playing';
  const complete = playback.phase === 'complete';
  const reachedCue = ([line, seconds]: readonly [number, number]) => complete || playback.line > line
    || (playback.line === line && playback.lineElapsed >= seconds);
  const confirmed = reachedCue(example.outcomeCue);
  const currentLine = example.lines[playback.line];
  const speaker = currentLine?.speaker === 'caller' ? 'Caller' : 'ServiceAgent';
  const callStatus = {
    idle: 'Recorded call',
    playing: `${speaker} speaking`,
    paused: 'Paused',
    complete: example.outcome,
    error: 'Audio couldn’t play. Try again or read the transcript.',
  }[playback.phase];
  const result = example.steps[example.steps.length - 1];

  return <div className={`${styles.system} ${styles.demo}`} data-serviceagent-system data-preview={preview || undefined} aria-hidden={preview || undefined}>
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Incoming call</span>
      </div>
      <div className={styles.content}>
        <blockquote className={styles.request}>“{example.request}”</blockquote>
        {preview ? <div className={`${styles.callPlayer} ${styles.previewPlayer}`}>
          <span className={styles.previewPlay}><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg></span>
          <span>Recorded call</span>
        </div> : <><div className={styles.callPlayer}>
          <div className={styles.player}>{controls}</div>
          <p className={styles.callStatus} role="status" data-speaking={speaking}>{callStatus}</p>
        </div>
        <details className={styles.transcript} key={example.label}>
          <summary>Call transcript <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></summary>
          <ol>{example.lines.map((line, index) => <li key={index} aria-current={playback.line === index ? 'true' : undefined}>
            <span>{line.speaker === 'caller' ? 'Caller' : 'ServiceAgent'}</span>
            <p>{line.text}</p>
          </li>)}</ol>
        </details></>}
      </div>
    </div>
    <div className={`${styles.card} ${styles.record}`} data-resolved={confirmed}>
      <span className={styles.connector} aria-hidden="true"><ArrowIcon size={20} /></span>
      <div className={styles.header}>
        <span className={styles.mark} style={{ maskImage: `url('${assetPath('/assets/products/serviceagent-mark.svg')}')` }} aria-hidden="true" />
        <span className={styles.title}>Call outcome</span>
        <span className={styles.resultMark} aria-hidden="true"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d={confirmed ? 'm4.5 10 3.5 3.5 7.5-7.5' : 'M6 10h.1m3.9 0h.1m3.9 0h.1'} /></svg></span>
      </div>
      <div className={styles.content}>
        <p className={styles.resultTitle}>{confirmed ? result.title : playback.phase === 'idle' ? 'Awaiting call' : 'Awaiting confirmation'}</p>
        <dl className={styles.fields}>{example.recordFields.map(({ label, value, cue }) => {
          const revealed = reachedCue(cue);
          return <div key={label}>
            <dt>{label}</dt>
            <dd data-revealed={revealed}>
              <span className={styles.fieldText} aria-hidden={revealed ? undefined : true}>{value}</span>
              {!revealed && <span className={styles.pendingValue}>—</span>}
            </dd>
          </div>;
        })}</dl>
      </div>
    </div>
  </div>;
}
