'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { OperatingModelScene } from './operating-model-scene';
import styles from './operating-model.module.css';

const layers = [
  { title: 'Models & infrastructure', description: 'Speech and conversational AI, built for real-world phone calls.', action: 'Explore PyAI', href: 'https://pyai.com/' },
  { title: 'Orchestration & workflows', description: 'Models, software, data, and people working together around the job.', action: 'Explore our approach', href: '/approach' },
  { title: 'Applications', description: 'Complete products for customer conversations and business operations.', action: 'Explore applications', href: '#applications' },
  { title: 'Custom AI engineering', description: 'Tailored AI systems for workflows that need more than ready-made software.', action: 'Discuss your project', href: '/company/contact' },
];

export function OperatingModel() {
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState<{ index: number } | null>(null);
  const root = useRef<HTMLElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number) {
    setActive(index);
    setSelection({ index });
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowDown' ? (index + 1) % layers.length
      : event.key === 'ArrowUp' ? (index + layers.length - 1) % layers.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? layers.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
    triggers.current[next]?.focus({ preventScroll: true });
  }

  return <section ref={root} id="offerings" className={`page-container ${styles.section}`} aria-labelledby="operating-model-title" data-text-reveal="off">
    <div className={styles.stage} data-model-stage>
    <header className={styles.intro}>
      <h2 className={`display ${styles.heading}`} id="operating-model-title">The problem decides the pieces</h2>
      <p className={styles.description}>Your goals set the brief. AtomsAI builds what fits, whether that’s a product, a custom model, or a person in the loop.</p>
    </header>

    <div className={styles.diagramRow} data-model-row>
    <div className={styles.rowBackdrop} data-model-backdrop aria-hidden="true" />
    <div className={styles.visual} data-model-visual data-active={active} aria-hidden="true">
      <OperatingModelScene active={active} selection={selection} onHighlight={setActive} />
    </div>

    <div className={styles.accordion} aria-label="Explore the operating model">
      {layers.map((layer, index) => <div className={styles.item} data-active={active === index} key={layer.title}>
        <h3><button type="button" ref={element => { triggers.current[index] = element; }} id={`model-trigger-${index}`} className={styles.trigger} aria-expanded={active === index} aria-controls={`model-detail-${index}`} onClick={() => select(index)} onKeyDown={event => navigate(event, index)}>
          <span className={`display ${styles.name}`}>{layer.title}</span><span className={styles.indicator} aria-hidden="true"><ArrowIcon direction="up-right" size={28}/></span>
        </button></h3>
        <div id={`model-detail-${index}`} role="region" aria-labelledby={`model-trigger-${index}`} className={styles.detail} aria-hidden={active !== index} inert={active !== index}>
          <div><div className={styles.detailCopy}><p>{layer.description}</p><ButtonLink href={layer.href} variant="secondary"><span>{layer.action}</span><ArrowIcon direction="up-right" size={16}/></ButtonLink></div></div>
        </div>
      </div>)}
    </div>
    </div>
    </div>
  </section>;
}
