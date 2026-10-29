'use client';

import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useRef, useState } from 'react';
import { Eyebrow } from '../ui';
import { JustCallScene, HelpwiseScene, ServiceAgentScene, CallPageScene } from './application-scenes';
import styles from './applications-workflow.module.css';
import { useApplicationReveal } from './use-application-reveal';

const applications = [
  { name: 'JustCall', mark: 'justcall-mark.svg', description: 'Calls, messages and AI assistance for sales and support teams.', href: 'https://justcall.io/', scene: JustCallScene },
  { name: 'Helpwise', mark: 'helpwise-mark.svg', description: 'A shared inbox that keeps customer messages and team replies together.', href: 'https://helpwise.io/', scene: HelpwiseScene },
  { name: 'ServiceAgent', mark: 'serviceagent-mark.svg', description: 'AI call answering and office workflows for home service businesses.', href: 'https://serviceagent.ai/', scene: ServiceAgentScene },
  { name: 'CallPage', mark: 'callpage-mark.svg', description: 'Turn website interest into a callback or a scheduled conversation.', href: 'https://www.callpage.io/', scene: CallPageScene },
];

export function ApplicationsWorkflow() {
  const root = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  useApplicationReveal(root, active);
  useEffect(() => {
    const figures = root.current?.querySelectorAll<HTMLElement>('[data-application-composition]');
    if (!figures) return;
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => (entry.target as HTMLElement).style.setProperty('--scene-scale', String(entry.contentRect.width / 360)));
    });
    figures.forEach(figure => observer.observe(figure));
    return () => observer.disconnect();
  }, []);

  return <section ref={root} id="applications" className={`page-container ${styles.section}`} aria-labelledby="applications-title" data-application-workflow>
    <h2 id="applications-title" className={`display ${styles.sectionHeading}`}>AI applications for everyday work.</h2>
    <div className={`theme-dark ${styles.panel}`} data-theme="dark">
      <div className={styles.copy}>
        <Eyebrow className={styles.eyebrow} href="#applications">Applications</Eyebrow>
        <h3 className={`display ${styles.heading}`}>For the calls, messages and work in between.</h3>
        <div className={styles.accordion}>
          {applications.map((application, index) => <div className={styles.item} data-active={active === index} key={application.name}>
            <h4><button ref={element => { buttons.current[index] = element; }} className={styles.trigger} id={`application-trigger-${index}`} aria-expanded={active === index} aria-controls={`application-detail-${index}`} onClick={() => setActive(index)} onKeyDown={event => {
              const next = event.key === 'ArrowDown' ? (index + 1) % 4 : event.key === 'ArrowUp' ? (index + 3) % 4 : event.key === 'Home' ? 0 : event.key === 'End' ? 3 : null;
              if (next !== null) { event.preventDefault(); buttons.current[next]?.focus(); }
            }}><span className={styles.productLogo} aria-hidden="true" style={{ maskImage: `url(/assets/products/${application.mark})` }} /><span className={`display ${styles.name}`}>{application.name}</span></button></h4>
            <div className={styles.detail} id={`application-detail-${index}`} role="region" aria-labelledby={`application-trigger-${index}`} aria-hidden={active !== index} inert={active !== index}>
              <div><div className={styles.detailCopy}><p>{application.description}</p><a href={application.href} target="_blank" rel="noopener noreferrer">Explore {application.name}<span aria-hidden="true"><ArrowIcon direction="up-right" /></span></a></div></div>
            </div>
          </div>)}
        </div>
      </div>
      <div className={styles.visual}>
        <div className={styles.scenes} aria-hidden="true">
          {applications.map(({ name, scene: Scene }, index) => <div key={name} className={styles.scene} data-application-scene={index} data-active={active === index}>{name === 'Helpwise' ? <div className={styles.helpwiseComposition}><Scene /></div> : (name === 'JustCall' || name === 'ServiceAgent' || name === 'CallPage') ? <div className={styles.justCallComposition}><Scene /></div> : <div className={styles.sceneComposition} data-application-composition><div className={styles.sceneCanvas}><Scene /></div></div>}</div>)}
        </div>
      </div>
    </div>
  </section>;
}
