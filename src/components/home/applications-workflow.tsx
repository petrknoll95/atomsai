'use client';

import { assetPath } from '@/lib/base-path';

import { justCallExamples, serviceAgentExamples, pyaiFields } from './application-examples';
import { PyAIScene } from './pyai-scene';
import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useRef, useState } from 'react';
import { ButtonLink, Eyebrow } from '../ui';
import { JustCallScene, ServiceAgentScene } from './application-scenes';
import styles from './applications-workflow.module.css';
import { useApplicationReveal } from './use-application-reveal';
import { callTime, useScriptedCall } from './use-scripted-call';
import { recordedCallVoice } from '@/lib/recorded-call-voice';
import type { CallLine } from '@/lib/scripted-call-player';

const applications = [
  { name: 'JustCall', mark: 'justcall-mark.svg', title: 'Go off script. See what follows.', description: 'Interrupt it, switch languages, or ask for details by text. Plus, the conversation stays in sync with the tools your team already uses.', action: 'Have the agent call me', href: '/company/contact', secondaryAction: 'Explore JustCall', secondaryHref: 'https://justcall.io/' },
  { name: 'ServiceAgent', mark: 'serviceagent-mark.svg', title: 'Listen in on a busy front desk', description: 'An emergency repair. A last-minute reschedule. A billing question. Pick a call and follow what ServiceAgent does next, from the conversation to the work that follows.', action: 'Explore ServiceAgent', href: 'https://serviceagent.ai/', secondaryAction: null, secondaryHref: null },
  { name: 'PyAI', mark: 'pyai-mark.svg', title: 'Get under the hood of our voice stack', description: 'Test PyAI on phone-quality audio, inspect the output, and take the APIs into your own build.', action: 'Open the Playground', href: 'https://pyai.com/playground', secondaryAction: 'Explore the APIs', secondaryHref: 'https://docs.pyai.com/api-reference' },
];

