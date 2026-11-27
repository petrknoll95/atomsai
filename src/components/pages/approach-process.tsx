'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowIcon } from '@/components/arrow-icon';
import { Button } from '@/components/ui';
import { assetPath } from '@/lib/base-path';
import styles from './approach.module.css';
import ui from './workflow-visuals.module.css';

type Step = { name: string; short: string; description: string; output: string; detail: string; need: string; items: string[] };
// One series from scripts/approach-art.mjs: same grid footprint, scale and viewBox for every stage.
const illustrations = ['understand', 'design', 'build', 'validate', 'handover'];

export function ApproachProcess({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const followHash = () => {
      const match = window.location.hash.match(/^#step-([1-5])$/);
      if (match) setActive(Number(match[1]) - 1);
    };
    followHash();
    window.addEventListener('hashchange', followHash);
    window.addEventListener('popstate', followHash);
    return () => { window.removeEventListener('hashchange', followHash); window.removeEventListener('popstate', followHash); };
  }, []);

  function select(index: number, focus = false) {
    setActive(index);
    if (focus) {
      tabs.current[index]?.focus({ preventScroll: true });
      tabs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % steps.length
      : event.key === 'ArrowLeft' ? (index + steps.length - 1) % steps.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  }

  return <div className={styles.processExplorer}>
    <div className={styles.processTabs} role="tablist" aria-label="Explore the five stages">
      {steps.map((step, index) => <Button key={step.short} variant={active === index ? 'primary' : 'secondary'} role="tab" id={`step-${index+1}`} ref={element => { tabs.current[index] = element; }} aria-selected={active === index} aria-controls={`process-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => navigate(event,index)}><span>0{index+1}</span>{step.short}<span className={styles.tabDot} aria-hidden="true" /></Button>)}
    </div>
    {steps.map((step, index) => <div key={step.short} id={`process-panel-${index}`} role="tabpanel" aria-labelledby={`step-${index+1}`} tabIndex={0} hidden={active !== index} className={styles.processPanel}>
      <div className={styles.stepCopy}>
        <span className={styles.stepEyebrow}>Stage 0{index+1} / 05</span>
        <h3 className={`display ${styles.stepTitle}`}>{step.name}</h3>
        <p>{step.description}</p>
        <details className={styles.need}><summary>What we need from you <span aria-hidden="true">+</span></summary><p>{step.need}</p></details>
        <div className={styles.stepNavigation}><span>{index+1} of {steps.length}</span><Button variant="outline" aria-label="Previous stage" disabled={index===0} onClick={()=>select(index-1,true)}><ArrowIcon direction="left" size={20}/></Button><Button variant="outline" aria-label="Next stage" disabled={index===steps.length-1} onClick={()=>select(index+1,true)}><ArrowIcon size={20}/></Button></div>
      </div>
      <div className={`${ui.tokens} ${ui.card} ${styles.deliverable}`} data-theme="light">
        <div className={styles.deliverableHeader}><span className={styles.folderIcon} aria-hidden="true"/><span>What you take away</span><span>0{index+1}</span></div>
        <div className={styles.deliverableBody}><div className={styles.deliverableArt} aria-hidden="true"><img src={assetPath(`/assets/illustrations/approach-${illustrations[index]}.svg`)} alt="" width="254" height="231" /></div>
        <ul className={styles.deliverableItems}>{step.items.map(item=><li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>
        <p>{step.detail}</p></div>
      </div>
    </div>)}
  </div>;
}
