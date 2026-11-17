'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const cards = [...el.children] as HTMLElement[];
    // At the end of the track the last card can't reach the start edge.
    if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) return setActive(cards.length - 1);
    const left = el.getBoundingClientRect().left;
    let best = 0, distance = Infinity;
    cards.forEach((card, i) => { const d = Math.abs(card.getBoundingClientRect().left - left); if (d < distance) { distance = d; best = i; } });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => { el.removeEventListener('scroll', sync); window.removeEventListener('resize', sync); };
  }, [sync]);

  const go = (i: number) => {
    const el = track.current, card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  };

  return <section className={styles.section} aria-labelledby="trust-summary-title">
    <div className={styles.intro}>
      <div>
        <h2 id="trust-summary-title" className={`display ${styles.heading}`}>However, confidence takes more than just capability</h2>
        <p className={styles.description}>Dependable systems, responsible safeguards, and security you can verify. All part of the engineering.</p>
        <ButtonLink className={styles.cta} href="/trust" variant="outline">Visit the Trust Center</ButtonLink>
      </div>
      <div className={styles.pager} role="group" aria-label="Choose a trust principle">
        {trust.map((item, i) => <button key={item.label} type="button" className={styles.dot} aria-label={item.label} aria-current={i === active ? 'true' : undefined} onClick={() => go(i)} />)}
      </div>
    </div>
    <ul ref={track} className={styles.track} tabIndex={0} aria-label="Trust principles">
      {trust.map(item => <li key={item.label} className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.art} src={assetPath(`/assets/illustrations/trust-${item.image}.svg`)} width={384} height={384} alt="" loading="lazy" />
        <div className={styles.copy}>
          <p className={styles.label}>{item.label}</p>
          <h3 className={`display ${styles.title}`}>{item.title}</h3>
          <p className={styles.text}>{item.text}</p>
        </div>
      </li>)}
    </ul>
  </section>;
}
