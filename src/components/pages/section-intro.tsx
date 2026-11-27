import type { ReactNode } from 'react';
import styles from './section-intro.module.css';

/**
 * A section opens the way the homepage's do: one display headline, an optional
 * muted second clause at the same size, at most one short line, and one action.
 */
export function SectionIntro({ id, title, muted, lead, action, as: Heading = 'h2', className = '' }: {
  id?: string; title: ReactNode; muted?: ReactNode; lead?: ReactNode; action?: ReactNode;
  as?: 'h1' | 'h2' | 'h3'; className?: string;
}) {
  return <header className={`${styles.intro} ${className}`}>
    <Heading id={id} className={`display ${styles.title}`}>{title}{muted && <>{' '}<span className={styles.muted}>{muted}</span></>}</Heading>
    {lead && <p className={styles.lead}>{lead}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </header>;
}
