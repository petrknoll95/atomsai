import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/ui';
import { assetPath } from '@/lib/base-path';
import styles from './trust-summary.module.css';

// Each band picks a palette pair; the line art is tinted with the band's text colour.
// ratio is the ink box of each line SVG, from scripts/trust-line-art.mjs.
const trust = [
  { image: 'integrations', ratio: '254.45 / 195.604', tone: 'deep', label: 'Integrations', title: 'Fits into your current stack', text: 'Connect AI to existing tools and workflows through integrations, APIs, and custom engineering.' },
  { image: 'safeguards', ratio: '236.062 / 165.912', tone: 'apricot', label: 'Safeguards', title: 'Guardrails where they matter', text: 'Set boundaries for AI actions, with oversight and escalation for sensitive situations.' },
  { image: 'reliability', ratio: '166.74 / 214.614', tone: 'stone', label: 'Reliability', title: 'Engineered for real conditions', text: 'Built with years of experience handling live calls, interruptions, and unpredictable networks.' },
  { image: 'security', ratio: '196.208 / 218.112', tone: 'iris', label: 'Security', title: 'Data privacy & security you can verify', text: 'Explore product-specific security controls, privacy practices, and compliance documentation.' },
];

export function TrustSummary() {
  return <section className={`page-container ${styles.section}`} aria-labelledby="trust-summary-title">
    <header className={styles.intro}>
      <h2 id="trust-summary-title" className={`display ${styles.heading}`}>However, confidence takes more than just capability</h2>
      <p className={styles.description}>Dependable systems, responsible safeguards, and security you can verify. All part of the engineering.</p>
      <ButtonLink className={styles.cta} href="/trust" variant="outline">Visit the Trust Center</ButtonLink>
    </header>
    <ul className={styles.list}>
      {trust.map(item => <li key={item.label} className={styles.card} data-tone={item.tone}>
        <p className={styles.label}>{item.label}</p>
        <h3 className={`display ${styles.title}`}>{item.title}</h3>
        <p className={styles.text}>{item.text}</p>
        <span className={styles.art} aria-hidden="true" style={{ '--art-ratio': item.ratio, maskImage: `url("${assetPath(`/assets/illustrations/trust-${item.image}-line.svg`)}")` } as CSSProperties} />
      </li>)}
    </ul>
  </section>;
}
