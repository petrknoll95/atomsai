'use client';

import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useRef } from 'react';
import type { CallLine, CallPlayback } from '@/lib/scripted-call-player';
import { justCallExamples } from './application-examples';
import { callTime } from './use-scripted-call';
import styles from './justcall-scene.module.css';

type JustCallDemo = {
  playback: CallPlayback;
  lines: CallLine[];
  status: string;
  handedOff: boolean;
  smsSent: boolean;
  onToggle: () => void;
  onReplay: () => void;
  onHandoff: () => void;
  onSms: () => void;
};

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 15v-3c4-4 10-4 14 0v3l-4-1v-2a10 10 0 0 0-6 0v2l-4 1Z" fill="currentColor" /></svg>;
}

function ChevronIcon({ direction = 'down' }: { direction?: 'down' | 'left' | 'right' }) {
  return <svg className={styles.chevron} data-direction={direction} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}

// Shared geometry: only the homepage supplies interactive demo controls.
export function JustCallScene({ compact = false, example, demo }: { compact?: boolean; example?: { caller: string; reply: string; followUp: string }; demo?: JustCallDemo } = {}) {
  const transcript = useRef<HTMLDivElement>(null);
  const lineIndex = demo?.playback.line;
  const callExample = justCallExamples[0];
  const previewLines: CallLine[] = example ? [
    { speaker: 'caller', text: example.caller },
    { speaker: 'agent', text: example.reply },
    { speaker: 'caller', text: example.followUp },
  ] : callExample.lines;
  const visibleLines = demo ? demo.lines.slice(0, Math.max(1, demo.playback.line + 1)) : previewLines;
  useEffect(() => {
    const element = transcript.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [lineIndex]);
  if (compact) return <div className={`${styles.system} ${styles.compact}`} data-justcall-system aria-hidden="true">
    <div className={styles.foreground}>
      <div className={styles.analytics}>
        <div className={styles.tabsWrapper}><div className={styles.tabs}><span>Inbound Calls</span></div></div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>AI Resolution Rate</div>
          <div className={styles.metricValue}><span className={styles.metric}>78%</span></div>
          <div className={styles.metricChange}><span><ArrowIcon direction="up" /> 18%</span></div>
        </div>
      </div>
      <div className={styles.conversation}>
        <div className={styles.intro}><p className={styles.title}>Talk to Steven Carter</p></div>
        <div className={styles.transcript}>
          <div><p className={styles.speaker}>You:</p><p>Can we schedule the installation?</p></div>
          <div><p className={styles.speaker}>Steven Carter:</p><p>Saturday at 9 AM works.</p></div>
        </div>
        <div className={styles.callBar}><span className={`${styles.avatar} ${styles.avatarPhoto}`} /><div><p className={styles.speaker}>Steven Carter</p><p className={styles.muted}>01:16</p></div><span className={styles.hangup}><PhoneIcon /></span></div>
      </div>
    </div>
  </div>;
  return <div className={`${styles.system} ${demo ? styles.interactive : ''}`} data-justcall-system data-justcall-demo={demo ? '' : undefined} aria-hidden={demo ? undefined : true}>
    <div className={styles.dashboard} aria-hidden="true">
      <div className={styles.dashboardHeader}><span className={styles.title}>AI Voice Agent</span><span className={styles.live}><i /><span className={styles.dashboardLabel}>Live Calls</span></span></div>
      <div className={styles.dashboardTools}>
        <div className={styles.dashboardNav}><span><span className={styles.dashboardLabel}>Agents</span><span className={styles.agentCount}><span className={styles.dashboardLabel}>4</span></span></span><span className={styles.dashboardLabel}>Call history</span></div>
        <span className={styles.search}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m14.5 14.5 5.5 5.5" /></svg><span className={styles.dashboardLabel}>Search agents</span></span>
        <span className={styles.filter}><span className={styles.dashboardLabel}>All statuses</span><ChevronIcon /></span>
      </div>
      <div className={styles.tableHeading}><span className={styles.checkbox} /><span>Agent</span><span>Status</span><span>Calls</span><span>Language</span></div>
      {['Steven Carter', 'Olivia Bennett', 'Sophia Reed', 'Ethan Brooks'].map((name, index) => <div className={styles.agentRow} key={name}>
        <span className={styles.checkbox} /><div className={styles.agentIdentity}><span className={styles.agentAvatar}><span className={styles.dashboardLabel}>{name.split(' ').map(part => part[0]).join('')}</span></span><div><p>{name}</p><p className={styles.muted}>#agent_{['480724', '926148', '359883', '074312'][index]}…</p></div></div><span className={styles.agentStatus}><i /><span className={styles.dashboardLabel}>{index === 0 ? 'In a call' : 'Available'}</span></span><span>{[24, 18, 32, 16][index]}</span><span>English</span>
      </div>)}
      <div className={styles.dashboardFooter}><div><p>4 agents connected</p><p>Last synced just now</p></div><span className={styles.pagination}><ChevronIcon direction="left" /><span><span className={styles.dashboardLabel}>1</span></span><ChevronIcon direction="right" /></span></div>
    </div>

    <div className={styles.foreground}>
      <div className={styles.analytics} aria-hidden="true">
        <div className={styles.tabsWrapper}><div className={styles.tabs}><span>Inbound Calls</span><span>Outbound Calls</span></div></div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>AI Resolution Rate</div>
          <div className={styles.metricValue}><span className={styles.metric}>78%</span><span className={styles.muted}>(90 calls)</span></div>
          <div className={styles.metricChange}><span><ArrowIcon direction="up" /> 18%</span><span className={styles.muted}>vs last month</span></div>
        </div>
      </div>
  
      <div className={styles.conversation}>
        <div className={styles.intro}><p className={styles.title}>Talk to Steven Carter</p><p>Receive a call on your phone or talk via web</p></div>
        <div className={styles.callTabs}>{demo ? <>
          <button type="button" onClick={demo.onHandoff} disabled={demo.handedOff || demo.playback.phase === 'idle' || demo.playback.phase === 'complete'}>{demo.handedOff ? 'Handed off' : 'Hand to human'}</button>
          <button type="button" onClick={demo.onSms} disabled={demo.playback.phase !== 'complete' || demo.handedOff || demo.smsSent}>{demo.smsSent ? 'SMS sent' : 'Send SMS'}</button>
        </> : <><span>Hand to human</span><span>Send SMS</span></>}</div>
        <div ref={transcript} className={`${styles.transcript} ${demo ? styles.demoTranscript : ''}`} role={demo ? 'log' : undefined} aria-label={demo ? 'JustCall conversation' : undefined} aria-live="polite" tabIndex={demo ? 0 : undefined}>
          {visibleLines.map((line, index) => <div key={`${index}-${line.text}`}><p className={styles.speaker}>{line.speaker === 'caller' ? 'You' : line.speaker === 'human' ? 'Maya' : 'Steven Carter'}:</p><p>{line.text}</p></div>)}
        </div>
        <div className={styles.callBar}><span className={`${styles.avatar} ${styles.avatarPhoto}`} /><div className={styles.callInfo}><p className={styles.speaker}>{demo?.handedOff ? 'Maya' : 'Steven Carter'}</p><p className={styles.muted}>{demo ? callTime(demo.playback.elapsed) : 'Call complete'}</p></div>{demo ? <>
          <button type="button" data-justcall-play className={`${styles.hangup} ${styles.play}`} onClick={demo.onToggle} aria-label={demo.playback.phase === 'playing' ? 'Pause JustCall conversation' : demo.playback.phase === 'paused' ? 'Resume JustCall conversation' : 'Play JustCall conversation'}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{demo.playback.phase === 'playing' ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="m8 5 11 7-11 7z" />}</svg></button>
          <button type="button" className={styles.replay} onClick={demo.onReplay} aria-label="Replay JustCall conversation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg></button>
        </> : <span className={`${styles.hangup} ${styles.play}`}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg></span>}</div>
        <p className={styles.demoStatus} role={demo ? 'status' : undefined}>{demo ? demo.playback.phase === 'idle' ? 'Ready to call' : demo.playback.phase === 'paused' ? 'Paused' : demo.status : callExample.outcome}</p>
      </div>
    </div>
  </div>;
}
