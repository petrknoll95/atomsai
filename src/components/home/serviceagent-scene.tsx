import styles from './serviceagent-scene.module.css';
import type { ReactNode } from 'react';
import type { CallPlayback } from '@/lib/scripted-call-player';
import { serviceAgentExamples } from './application-examples';

function RouteIcon() {
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5" cy="5" r="2" /><path d="M7 5h10a4 4 0 0 1 0 8H7a3 3 0 0 0 0 6h13m-4-4 4 4-4 4" />
  </svg>;
}

type ServiceAgentSceneProps = {
  compact?: boolean;
  responsive?: boolean;
  example?: (typeof serviceAgentExamples)[number];
  playback?: CallPlayback;
  controls?: ReactNode;
};

export function ServiceAgentScene({ compact = false, responsive = false, example = serviceAgentExamples[0], playback, controls }: ServiceAgentSceneProps = {}) {
  const current = playback && !['idle', 'error'].includes(playback.phase) ? [0, 1, 1, 2][playback.line] : -1;
  const last = example.steps.length - 1;
  const cards = compact ? [0, last] : example.steps.map((_, index) => index);
  return <div className={`${styles.system} ${compact ? styles.compact : ''} ${responsive ? styles.responsive : ''}`} data-serviceagent-system aria-hidden={playback ? undefined : true}>
    {cards.map(index => {
      const step = example.steps[index];
      const isOutcome = index === last;
      return <div className={styles.card} key={step.title} data-outcome={isOutcome || undefined} data-current={current === index} aria-current={current === index ? 'step' : undefined}>
        <div className={styles.header}>
          <RouteIcon />
          <span className={styles.title}>{index === 0 ? 'Incoming call' : isOutcome ? 'Call outcome' : 'Agent action'}</span>
          {controls && index === 0 && <div className={`${styles.actions} ${styles.player}`}>{controls}</div>}
        </div>
        <div className={styles.content}>
          {index === 0 && <><span className={styles.label}>Customer request</span><p>{example.request}</p></>}
          <span className={styles.label}>{step.title}</span><p>{step.detail}</p>
        </div>
      </div>;
    })}
    {playback && <div className={styles.callFoot}>
      <details className={styles.transcript} key={example.request}><summary>Read transcript</summary><ol>{example.lines.map((line, index) => <li key={index} aria-current={playback.line === index ? 'true' : undefined}><span>{line.speaker === 'caller' ? 'Caller' : 'ServiceAgent'}</span><p>{line.text}</p></li>)}</ol></details>
      <p className={styles.status} role="status">{playback.phase === 'complete' ? example.outcome : playback.phase === 'paused' ? 'Paused' : playback.phase === 'playing' ? `${example.lines[playback.line]?.speaker === 'caller' ? 'Caller' : 'Agent'} speaking` : ''}</p>
    </div>}
  </div>;
}
