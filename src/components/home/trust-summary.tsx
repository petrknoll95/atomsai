import { ButtonLink } from '@/components/ui';
import { assetPath } from '@/lib/base-path';
import { siteHref } from '@/lib/site-links';
import { ClipCard } from './clip-card';
import styles from './trust-summary.module.css';

// Every card shares the mist palette and the same line-art treatment.
// ink is each line SVG's ink box (width / height), printed by scripts/trust-line-art.mjs.
const trust = [
  { image: 'integrations', href: siteHref('/integrations'), ink: '254.45 / 195.604', label: 'Integrations', title: 'Fits into your current stack', text: 'See which tools can connect to the systems your team already uses for calls and follow-ups.' },
  { image: 'safeguards', href: '/trust#controls', ink: '236.062 / 165.912', label: 'Safeguards', title: 'Guardrails where they matter', text: 'See how role-based permissions and access logs help control who can reach sensitive data.' },
  { image: 'reliability', href: '/trust#certifications', ink: '219.734 / 208.608', label: 'Reliability', title: 'Engineered for real conditions', text: 'Review the independent audit of JustCall’s availability, security, and confidentiality controls.' },
  { image: 'security', href: '/trust#documents', ink: '138.71 / 219.734', label: 'Security', title: 'Data privacy & security you can verify', text: 'Find product-specific security documentation and request the reports your team needs.' },
];

export function TrustSummary() {
  return <section className={`page-container ${styles.section}`} aria-labelledby="trust-summary-title">
    <header className={styles.intro}>
      <h2 id="trust-summary-title" className={`display ${styles.heading}`}>However, confidence takes more than just capability</h2>
      <p className={styles.description}>Dependable systems, responsible safeguards, and security you can verify. All part of the engineering.</p>
      <ButtonLink className={styles.cta} href="/trust" variant="outline">Visit the Trust Center</ButtonLink>
    </header>
    <ul className={styles.list}>
      {trust.map(item => <li key={item.label}>
        <ClipCard className={styles.card} href={item.href}>
          <span className={styles.background} data-clip-inset aria-hidden="true" />
          <span className={styles.label}>{item.label}</span>
          <h3 className={`display ${styles.title}`}>{item.title}</h3>
          <p className={styles.text}>{item.text}</p>
          <span className={styles.art} aria-hidden="true" style={{ aspectRatio: item.ink, maskImage: `url("${assetPath(`/assets/illustrations/trust-${item.image}-line.svg`)}")` }} />
        </ClipCard>
      </li>)}
    </ul>
  </section>;
}
