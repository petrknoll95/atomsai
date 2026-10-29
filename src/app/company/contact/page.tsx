import { withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ContactForm } from '@/components/pages/contact-form';
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
    <section className={`page-container ${styles.opening}`} aria-labelledby="hero-heading">
      <div className={styles.introduction}>
        <p className={styles.kicker}><span />Contact AtomsAI</p>
        <h1 className={`display ${styles.title}`} id="hero-heading">Let’s find your<br />starting point.</h1>
        <p className={styles.lead}>A workflow to improve. A product to explore. A question about what’s possible.</p>
        <p className={styles.invitation}>Tell us a little about your team and what you have in mind. We’ll work out the next step together.</p>
      </div>
      <ContactForm />
        <div className={styles.next}>
          <p className={styles.nextHeading}>A useful first conversation</p>
          <ol>
            <li><span>01</span><p>Bring one workflow.<small>Where does work slow down?</small></p></li>
            <li><span>02</span><p>Tell us what matters.<small>What would a better outcome look like?</small></p></li>
            <li><span>03</span><p>Find a practical next step.<small>We’ll look at the fit, the systems and the scope.</small></p></li>
          </ol>
        </div>

    </section>
    <section className={`page-container ${styles.directory}`} aria-labelledby="directory-heading">
      <div className={styles.directoryIntro}><div><p className={styles.kicker}>Looking for someone specific?</p><h2 className={`display ${styles.sectionTitle}`} id="directory-heading">The right conversation.<br />The right team.</h2></div><p>Prefer to write directly?<br /><a className="link-underline" href={withBasePath("mailto:hello@atomsai.com")}>hello@atomsai.com <span aria-hidden="true"><ArrowIcon direction="up-right" /></span></a></p></div>
      <div className={styles.contacts}>{contacts.map(contact => <div className={styles.contact} key={contact.email}><h3 className={`display ${styles.contactTitle}`}>{contact.title}</h3><p>{contact.text}</p><a className="link-underline" href={withBasePath(`mailto:${contact.email}`)}>{contact.email}<span aria-hidden="true"><ArrowIcon direction="up-right" /></span></a></div>)}</div>
    </section>
    <aside className={`page-container ${styles.footnote}`} aria-label="Further information"><p>Still exploring what a build involves?</p><a className="link-underline" href={withBasePath("/approach")}>See how we work <span aria-hidden="true"><ArrowIcon direction="right" /></span></a><a className="link-underline" href={withBasePath("/trust")}>Visit the Trust Center <span aria-hidden="true"><ArrowIcon direction="right" /></span></a></aside>
  </main></PageShell>;
}
