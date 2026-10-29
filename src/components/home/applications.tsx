import { ButtonLink, Eyebrow } from '../ui';
import { HomePattern } from '@/components/patterns/home-pattern';
import { ApplicationCard } from './application-card';
import styles from './products.module.css';

const applications = [
  {
    name: 'JustCall',
    description: 'Calls, messages and AI assistance for sales and support teams.',
    href: 'https://justcall.io/',
    icon: 'justcall-mark.svg',
    pattern: 'applications-drift',
  },
  {
    name: 'Helpwise',
    description: 'A shared inbox that keeps customer messages and team replies together.',
    href: 'https://helpwise.io/',
    icon: 'helpwise-mark.svg',
    pattern: 'applications-band',
  },
  {
    name: 'ServiceAgent',
    description: 'AI call answering and office workflows for home service businesses.',
    href: 'https://serviceagent.ai/',
    icon: 'serviceagent-mark.svg',
    pattern: 'applications-concentric',
  },
  {
    name: 'CallPage',
    description: 'Turn website interest into a callback or a scheduled conversation.',
    href: 'https://www.callpage.io/',
    icon: 'callpage-mark.svg',
    pattern: 'applications-offset',
  },
] as const;

export function Applications() {
  return (
    <section id="applications" className={`page-container ${styles.applications}`} aria-labelledby="applications-title">
      <div className={styles.sectionHeading}>
        <Eyebrow href="#applications">Applications</Eyebrow>
        <h2 id="applications-title" className={`display ${styles.applicationsTitle}`}>
          For the calls, messages and work in between.
        </h2>
      </div>
      <div className={styles.applicationsGrid}>
        {applications.map((application, index) => (
          <ApplicationCard name={application.name} className={styles.application} key={application.name}>
            <a className={styles.applicationCircle} href={application.href} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${application.name}`}>
              <div className={styles.applicationFigure} aria-hidden="true">
              <div className={styles.applicationPattern} data-application-pattern>
                <HomePattern application={application.pattern} />
              </div>
              <span className={styles.applicationIcon} data-application-icon style={{ maskImage: `url('/assets/products/${application.icon}')` }} />
              </div>
            </a>
            <div className={`${styles.applicationCopy} ${index === 0 ? styles.applicationCopyCompact : ''}`}>
              <h3 className={`display ${styles.productTitle}`}>{application.name}</h3>
              <div className={styles.applicationDescription}>
                <p>{application.description}</p>
                <ButtonLink className={styles.applicationAction} data-application-action href={application.href} target="_blank" rel="noopener noreferrer" size="small" variant="outline">
                  Explore {application.name}
                </ButtonLink>
              </div>
            </div>
          </ApplicationCard>
        ))}
      </div>
    </section>
  );
}
