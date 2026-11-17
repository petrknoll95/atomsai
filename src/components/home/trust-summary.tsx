'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ButtonLink } from '@/components/ui';
import { assetPath } from '@/lib/base-path';
import styles from './trust-summary.module.css';

const trust = [
  { image: 'integrations', label: 'Integrations', title: 'Fits into your current stack', text: 'Connect AI to existing tools and workflows through integrations, APIs, and custom engineering.' },
  { image: 'safeguards', label: 'Safeguards', title: 'Guardrails where they matter', text: 'Set boundaries for AI actions, with oversight and escalation for sensitive situations.' },
  { image: 'reliability', label: 'Reliability', title: 'Engineered for real conditions', text: 'Built with years of experience handling live calls, interruptions, and unpredictable networks.' },
  { image: 'security', label: 'Security', title: 'Data privacy & security you can verify', text: 'Explore product-specific security controls, privacy practices, and compliance documentation.' },
];

export function TrustSummary() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', duration: 32 });
  const [snaps, setSnaps] = useState<number[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => { setSnaps(emblaApi.scrollSnapList()); setActive(emblaApi.selectedScrollSnap()); };
    sync();
    emblaApi.on('select', sync).on('reInit', sync);
    return () => { emblaApi.off('select', sync).off('reInit', sync); };
  }, [emblaApi]);

  const go = useCallback((i: number) => {
    emblaApi?.scrollTo(i, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [emblaApi]);

  return <section className={styles.section} aria-labelledby="trust-summary-title">
    <div className={styles.intro}>
      <div>
        <h2 id="trust-summary-title" className={`display ${styles.heading}`}>However, confidence takes more than just capability</h2>
        <p className={styles.description}>Dependable systems, responsible safeguards, and security you can verify. All part of the engineering.</p>
        <ButtonLink className={styles.cta} href="/trust" variant="outline">Visit the Trust Center</ButtonLink>
      </div>
      <div className={styles.pager} role="group" aria-label="Trust principles pages">
        {snaps.map((_, i) => <button key={i} type="button" className={styles.dot} aria-label={`Show page ${i + 1} of ${snaps.length}`} aria-current={i === active ? 'true' : undefined} onClick={() => go(i)} />)}
      </div>
    </div>
    <div ref={emblaRef} className={styles.viewport} aria-roledescription="carousel" aria-label="Trust principles">
      <ul className={styles.track}>
        {trust.map(item => <li key={item.label} className={styles.card} aria-roledescription="slide" aria-label={item.label}>
          <img className={styles.art} src={assetPath(`/assets/illustrations/trust-${item.image}.svg`)} width={384} height={384} alt="" />
          <div className={styles.copy}>
            <p className={styles.label}>{item.label}</p>
            <h3 className={`display ${styles.title}`}>{item.title}</h3>
            <p className={styles.text}>{item.text}</p>
          </div>
        </li>)}
      </ul>
    </div>
  </section>;
}
