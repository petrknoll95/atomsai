import Image from 'next/image';
import { ButtonLink, Eyebrow } from '@/components/ui';
import { assetPath } from '@/lib/base-path';
import styles from './story-sections.module.css';

export function CompanyProof() {
  return <section id="company-story" className={`page-container ${styles.companyProof}`} aria-label="One company behind the products">
    <dl className={styles.proofFacts} aria-label="AtomsAI in numbers">
      <div><dt>Customers worldwide</dt><dd className="display">7,000+</dd></div>
      <div><dt>Countries served</dt><dd className="display">20+</dd></div>
      <div><dt>Conversations powered a year</dt><dd className="display">1B+</dd></div>
      <div><dt>Raised from Peak XV, Eight Roads, Base10</dt><dd className="display">~$56M</dd></div>
    </dl>
    <div className={styles.productFamily}><p className={styles.label}>One company behind every product here, from the apps to the models that power them.</p><div>{[
      ['JustCall', 'justcall', 'https://justcall.io/'],
      ['ServiceAgent', 'serviceagent', 'https://serviceagent.ai/'],
      ['PyAI', 'pyai', 'https://pyai.com/'],
      ['Helpwise', 'helpwise', 'https://helpwise.io/'],
    ].map(([name, mark, href]) => <a key={name} href={href}>{mark === 'pyai'
      ? <svg className={styles.productIcon} viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="3.5"/><circle cx="32" cy="32" r="13" fill="currentColor"/></svg>
      : <span className={styles.productIcon} aria-hidden="true" style={{ maskImage: `url("${assetPath(`/assets/products/${mark}-mark.svg`)}")` }}/>}<span>{name}</span></a>)}</div></div>
  </section>;
}

// Client titles with short card teasers; article destinations are not supplied.
const fieldNotes = [
  { image: 'voice-signal', title: 'Why 8 kHz audio is still the hardest problem in voice AI', description: 'The engineering challenges behind understanding speech on real-world phone lines.' },
  { image: 'last-mile', title: 'The last mile: fitting frontier models to real workflows', description: 'Connecting frontier models to the tools, data, and decisions inside a business.' },
  { image: 'conversation', title: 'What a billion conversations taught us about interruptions', description: 'Real conversations change direction. Voice AI needs to know when to listen, when to respond, and how to pick up the thread.' },
];

export function FieldNotes() {
  return <section className={`page-container ${styles.section}`} aria-labelledby="field-notes-title">
    <header className={styles.header}><div><p className={styles.label}>Insights</p><h2 id="field-notes-title" className={`display ${styles.heading}`}>Notes from the field</h2></div><ButtonLink href="/blog" variant="outline">View all notes</ButtonLink></header>
    <ul className={styles.notesGrid}>{fieldNotes.map(post => <li key={post.title}><article className={styles.noteCard}>
      <Image className={styles.noteArt} src={assetPath(`/assets/field-notes/${post.image}.webp`)} width={1000} height={1250} sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1600px) 31vw, 470px" alt="" />
      <h3 className="display">{post.title}</h3>
      <p className={styles.noteDescription}>{post.description}</p>
    </article></li>)}</ul>
  </section>;
}

export function PointOfView() {
  return <section className={`page-container ${styles.section} ${styles.statement}`} aria-labelledby="point-of-view-title">
    <Eyebrow href="/approach">Our point of view</Eyebrow>
    <h2 id="point-of-view-title" className={`display ${styles.heading}`}>The real world gets a vote</h2>
    <p>Frontier AI is easy to get. Making it hold up is the last mile.<br />We build for that mile, on a billion conversations a year.</p>
  </section>;
}

export { TrustSummary } from './trust-summary';
