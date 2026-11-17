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


  return <section ref={root} id="applications" className={`page-container ${styles.section}`} aria-labelledby="applications-title" data-application-workflow>
    <h2 id="applications-title" className={`display ${styles.sectionHeading}`}>Now it’s your turn</h2>
    <p className={styles.sectionLead}>A live sales call to challenge. A busy front desk to listen in on. A voice stack to test for yourself.</p>
    <div className={`theme-dark ${styles.panel}`} data-theme="dark">
      <div className={styles.copy}>
        <Eyebrow className={styles.eyebrow} href="#applications">Experience AtomsAI</Eyebrow>
        <div className={styles.accordion}>
          {applications.map((application, index) => <div className={styles.item} data-active={active === index} key={application.name}>
            <h3><button ref={element => { buttons.current[index] = element; }} className={styles.trigger} id={`application-trigger-${index}`} aria-expanded={active === index} aria-controls={`application-detail-${index}`} onClick={() => setActive(index)} onKeyDown={event => {
              const next = event.key === 'ArrowDown' ? (index + 1) % applications.length : event.key === 'ArrowUp' ? (index + applications.length - 1) % applications.length : event.key === 'Home' ? 0 : event.key === 'End' ? applications.length - 1 : null;
              if (next !== null) { event.preventDefault(); buttons.current[next]?.focus(); }
            }}>{application.name === 'PyAI' ? <svg className={styles.productLogo} viewBox="8 8 48 48" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="3.5"/><circle cx="32" cy="32" r="13" fill="currentColor"/></svg> : <span className={styles.productLogo} aria-hidden="true" style={{ maskImage: assetPath(`url(/assets/products/${application.mark})`) }} />}<span className={`display ${styles.name}`}>{application.name}</span></button></h3>
            <div className={styles.detail} id={`application-detail-${index}`} role="region" aria-labelledby={`application-trigger-${index}`} aria-hidden={active !== index} inert={active !== index}>
              <div><div className={styles.detailCopy}><h4 className={`display ${styles.productTitle}`}>{application.title}</h4><p>{application.description}</p>
                <ButtonLink size="small" variant="ghost" href={application.href} target={application.href.startsWith('https:') ? '_blank' : undefined} rel={application.href.startsWith('https:') ? 'noopener noreferrer' : undefined}>{application.action}<span aria-hidden="true"><ArrowIcon direction="right" /></span></ButtonLink>
                {application.secondaryHref && <ButtonLink size="small" variant="ghost" href={application.secondaryHref} target="_blank" rel="noopener noreferrer">{application.secondaryAction}<span aria-hidden="true"><ArrowIcon direction="right" /></span></ButtonLink>}
              </div></div>
            </div>
          </div>)}
        </div>
      </div>
      <div className={styles.visual}>
        <div className={styles.exampleControls}>
          <div className={styles.choices} role="group" aria-label={`${applications[active].name} examples`}>{examples[active].map((example, exampleIndex) => <button type="button" key={example.label} aria-pressed={selected[active] === exampleIndex} onClick={() => setSelected(previous => previous.map((value, index) => index === active ? exampleIndex : value))}>{example.label}</button>)}</div>
        </div>
        <div className={styles.scenes} data-application-frame aria-hidden="true">
          {applications.map(({ name }, index) => <div key={name} className={styles.scene} data-application-scene={index} data-active={active === index}><div className={styles.justCallComposition}>{index === 0 ? <JustCallScene example={justCallExamples[selected[0]]} /> : index === 1 ? <ServiceAgentScene responsive example={serviceAgentExamples[selected[1]]} /> : <PyAIScene field={pyaiFields[selected[2]].field} />}</div></div>)}
        </div>
      </div>
    </div>
  </section>;
}
