'use client';

import { useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowIcon } from '@/components/arrow-icon';
import { Eyebrow } from '@/components/ui';
import { TrustIllustration } from './trust-illustration';
import { siteHref } from '@/lib/site-links';
import Fade from 'embla-carousel-fade';
import Link from 'next/link';
import styles from './trust-summary.module.css';
import tracks from './stories-carousel.module.css';
import { createStoryAutoplay, useStoryAutoplay } from './use-story-autoplay';

// ink is each line SVG's ink box (width / height), printed by scripts/trust-line-art.mjs.
const trust = [
  { image: 'integrations', href: siteHref('/integrations'), ink: '254.45 / 195.604', label: 'Integrations', title: 'Fits into your current stack', text: 'See which tools can connect to the systems your team already uses for calls and follow-ups.' },
  { image: 'safeguards', href: '/trust#controls', ink: '236.062 / 165.912', label: 'Safeguards', title: 'Guardrails where they matter', text: 'See how role-based permissions and access logs help control who can reach sensitive data.' },
  { image: 'reliability', href: '/trust#certifications', ink: '219.734 / 208.608', label: 'Reliability', title: 'Engineered for real conditions', text: 'Review the independent audit of JustCall’s availability, security, and confidentiality controls.' },
  { image: 'security', href: '/trust#documents', ink: '138.71 / 219.734', label: 'Security', title: 'Data privacy & security you can verify', text: 'Find product-specific security documentation and request the reports your team needs.' },
] as const;

export function TrustSummary() {
  const autoplay = useMemo(createStoryAutoplay, []);
  const fade = useMemo(() => Fade(), []);
  const [viewport, carousel] = useEmblaCarousel({
    loop: true,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  }, [fade, autoplay]);
  const { active, bars, paused, togglePlayback } = useStoryAutoplay(carousel);

  return <section id="trust-summary" className={`page-container ${styles.section}`} aria-labelledby="trust-summary-title">
    <header className={styles.intro}>
      <h2 id="trust-summary-title" className={`display ${styles.heading}`}>However, confidence takes more than just capability</h2>
      <p className={styles.description}>Dependable systems, responsible safeguards, and security you can verify. All part of the engineering.</p>
      <div className={styles.actions}>
        <Eyebrow href="/trust">Trust Center</Eyebrow>
        <button type="button" className={styles.next} aria-controls="trust-topic-cards" aria-label="Next trust topic" onClick={() => carousel?.scrollNext()}>
          <ArrowIcon size={22} />
        </button>
      </div>
    </header>
    <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label="Trust topics">
      <div id="trust-topic-cards" ref={viewport} className={styles.viewport} data-topic={trust[active].image}>
        <ul className={styles.list}>
          {trust.map((item, index) => <li key={item.label} inert={active !== index} aria-hidden={active !== index} data-trust-card={item.image}>
            <Link className={styles.card} href={item.href}>
              <span className={styles.label}>{item.label}</span>
              <h3 className={`display ${styles.title}`}>{item.title}</h3>
              <p className={styles.text}>{item.text}</p>
              <span className={styles.art} aria-hidden="true" style={{ aspectRatio: item.ink }} />
            </Link>
          </li>)}
        </ul>
      </div>
      <TrustIllustration topic={trust[active].image} />
      <span className="sr-only" role="status">{trust[active].label}, {active + 1} of {trust.length}</span>
      <div className={`${tracks.pagination} ${styles.pagination}`} role="group" aria-label="Choose trust topic">
        {trust.map((item, index) => {
          const current = index === active;
          return <button type="button" key={item.image} className={tracks.dot}
            aria-current={current || undefined}
            aria-label={current ? `${item.label}, ${paused ? 'resume' : 'pause'} autoplay` : `Show ${item.label}`}
            onClick={() => current ? togglePlayback() : carousel?.scrollTo(index)}>
            <span className={tracks.line} aria-hidden="true">
              <span className={tracks.fill} ref={bar => { bars.current[index] = bar; }} />
            </span>
          </button>;
        })}
      </div>
    </div>
  </section>;
}
