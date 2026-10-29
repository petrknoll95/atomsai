import type { Metadata } from 'next';
import Image from 'next/image';
import { PageShell } from '@/components/pages/page-shell';
import { HealthcareWorkflow } from '@/components/pages/healthcare-workflow';
import { ButtonLink } from '@/components/ui';
import styles from '@/components/pages/healthcare.module.css';

export const metadata: Metadata = {
  title: 'AI for healthcare teams — AtomsAI',
  description: 'Connect patient enquiries, scheduling and front-office follow-ups. AI workflows built around your practice systems, with your clinical team in control.',
  alternates: { canonical: 'https://atomsai.com/industries/healthcare' },
};

const questions = [
  ['Which practice systems can you connect?', 'We scope connections around the systems you use, including platforms such as athenahealth, eClinicalWorks, Epic, Dentrix and Open Dental. Availability depends on access, APIs and the workflow. We confirm those requirements before building.'],
  ['Does the agent give medical advice?', 'No. These workflows cover administrative tasks such as scheduling, intake and billing questions. Clinical questions and urgent concerns follow the escalation rules agreed with your team.'],
  ['How do you handle patient information?', 'Identity checks, access, retention and data flows are designed with your team. For covered workloads, review the applicable Business Associate Agreement and deployment scope before sharing patient information.'],
  ['Can it work across multiple locations?', 'The workflow can use each location’s hours, providers, services and scheduling rules. We map the differences during discovery so the agent knows which location and team to involve.'],
  ['What does the first build look like?', 'We start with one workflow, the systems it touches and a baseline to measure against. Your team tests realistic scenarios and handoffs before launch. Timing depends on the scope and access requirements.'],
];

