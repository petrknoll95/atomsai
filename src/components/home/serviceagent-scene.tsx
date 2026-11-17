import styles from './serviceagent-scene.module.css';
import type { ReactNode } from 'react';
import type { CallLine, CallPlayback } from '@/lib/scripted-call-player';

function RouteIcon({ type }: { type: 'route' | 'edit' | 'delete' }) {
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'route' ? <><circle cx="5" cy="5" r="2" /><path d="M7 5h10a4 4 0 0 1 0 8H7a3 3 0 0 0 0 6h13m-4-4 4 4-4 4" /></> : type === 'edit' ? <path d="m15 4 5 5M4 20l1-5L16 4a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3L9 19z" /> : <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />}
  </svg>;
}

const routes = [
  { number: '01', scenario: 'If the caller wants to book a visit; if they need to reschedule an appointment', phone: '(212) 555-0101' },
  { number: '02', scenario: 'If the caller asks about pricing; if the caller is concerned about savings', phone: '(212) 555-0102' },
  { number: '03', scenario: 'If the caller needs urgent help; if they want to speak with a specialist', phone: '(212) 555-0103' },
];

export function ServiceAgentScene({ compact = false, responsive = false, example, playback, controls }: { compact?: boolean; responsive?: boolean; example?: { request: string; steps: { title: string; detail: string }[]; lines?: CallLine[]; outcome?: string }; playback?: CallPlayback; controls?: ReactNode } = {}) {
  const step = playback && !['idle', 'error'].includes(playback.phase) ? [0, 1, 1, 2][playback.line] : -1;
  return <div className={`${styles.system} ${compact ? styles.compact : ''} ${responsive ? styles.responsive : ''}`} data-serviceagent-system aria-hidden={playback ? undefined : true}>
    {routes.slice(0, compact ? 2 : routes.length).map((route, index) => <div className={styles.card} key={route.number} data-current={step === index} aria-current={step === index ? 'step' : undefined}>
      <div className={styles.header}><RouteIcon type="route" /><span className={styles.title}>{example ? `Step ${route.number}` : `Call Route – ${route.number}`}</span><div className={`${styles.actions} ${controls && index === 0 ? styles.player : ''}`}>{controls && index === 0 ? controls : <><RouteIcon type="edit" /><RouteIcon type="delete" /></>}</div></div>
      <div className={styles.content}>
        <span className={styles.label}>{example ? 'Customer request' : 'Trigger scenarios'}</span><p>{example?.request ?? (compact ? (route.number === '01' ? 'Book or reschedule a visit' : 'Ask about pricing') : route.scenario)}</p>
        <span className={styles.label}>{example?.steps[index].title ?? 'Route to'}</span><p>{example?.steps[index].detail ?? route.phone}</p>
      </div>
    </div>)}
    {playback && example?.lines && <div className={styles.callFoot}>
      <details className={styles.transcript} key={example.request}><summary>Read transcript</summary><ol>{example.lines.map((line, index) => <li key={index} aria-current={playback.line === index ? 'true' : undefined}><span>{line.speaker === 'caller' ? 'Caller' : 'ServiceAgent'}</span><p>{line.text}</p></li>)}</ol></details>
      <p className={styles.status} role="status">{playback.phase === 'complete' ? example.outcome : playback.phase === 'paused' ? 'Paused' : playback.phase === 'playing' ? `${example.lines[playback.line]?.speaker === 'caller' ? 'Caller' : 'Agent'} speaking` : ''}</p>
    </div>}
  </div>;
}
