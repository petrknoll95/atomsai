'use client';

import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useRef, useState } from 'react';
import voiceAudio from '@/components/home/voice-audio.json';
import styles from './voice.module.css';

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function VoiceSample() {
  const audio = useRef<HTMLAudioElement>(null);
  const sample = useRef<HTMLDivElement>(null);
  const wantsPlayback = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(false);
  const pause = () => { wantsPlayback.current = false; audio.current?.pause(); setPlaying(false); };
  useEffect(() => {
    const player = audio.current;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) { wantsPlayback.current = false; player?.pause(); setPlaying(false); } });
    if (sample.current) observer.observe(sample.current);
    const onHidden = () => { if (document.hidden) { wantsPlayback.current = false; player?.pause(); setPlaying(false); } };
    document.addEventListener('visibilitychange', onHidden);
    return () => { wantsPlayback.current = false; player?.pause(); observer.disconnect(); document.removeEventListener('visibilitychange', onHidden); };
  }, []);
  const toggle = async () => {
    const player = audio.current;
    if (!player) return;
    if (wantsPlayback.current) { pause(); return; }
    if (player.ended) { player.currentTime = 0; setElapsed(0); }
    wantsPlayback.current = true;
    setError(false);
    try { await player.play(); if (wantsPlayback.current) setPlaying(true); else player.pause(); }
    catch { if (wantsPlayback.current) { pause(); setError(true); } }
  };
  return <div ref={sample} id="listen" className={styles.sampleWrap}>
    <div className={styles.sample}>
      <div className={styles.player} data-theme="dark">
        <div className={styles.playerTop}><span>One enquiry. A viewing arranged.</span><span>28 seconds</span></div>
        <div className={styles.soundArtwork} aria-hidden="true">
          <span className={styles.soundOrbit} /><span className={styles.soundOrbit} /><span className={styles.soundOrbit} />
          <div className={styles.soundWave}>{voiceAudio.speakers[0].heights.map((height, i) => <span key={i} style={{ height: `${Math.max(height, voiceAudio.speakers[1].heights[i]) * 2 + 8}px`, opacity: i / voiceAudio.speakers[0].heights.length < elapsed / voiceAudio.duration ? 1 : .36 }} />)}</div>
          <span className={`display ${styles.hello}`}>Hello.</span>
        </div>
        <audio ref={audio} src={voiceAudio.src} preload="none" onTimeUpdate={() => setElapsed(audio.current?.currentTime ?? 0)} onEnded={() => { wantsPlayback.current = false; setPlaying(false); }} onError={() => { pause(); setError(true); }} />
        <div className={styles.playerControls}>
          <button onClick={toggle} type="button" className={styles.playButton} aria-label={playing ? 'Pause voice sample' : 'Play voice sample'} aria-pressed={playing}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">{playing ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="m8 5 11 7-11 7z" />}</svg></button>
          <div className={styles.playerProgress}><label htmlFor="voice-progress" className="sr-only">Audio position</label><input id="voice-progress" type="range" min="0" max={voiceAudio.duration} step="0.1" value={elapsed} aria-valuetext={`${clock(elapsed)} of 0:28`} onChange={event => { const time = Number(event.target.value); if (audio.current) audio.current.currentTime = time; setElapsed(time); }} /><div><span>{playing ? 'Playing sample' : elapsed > 0 ? 'Resume sample' : 'Listen to the conversation'}</span><span>{clock(elapsed)} / 0:28</span></div></div>
        </div>
        {error && <p className={styles.audioError} role="status">Audio could not play. Try again or read the transcript below.</p>}
      </div>
      <div className={styles.conversation}>
        <div className={styles.conversationTop}><span className={styles.sectionLabel}>A property enquiry</span><span className={styles.sampleLabel}>Scripted sample</span></div>
        <div className={styles.quote}><span>Caller</span><p className="display">“Is the two-bedroom<br className={styles.desktopBreak} /> still available?”</p></div>
        <div className={`${styles.quote} ${styles.agentQuote}`}><span>Voice agent</span><p className="display">“What sort of budget<br className={styles.desktopBreak} /> did you have in mind?”</p></div>
        <div className={styles.callOutcome}><span className={styles.outcomeIcon} aria-hidden="true"><ArrowIcon direction="up-right" /></span><div><p>From enquiry to next step</p><span>Preferences understood. A viewing agreed.</span></div></div>
      </div>
    </div>
    <div className={styles.sampleFoot}><p>Illustrative audio. No call is placed and no viewing is booked.</p><details className={styles.transcript}><summary>Read the transcript <span aria-hidden="true">+</span></summary><ol>{voiceAudio.turns.map((turn, i) => <li key={i}><span>{turn.speaker === 0 ? 'Caller' : 'Voice agent'}</span><p>{turn.text}</p></li>)}</ol></details></div>
  </div>;
}

