import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import type { ContentLink } from './client-content';
import styles from './applications.module.css';

type Need = { title: string; body: string; link?: ContentLink };

/**
 * "All that engineering": one statement in two tones on the flat page, as the
 * homepage sets its two-tone heads: the heading in the foreground, then the
 * claim running on beneath it in the muted tone to the end. The two needs
 * follow as plain columns under a hairline, each leading to the chapter that
 * answers it. Both lines reveal like every other headline on the site, and end
 * on this state.
 */
export function ApplicationsStatement({ id, title, statement, needs }: {
  id: string; title: string; statement: string; needs: Need[];
}) {
  return <div className={styles.statement}>
    <h2 id={id} className={`display ${styles.statementTitle}`}>{title}</h2>
    <p className={`display ${styles.statementText}`} data-text-reveal>{statement}</p>
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