export function ApplicationsWorkflow() {
  const root = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState([0, 0, 0]);
  const justCall = useScriptedCall();
  const serviceCall = useScriptedCall();
  const serviceAudio = useRef<HTMLAudioElement>(null);
  const [handoff, setHandoff] = useState<CallLine[] | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const callExample = justCallExamples[selected[0]];
  const serviceExample = serviceAgentExamples[selected[1]];
  const callLines = handoff ?? callExample.lines;
  const startJustCall = (index = selected[0]) => {
    setHandoff(null);
    setSmsSent(false);
    justCall.player.start(justCallExamples[index].lines);
  };
  const startServiceCall = (index = selected[1]) => {
    if (serviceAudio.current) serviceCall.player.start(serviceAgentExamples[index].lines, recordedCallVoice(serviceAudio.current));
  };
  const selectApplication = (index: number) => {
    if (index === active) return;
    justCall.player.pause();
    serviceCall.player.pause();
    setActive(index);
  };
  const selectExample = (index: number) => {
    setSelected(previous => previous.map((value, product) => product === active ? index : value));
    if (active === 0) startJustCall(index);
    if (active === 1) startServiceCall(index);
  };
  const toggleServiceCall = () => {
    if (serviceCall.playback.phase === 'playing') serviceCall.player.pause();
    else if (serviceCall.playback.phase === 'paused') serviceCall.player.resume();
    else startServiceCall();
  };
  const examples = [justCallExamples, serviceAgentExamples, pyaiFields];
  useApplicationReveal(root, active, [0, 2, 4][active]);
  useEffect(() => {
    const frame = root.current?.querySelector<HTMLElement>('[data-application-frame]');
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      frame.style.setProperty('--scene-font-size', `${Math.min(14, width * .018, height * .018)}px`);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const pause = () => { justCall.player.pause(); serviceCall.player.pause(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); });
    observer.observe(element);
    const onHidden = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onHidden); };
  }, [justCall.player, serviceCall.player]);

  return <section ref={root} id="applications" className={`page-container ${styles.section}`} aria-labelledby="applications-title" data-application-workflow>
    <audio ref={serviceAudio} preload="none" hidden />
    <h2 id="applications-title" className={`display ${styles.sectionHeading}`}>Now it’s your turn</h2>
    <p className={styles.sectionLead}>A live sales call to challenge. A busy front desk to listen in on. A voice stack to test for yourself.</p>
    <div className={`theme-dark ${styles.panel}`} data-theme="dark">
      <div className={styles.copy}>
        <Eyebrow className={styles.eyebrow} href="#applications">Experience AtomsAI</Eyebrow>
        <div className={styles.accordion}>
          {applications.map((application, index) => <div className={styles.item} data-active={active === index} key={application.name}>
            <h3><button ref={element => { buttons.current[index] = element; }} className={styles.trigger} id={`application-trigger-${index}`} aria-expanded={active === index} aria-controls={`application-detail-${index}`} onClick={() => selectApplication(index)} onKeyDown={event => {
              const next = event.key === 'ArrowDown' ? (index + 1) % applications.length : event.key === 'ArrowUp' ? (index + applications.length - 1) % applications.length : event.key === 'Home' ? 0 : event.key === 'End' ? applications.length - 1 : null;
              if (next !== null) { event.preventDefault(); buttons.current[next]?.focus(); }
            }}>{application.name === 'PyAI' ? <svg className={styles.productLogo} viewBox="8 8 48 48" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="3.5"/><circle cx="32" cy="32" r="13" fill="currentColor"/></svg> : <span className={styles.productLogo} aria-hidden="true" style={{ maskImage: assetPath(`url(/assets/products/${application.mark})`) }} />}<span className={`display ${styles.name}`}>{application.name}</span></button></h3>
            <div className={styles.detail} id={`application-detail-${index}`} role="region" aria-labelledby={`application-trigger-${index}`} aria-hidden={active !== index} inert={active !== index}>
              <div><div className={styles.detailCopy}><h4 className={`display ${styles.productTitle}`}>{application.title}</h4><p>{application.description}</p>
                {index === 0 ? <button type="button" className="button button-small button-ghost" onClick={() => { startJustCall(); root.current?.querySelector<HTMLButtonElement>('[data-justcall-play]')?.focus({ preventScroll: true }); }}>{application.action}<span aria-hidden="true"><ArrowIcon direction="right" /></span></button> : <ButtonLink size="small" variant="ghost" href={application.href} target={application.href.startsWith('https:') ? '_blank' : undefined} rel={application.href.startsWith('https:') ? 'noopener noreferrer' : undefined}>{application.action}<span aria-hidden="true"><ArrowIcon direction="right" /></span></ButtonLink>}
                {application.secondaryHref && <ButtonLink size="small" variant="ghost" href={application.secondaryHref} target="_blank" rel="noopener noreferrer">{application.secondaryAction}<span aria-hidden="true"><ArrowIcon direction="right" /></span></ButtonLink>}
              </div></div>
            </div>
          </div>)}
        </div>
      </div>
      <div className={styles.visual}>
        <div className={styles.exampleControls}>
          <div className={styles.choices} role="group" aria-label={`${applications[active].name} examples`}>{examples[active].map((example, exampleIndex) => <button type="button" key={example.label} aria-pressed={selected[active] === exampleIndex} onClick={() => selectExample(exampleIndex)}>{example.label}</button>)}</div>
        </div>
        <div className={styles.scenes} data-application-frame>
          {applications.map(({ name }, index) => <div key={name} className={styles.scene} data-application-scene={index} data-active={active === index} aria-hidden={active !== index} inert={active !== index}><div className={styles.justCallComposition}>{index === 0 ? <JustCallScene demo={{
            playback: justCall.playback,
            lines: callLines,
            status: smsSent ? `Text sent: ${callExample.sms}` : handoff ? (justCall.playback.phase === 'complete' ? 'Transferred · Context kept' : 'Connecting to Maya…') : justCall.playback.phase === 'complete' ? callExample.outcome : callExample.states[Math.max(0, justCall.playback.line)],
            handedOff: !!handoff,
            smsSent,
            onToggle: () => { if (justCall.playback.phase === 'playing') justCall.player.pause(); else if (justCall.playback.phase === 'paused') justCall.player.resume(); else startJustCall(); },
            onReplay: () => startJustCall(),
            onHandoff: () => {
              const previous = callLines.slice(0, Math.max(0, justCall.playback.line + 1));
              const next: CallLine[] = [...previous, { speaker: 'agent', text: 'Connecting you to a teammate now.' }, { speaker: 'human', text: 'Hi, this is Maya. I’ve got the full context.' }];
              setHandoff(next);
              justCall.player.start(next, undefined, previous.length);
            },
            onSms: () => setSmsSent(true),
          }} /> : index === 1 ? <>
            <ServiceAgentScene responsive example={serviceExample} playback={serviceCall.playback} controls={<>
              <button type="button" onClick={toggleServiceCall} aria-label={`${serviceCall.playback.phase === 'playing' ? 'Pause' : serviceCall.playback.phase === 'paused' ? 'Resume' : 'Play'} ${serviceExample.label.toLowerCase()} call`}><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">{serviceCall.playback.phase === 'playing' ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="m8 5 11 7-11 7z" />}</svg></button>
              <span>{callTime(serviceCall.playback.elapsed)}</span>
              <button type="button" aria-label="Replay ServiceAgent call" onClick={() => startServiceCall()}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg></button>
            </>} />
            {serviceCall.playback.phase === 'error' && <p className={styles.audioError} role="status">Audio couldn’t play. Try again or read the transcript.</p>}
          </> : <PyAIScene field={pyaiFields[selected[2]].field} />}</div></div>)}
        </div>
      </div>
    </div>
  </section>;
}