const journeys = [
  { label: 'A viewing', category: 'Real estate', opener: '“Is it still available?”', title: 'Turn a listing enquiry into a viewing.', description: 'Understand the caller’s budget, preferred area, and timing. Use current listing information to help them explore the right options.', steps: [['Understand', 'Capture budget and preferences'], ['Connect', 'Check listing and calendar availability'], ['Act', 'Confirm a viewing and update the CRM']], result: 'A viewing your team can prepare for.', note: 'Listing inventory · CRM · Viewing calendar' },
  { label: 'A callback', category: 'Lending', opener: '“What do I need to apply?”', title: 'Give an enquiry a clear next step.', description: 'Answer product and document questions, understand the borrowing need, and organise a specialist callback. Lending decisions stay with your team.', steps: [['Understand', 'Capture the stated borrowing need'], ['Connect', 'Use approved product information'], ['Act', 'Arrange a loan-officer callback']], result: 'A useful brief for the right specialist.', note: 'Product knowledge · CRM · Callback scheduling' },
  { label: 'A demo', category: 'B2B software', opener: '“Would this work for our team?”', title: 'Give the first meeting a head start.', description: 'Learn about the buyer’s use case, team, and existing tools. Answer product questions and arrange a demo with the appropriate team.', steps: [['Understand', 'Learn the use case and team needs'], ['Connect', 'Check product fit and team availability'], ['Act', 'Create a CRM brief and book a demo']], result: 'A discovery conversation that starts ahead.', note: 'Product knowledge · CRM · Team calendar' },
];

export function VoiceJourneys() {
  const [selected, setSelected] = useState(0);
  const journey = journeys[selected];
  return <div className={styles.journeyExplorer}>
    <div className={styles.journeyTabs} role="tablist" aria-label="Explore a voice workflow">{journeys.map((item, i) => <button key={item.label} type="button" role="tab" id={`journey-tab-${i}`} aria-selected={selected === i} aria-controls={`journey-panel-${i}`} tabIndex={selected === i ? 0 : -1} onClick={() => setSelected(i)} onKeyDown={event => { let next = i; if (event.key === 'ArrowRight') next = (i + 1) % journeys.length; else if (event.key === 'ArrowLeft') next = (i + journeys.length - 1) % journeys.length; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = journeys.length - 1; else return; event.preventDefault(); setSelected(next); document.getElementById(`journey-tab-${next}`)?.focus(); }}>{item.label}<span aria-hidden="true"><ArrowIcon direction="up-right" /></span></button>)}</div>
    <div role="tabpanel" id={`journey-panel-${selected}`} aria-labelledby={`journey-tab-${selected}`} tabIndex={0} className={styles.journeyPanel}>
      <div className={styles.journeyStory}><span className={styles.sectionLabel}>{journey.category}</span><p className={`display ${styles.journeyOpener}`}>{journey.opener}</p><h3 className="display">{journey.title}</h3><p>{journey.description}</p></div>
      <div className={styles.journeyFlow}><p className={styles.flowLabel}>What happens next</p><ol>{journey.steps.map(([title, text], i) => <li key={title}><span className={styles.flowIndex}>0{i + 1}</span><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol><div className={styles.journeyResult}><span aria-hidden="true"><ArrowIcon direction="up-right" /></span><p className="display">{journey.result}</p></div><p className={styles.connections}>{journey.note}</p></div>
    </div>
    <p className={styles.illustrative}>Illustrative workflows. Connections, permissions, and handoff rules are agreed during your build.</p>
  </div>;
}
