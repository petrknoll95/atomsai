import styles from './callpage-scene.module.css';

function ContactIcon({ type }: { type: 'phone' | 'clock' | 'message' | 'video' }) {
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'phone' ? <path d="M5 3H3c0 10 8 18 18 18v-5l-5-1-2 2a16 16 0 0 1-7-7l2-2-1-5z" /> : type === 'clock' ? <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></> : type === 'message' ? <><path d="M4 3h16v14H10l-6 4z" /><path d="M8 8h8M8 12h6" /></> : <><rect x="3" y="5" width="12" height="14" rx="2" /><path d="m15 9 6-3v12l-6-3" /></>}
  </svg>;
}

function CallScreenIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    Speaker: 'M3 9h4l5-4v14l-5-4H3z M16 8a6 6 0 0 1 0 8 M19 5a10 10 0 0 1 0 14',
    FaceTime: 'M3 6h12v12H3z M15 10l6-3v10l-6-3',
    Mute: 'M9 9V5a3 3 0 0 1 6 0v6 M5 10v2a7 7 0 0 0 12 5 M12 19v3 M8 22h8 M3 3l18 18',
    Add: 'M15 21v-3a6 6 0 0 0-12 0v3 M17 9h6 M20 6v6',
    End: 'M3 14v-3a16 16 0 0 1 18 0v3l-5-1v-2a12 12 0 0 0-8 0v2z',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'Keypad' ? [6, 12, 18].flatMap(y => [6, 12, 18].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />)) : <path d={paths[kind]} />}
    {kind === 'Add' && <circle cx="9" cy="6" r="3" />}
  </svg>;
}

function PhoneBackdrop() {
  return <div className={styles.device}>
    <div className={styles.screenEdge} />
    <span className={styles.sideButton} /><span className={styles.volumeButtons} />
    <div className={styles.notch} />
    <div className={styles.caller}><span>calling mobile…</span><p>Steven Carter</p></div>
    <div className={styles.callControls}>{['Speaker', 'FaceTime', 'Mute', 'Add', 'End', 'Keypad'].map(label => <div key={label}><span><CallScreenIcon kind={label} /></span><p>{label}</p></div>)}</div>
    <div className={styles.homeIndicator} />
  </div>;
}

export function CallPageScene({ compact = false }: { compact?: boolean } = {}) {
  return <div className={compact ? styles.compactStage : styles.stage} aria-hidden="true">
    {!compact && <PhoneBackdrop />}
    <div className={`${styles.system} ${compact ? styles.compact : ''}`} data-callpage-system>
    <div className={styles.tabs}>
      {([
        ['phone', 'Call me now'], ['clock', 'Call me later'], ['message', 'Leave a message'], ['video', 'Schedule a meeting'],
      ] as const).slice(0, compact ? 2 : 4).map(([icon, label], index) => <div className={styles.tab} data-active={index === 0} key={icon}><ContactIcon type={icon} /><span>{label}</span></div>)}
    </div>
    <div className={styles.content}>
      <p className={styles.heading}>{compact ? 'Get a callback in seconds.' : 'Would you like to receive a free callback in 3 seconds and check how CallPage works?'}</p>
      <div className={styles.form}>
        <div className={styles.phoneField}><span className={styles.country}>🇺🇸<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6" /></svg></span><span>415 684 7475</span></div>
        <div className={styles.callButton}>Call me now</div>
      </div>
      {!compact && <p className={styles.caption}>You are already the 12th person who has ordered a call</p>}
    </div>
    </div>
  </div>;
}
