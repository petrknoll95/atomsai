import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import type { ContentLink } from './client-content';
import styles from './applications.module.css';

type Need = { title: string; body: string; link?: ContentLink };

/**
 * "All that engineering": one statement in two tones on the flat page, as the
 * homepage sets its point of view. The heading is the first clause; the claim
 * runs on beneath it in the muted tone, and its last words return to the
 * foreground. The two needs follow as plain columns under a hairline, each
 * leading to the chapter that answers it. Both lines reveal like every other
 * headline on the site, and end on this state.
 */
export function ApplicationsStatement({ id, title, statement, emphasis = '', needs }: {
  id: string; title: string; statement: string; emphasis?: string; needs: Need[];
}) {
  const lead = emphasis && statement.endsWith(emphasis) ? statement.slice(0, -emphasis.length).trimEnd() : statement;
  return <div className={styles.statement}>
    <h2 id={id} className={`display ${styles.statementTitle}`}>{title}</h2>
    <p className={`display ${styles.statementText}`} data-text-reveal>{lead}{lead !== statement && <> <span className={styles.emphasis}>{emphasis}</span></>}</p>
    <div className={styles.needs}>
      {needs.map(need => <div key={need.title} className={styles.need}>
        <h3 className={styles.needTitle}>{need.title}</h3>
        <p className={styles.needText}>{need.body}</p>
        {need.link && <ButtonLink href={need.link.href} size="small" variant="ghost" className={styles.needLink}>
          {need.link.label}<ArrowIcon direction="up" size={14} />
        </ButtonLink>}
      </div>)}
    </div>
  </div>;
}
