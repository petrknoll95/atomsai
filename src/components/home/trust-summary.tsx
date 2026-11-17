import { ButtonLink } from '@/components/ui';
import { assetPath } from '@/lib/base-path';
import styles from './trust-summary.module.css';

// Every card shares the mist palette; the line art is tinted with the card's text colour.
// ink is each line SVG's ink box (width / height), printed by scripts/trust-line-art.mjs.
const trust = [
  { image: 'integrations', ink: '254.45 / 195.604', label: 'Integrations', title: 'Fits into your current stack', text: 'Connect AI to existing tools and workflows through integrations, APIs, and custom engineering.' },
  { image: 'safeguards', ink: '236.062 / 165.912', label: 'Safeguards', title: 'Guardrails where they matter', text: 'Set boundaries for AI actions, with oversight and escalation for sensitive situations.' },
  { image: 'reliability', ink: '219.734 / 208.608', label: 'Reliability', title: 'Engineered for real conditions', text: 'Built with years of experience handling live calls, interruptions, and unpredictable networks.' },
  { image: 'security', ink: '138.71 / 219.734', label: 'Security', title: 'Data privacy & security you can verify', text: 'Explore product-specific security controls, privacy practices, and compliance documentation.' },
];

export function TrustSummary() {
  return <section className={`page-container ${styles.section}`} aria-labelledby="trust-summary-title">
    <header className={styles.intro}>
      <h2 id="trust-summary-title" className={`display ${styles.heading}`}>However, confidence takes more than just capability</h2>
      <p className={styles.description}>Dependable systems, responsible safeguards, and security you can verify. All part of the engineering.</p>
      <ButtonLink className={styles.cta} href="/trust" variant="outline">Visit the Trust Center</ButtonLink>
    </header>
    <ul className={styles.list}>
      {trust.map(item => <li key={item.label} className={styles.card}>
        <p className={styles.label}>{item.label}</p>
        <h3 className={`display ${styles.title}`}>{item.title}</h3>
        <p className={styles.text}>{item.text}</p>
        <span className={styles.art} aria-hidden="true" style={{ aspectRatio: item.ink, maskImage: `url("${assetPath(`/assets/illustrations/trust-${item.image}-line.svg`)}")` }} />
      </li>)}
    </ul>
  </section>;
}