export default function HealthcarePage() {
  return <PageShell><main id="main" className={styles.page} data-theme="light">
    <section className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <a className={styles.breadcrumb} href="https://atomsai.com/industries">Industries <span aria-hidden="true">/</span> Healthcare</a>
      <div className={styles.heroHeadingRow}>
        <h1 id="hero-heading" className={`display ${styles.heroHeading}`}>A calmer front desk.<br />More room for care.</h1>
        <div className={styles.heroIntro}><p>Help patients book, reschedule and find the right answer. Give your team more time for the people in front of them.</p><ButtonLink href="/company/contact?topic=healthcare" size="large">Talk about your practice <span aria-hidden="true">↗</span></ButtonLink></div>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.photoWrap}><Image src="/assets/figma/industries-BackgroundImage1-1024.webp" width={1024} height={1024} sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1599px) 55vw, 855px" loading="eager" alt="Healthcare professional working at a desk in a medical practice" fetchPriority="high" className={styles.photo} /><span className={styles.photoCaption}>For medical and dental groups</span></div>
        <div className={styles.morning}>
          <div className={styles.morningLabel}><span className={styles.dot} /> A morning at the practice</div>
          <h2 className={`display ${styles.morningHeading}`}>Before the doors<br />even open.</h2>
          <ol className={styles.morningTimeline}>
            <li><span>07:42</span><div><strong>A patient calls.</strong><p>Thursday no longer works.</p></div></li>
            <li><span>07:44</span><div><strong>A new time is confirmed.</strong><p>Same provider. Tuesday at four.</p></div></li>
            <li><span>08:09</span><div><strong>The freed slot is filled.</strong><p>A waitlisted patient says yes.</p></div></li>
          </ol>
          <p className={styles.caption}>Illustrative workflow · configured with your team</p>
        </div>
      </div>
    </section>

    <section id="patient-journey" className={`page-container ${styles.section}`} aria-labelledby="journey-heading">
      <div className={styles.sectionHeader}><div><p className={styles.kicker}>The everyday, taken care of</p><h2 id="journey-heading" className={`display ${styles.sectionHeading}`}>One request.<br />A useful next step.</h2></div><p className={styles.sectionIntro}>From the first question to an updated record, the details stay with the conversation. See how a few familiar moments could work.</p></div>
      <HealthcareWorkflow />
    </section>

    <section className={`page-container ${styles.connections}`} aria-labelledby="connections-heading">
      <div className={styles.connectionsCopy}><p className={styles.kicker}>Built around your practice</p><h2 id="connections-heading" className={`display ${styles.sectionHeading}`}>Your systems.<br />Connected to the conversation.</h2><p>Keep your practice software, phone numbers and ways of working. We connect the workflow to the information it needs, with the access you approve.</p><a className={styles.textLink} href="/approach">See how we build <span aria-hidden="true">↗</span></a></div>
      <div className={styles.systems}><div className={styles.systemsHeader}><span>Your practice systems</span><span aria-hidden="true">↙</span></div><ul><li>athenahealth</li><li>eClinicalWorks</li><li>Epic</li><li>Dentrix</li><li>Open Dental</li><li>Your phone system</li></ul><p className={styles.caption}>Connections are scoped and built for your engagement. Availability depends on your systems and access.</p></div>
    </section>

    <section className={styles.controls} data-theme="dark" aria-labelledby="controls-heading">
      <div className={`page-container ${styles.controlsInner}`}>
        <div className={styles.controlsIntro}><p className={styles.kicker}>Human judgment stays central</p><h2 id="controls-heading" className={`display ${styles.sectionHeading}`}>The right boundary<br />is part of the build.</h2><p>Decide what the agent can handle, what needs approval, and when your team takes over. Test those boundaries before the first patient conversation.</p><ButtonLink href="/trust" variant="outline">Explore the Trust Center <span aria-hidden="true">↗</span></ButtonLink></div>
        <div className={styles.boundaries}>
          <div className={styles.boundaryRow}><span className={styles.boundaryNumber}>01</span><div><h3 className={`display ${styles.boundaryHeading}`}>Administrative work, clearly scoped.</h3><p>Scheduling, intake and routine questions. Clinical advice stays with your care team.</p></div></div>
          <div className={styles.boundaryRow}><span className={styles.boundaryNumber}>02</span><div><h3 className={`display ${styles.boundaryHeading}`}>Patient information, carefully handled.</h3><p>Agree identity checks, permissions and retention. Review the BAA and deployment scope for covered workloads.</p></div></div>
          <div className={styles.boundaryRow}><span className={styles.boundaryNumber}>03</span><div><h3 className={`display ${styles.boundaryHeading}`}>A person, with the context.</h3><p>Route clinical questions, exceptions and requests for staff with the conversation attached.</p></div></div>
          <div className={styles.boundaryRow}><span className={styles.boundaryNumber}>04</span><div><h3 className={`display ${styles.boundaryHeading}`}>Something you can review.</h3><p>Inspect actions and handoffs. Measure bookings, response times and escalations against your starting point.</p></div></div>
        </div>
      </div>
    </section>

    <section className={`page-container ${styles.faq}`} aria-labelledby="questions-heading"><div><p className={styles.kicker}>A few practical questions</p><h2 id="questions-heading" className={`display ${styles.sectionHeading}`}>Before we<br />get started.</h2></div><div className={styles.questions}>{questions.map(([question, answer]) => <details key={question} className={styles.question}><summary>{question}<span aria-hidden="true" className={styles.plus}>+</span></summary><p>{answer}</p></details>)}</div></section>

    <section className={`page-container ${styles.closing}`} aria-labelledby="healthcare-contact-heading"><div className={styles.closingPanel}><div><p className={styles.kicker}>Start with your front desk</p><h2 id="healthcare-contact-heading" className={`display ${styles.sectionHeading}`}>What could your team<br />use a hand with?</h2></div><div className={styles.closingCopy}><p>Bring one workflow and the systems behind it. We’ll look at what a first build could cover.</p><ButtonLink href="/company/contact?topic=healthcare" size="large">Talk to AtomsAI <span aria-hidden="true">↗</span></ButtonLink></div></div></section>
  </main></PageShell>;
}
