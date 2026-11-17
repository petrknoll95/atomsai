import { withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ContactForm } from '@/components/pages/contact-form';
import { ContactBackdrop } from '@/components/pages/contact-backdrop';
import styles from '@/components/pages/contact.module.css';

export const metadata: Metadata = {
  title: 'Contact — Find your starting point | AtomsAI',
  description: 'Tell AtomsAI about the workflow you want to improve. Start a conversation about AI applications, infrastructure, or a custom build.',
  alternates: { canonical: 'https://atomsai.com/company/contact' },
};

const contacts = [
  { title: 'Security & compliance', text: 'Reports, questionnaires and data agreements.', email: 'security@atomsai.com' },
  { title: 'Partnerships', text: 'Technology, cloud and model providers.', email: 'partners@atomsai.com' },
  { title: 'Press', text: 'Interviews, briefings and brand assets.', email: 'press@atomsai.com' },
  { title: 'Careers', text: 'Role questions and introductions.', email: 'careers@atomsai.com' },
];

export default function ContactPage() {
  return <PageShell><main id="main" className={styles.page} data-theme="light">
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.panel} data-theme="dark">
        <ContactBackdrop />
        <div className={styles.panelInner}>
          <div className={styles.introduction}>
            <p className={styles.kicker}><span />Contact AtomsAI</p>
            <h1 className={`display ${styles.title}`} id="hero-heading">Let’s find your<br />starting point.</h1>
            <p className={styles.lead}>Tell us a little about your team and the workflow you want to improve. We’ll work out the next step together.</p>
          </div>
          <div className={styles.formColumn} data-theme="light"><ContactForm /></div>
        </div>
      </div>
    </section>
    <section className={`page-container ${styles.directory}`} aria-labelledby="directory-heading">
      <div className={styles.directoryIntro}>
        <div><p className={styles.kicker}><span />Looking for someone specific?</p><h2 className={`display ${styles.sectionTitle}`} id="directory-heading">The right conversation.<br />The right team.</h2></div>
        <p className={styles.direct}>Prefer to write directly?<a className={styles.directLink} href={withBasePath("mailto:hello@atomsai.com")}><span className="link-underline">hello@atomsai.com</span><span className={styles.arrow} aria-hidden="true"><ArrowIcon direction="up-right" /></span></a></p>
      </div>
      <ul className={styles.contacts}>{contacts.map(contact => <li key={contact.email}><a className={styles.contact} href={withBasePath(`mailto:${contact.email}`)}>
        <h3 className={`display ${styles.contactTitle}`}>{contact.title}</h3>
        <p>{contact.text}</p>
        <span className={styles.contactEmail}><span className="link-underline">{contact.email}</span><span className={styles.arrow} aria-hidden="true"><ArrowIcon direction="up-right" /></span></span>
      </a></li>)}</ul>
    </section>
    <aside className={`page-container ${styles.footnote}`} aria-label="Further information">
      <div className={styles.footnoteRow}>
        <p>Still exploring what a build involves?</p>
        <a href={withBasePath("/approach")}><span className="link-underline">See how we work</span><span className={styles.arrow} aria-hidden="true"><ArrowIcon direction="right" /></span></a>
        <a href={withBasePath("/trust")}><span className="link-underline">Visit the Trust Center</span><span className={styles.arrow} aria-hidden="true"><ArrowIcon direction="right" /></span></a>
      </div>
    </aside>
  </main></PageShell>;
}
