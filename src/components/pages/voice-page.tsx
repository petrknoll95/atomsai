import { ButtonLink } from '@/components/ui';
import { VoiceSample, VoiceJourneys } from './voice-interactions';
import styles from './voice.module.css';

const launchSteps = [
  ['Choose the call', 'Start with one useful outcome: a qualified enquiry, a booking, or a question answered.'],
  ['Connect the context', 'Bring together your knowledge, business rules, and the tools the agent needs.'],
  ['Test the exceptions', 'Try real scenarios together. Check the answers, permissions, and handoffs before launch.'],
  ['Listen and improve', 'Review conversations against the outcomes you agreed. Refine the workflow as you learn.'],
];

export function VoicePage() {
  return <main id="main" data-theme="light" className={styles.page}>
    <section className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <p className={styles.kicker}><span aria-hidden="true" />Voice by AtomsAI</p>
      <div className={styles.heroHeading}>
        <h1 className="display" id="hero-heading">A conversation.<br />A next step.</h1>
        <div className={styles.heroIntro}>
          <p>A voice that knows your business.<br />An agent that helps work move forward.</p>
          <div className={styles.heroActions}><ButtonLink href="/company/contact?topic=voice" size="large">Talk to AtomsAI</ButtonLink><a className={styles.textLink} href="#listen">Hear a sample <span aria-hidden="true">↓</span></a></div>
        </div>
      </div>
      <VoiceSample />
    </section>

    <section className={`page-container ${styles.journeys}`} aria-labelledby="journeys-heading">
      <div className={styles.sectionIntro}>
        <p className={styles.sectionLabel}>From conversation to action</p>
        <div><h2 className={`display ${styles.sectionHeading}`} id="journeys-heading">The call is just<br />the beginning.</h2><p className={styles.sectionDescription}>Answer the question. Understand the need. Carry the details into the next step, with your rules in place.</p></div>
      </div>
      <VoiceJourneys />
    </section>

    <section className={styles.contextSection} aria-labelledby="context-heading">
      <div className={`page-container ${styles.contextGrid}`}>
        <div className={styles.contextIntro}><p className={styles.sectionLabel}>Built around your business</p><h2 className={`display ${styles.sectionHeading}`} id="context-heading">The right context.<br />Behind every call.</h2><p className={styles.sectionDescription}>A useful voice agent needs more than a voice. It needs to know what to say, what it can do, and when to bring in your team.</p><ButtonLink href="/trust" variant="outline">Explore the Trust Center</ButtonLink></div>
        <div className={styles.contextRows}>
          <article><span className={styles.rowNumber}>01</span><div><h3 className="display">Your knowledge, in the conversation.</h3><p>Product details, policies, availability, and approved answers. Ground the agent in the information your team works from.</p><div className={styles.contextTags}><span>Product knowledge</span><span>Business policies</span></div></div></article>
          <article><span className={styles.rowNumber}>02</span><div><h3 className="display">Your tools, in the loop.</h3><p>Connect your CRM, calendars, and operational systems. Capture the details once, then use them where the work happens.</p><div className={styles.contextTags}><span>CRM</span><span>Scheduling</span><span>Your APIs</span></div></div></article>
          <article><span className={styles.rowNumber}>03</span><div><h3 className="display">Your people, when it matters.</h3><p>Define what the agent may handle alone. Route exceptions and sensitive decisions to the right person, with the conversation’s context.</p><a href="/approach" className={styles.textLink}>See how we build <span aria-hidden="true">↗</span></a></div></article>
        </div>
      </div>
    </section>

    <section className={`page-container ${styles.launch}`} aria-labelledby="launch-heading">
      <div className={styles.sectionIntro}><p className={styles.sectionLabel}>Your first voice workflow</p><div><h2 id="launch-heading" className={`display ${styles.sectionHeading}`}>Built with your team.<br />For the way you work.</h2><p className={styles.sectionDescription}>Start with a defined journey. Connect it, test it, and put it to work.</p></div></div>
      <ol className={styles.launchSteps}>{launchSteps.map(([title, copy], i) => <li key={title}><span className={styles.stepNumber}>0{i + 1}</span><h3 className="display">{title}</h3><p>{copy}</p></li>)}</ol>
      <div className={styles.pyaiNote}><span className={`display ${styles.pyaiWord}`}>PyAI</span><p>The voice technology behind AtomsAI.<br />Explore the models and try a conversation in the playground.</p><a href="https://pyai.com/playground" className={styles.textLink}>Explore PyAI <span aria-hidden="true">↗</span></a></div>
    </section>

    <section className={`page-container ${styles.closing}`} aria-labelledby="voice-closing-heading"><div className={styles.closingInner}><p className={styles.sectionLabel}>Let’s start with one call</p><div><h2 className={`display ${styles.sectionHeading}`} id="voice-closing-heading">What should happen<br />after “hello”?</h2><p>Tell us about the calls you handle and the next step you want to make easier.</p><ButtonLink href="/company/contact?topic=voice" size="large">Find your starting point</ButtonLink></div><span className={styles.closingMark} aria-hidden="true">↗</span></div></section>
  </main>;
}
