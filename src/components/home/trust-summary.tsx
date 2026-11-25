'use client';

import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowIcon } from '@/components/arrow-icon';
import { Eyebrow } from '@/components/ui';
import { TrustIllustration } from './trust-illustration';
import { siteHref } from '@/lib/site-links';
import { ClipCard } from './clip-card';
import styles from './trust-summary.module.css';

// ink is each line SVG's ink box (width / height), printed by scripts/trust-line-art.mjs.
const trust = [
  { image: 'integrations', href: siteHref('/integrations'), ink: '254.45 / 195.604', label: 'Integrations', title: 'Fits into your current stack', text: 'See which tools can connect to the systems your team already uses for calls and follow-ups.' },
  { image: 'safeguards', href: '/trust#controls', ink: '236.062 / 165.912', label: 'Safeguards', title: 'Guardrails where they matter', text: 'See how role-based permissions and access logs help control who can reach sensitive data.' },
  { image: 'reliability', href: '/trust#certifications', ink: '219.734 / 208.608', label: 'Reliability', title: 'Engineered for real conditions', text: 'Review the independent audit of JustCall’s availability, security, and confidentiality controls.' },
  { image: 'security', href: '/trust#documents', ink: '138.71 / 219.734', label: 'Security', title: 'Data privacy & security you can verify', text: 'Find product-specific security documentation and request the reports your team needs.' },
] as const;

export function TrustSummary() {
  const [viewport, carousel] = useEmblaCarousel({
    loop: true,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!carousel) return;
    const sync = () => setActive(carousel.selectedScrollSnap());
    sync();
    carousel.on('select', sync).on('reInit', sync);
    return () => { carousel.off('select', sync).off('reInit', sync); };
  }, [carousel]);

  return <section id="trust-summary" className={`page-container ${styles.section}`} aria-labelledby="trust-summary-title">
    <header className={styles.intro}>
      <h2 id="trust-summary-title" className={`display ${styles.heading}`}>However, confidence takes more than just capability</h2>
      <p className={styles.description}>Dependable systems, responsible safeguards, and security you can verify. All part of the engineering.</p>
      <Eyebrow className={styles.cta} href="/trust">Trust Center</Eyebrow>
    </header>
    <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label="Trust topics">
      <div ref={viewport} className={styles.viewport}>
        <ul className={styles.list}>
          {trust.map((item, index) => <li key={item.label} inert={active !== index} aria-hidden={active !== index} data-trust-card={item.image}>
            <ClipCard className={styles.card} href={item.href}>
              <span className={styles.background} data-clip-inset aria-hidden="true" />
              <span className={styles.label}>{item.label}</span>
              <h3 className={`display ${styles.title}`}>{item.title}</h3>
              <p className={styles.text}>{item.text}</p>
              <span className={styles.art} aria-hidden="true" style={{ aspectRatio: item.ink }} />
            </ClipCard>
          </li>)}
        </ul>
      </div>
      <TrustIllustration topic={trust[active].image} />
      <button type="button" className={styles.next} aria-label="Next trust topic" onClick={() => carousel?.scrollNext()}>
        <ArrowIcon size={22} />
      </button>
      <span className="sr-only" role="status">{trust[active].label}, {active + 1} of {trust.length}</span>
    </div>
  </section>;
}
