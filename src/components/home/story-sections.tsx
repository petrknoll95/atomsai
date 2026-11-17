import Image from 'next/image';
import { ButtonLink, Eyebrow } from '@/components/ui';
import { assetPath } from '@/lib/base-path';
import { formatDate, posts } from '@/components/blog/blog-data';
import { ClipCard } from './clip-card';
import styles from './story-sections.module.css';

export function CompanyProof() {
  return <section id="company-story" className={`page-container ${styles.companyProof}`} aria-label="One company behind the products">
    <div className={styles.productFamily}><p className={styles.label}>One company behind every product here, from the apps to the models that power them.</p><div>{[
      ['JustCall', 'justcall', 'https://justcall.io/'],
      ['ServiceAgent', 'serviceagent', 'https://serviceagent.ai/'],
      ['PyAI', 'pyai', 'https://pyai.com/'],
      ['Helpwise', 'helpwise', 'https://helpwise.io/'],
    ].map(([name, mark, href]) => <a key={name} href={href}>{mark === 'pyai'
      ? <svg className={styles.productIcon} viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="3.5"/><circle cx="32" cy="32" r="13" fill="currentColor"/></svg>
      : <span className={styles.productIcon} aria-hidden="true" style={{ maskImage: `url("${assetPath(`/assets/products/${mark}-mark.svg`)}")` }}/>}<span>{name}</span></a>)}</div></div>
    <dl className={styles.proofFacts} aria-label="AtomsAI in numbers">
      <div><dt>Customers worldwide</dt><dd className="display">7,000+</dd></div>
      <div><dt>Countries served</dt><dd className="display">20+</dd></div>
      <div><dt>Conversations powered a year</dt><dd className="display">1B+</dd></div>
      <div><dt>Raised from Peak XV, Eight Roads, Base10</dt><dd className="display">~$56M</dd></div>
    </dl>
  </section>;
}

// The three newest blog posts; each whole column links to its article.
const latestPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

export function FieldNotes() {
  return <section className={`page-container ${styles.section}`} aria-labelledby="field-notes-title">
    <header className={styles.header}><div><p className={styles.label}>Insights</p><h2 id="field-notes-title" className={`display ${styles.heading}`}>Notes from the field</h2></div><ButtonLink href="/blog" variant="outline">View all notes</ButtonLink></header>
    <ul className={styles.notesGrid}>{latestPosts.map(post => <li key={post.slug}>
      <ClipCard className={styles.noteCard} href={`/blog/${post.slug}`}>
        <span className={styles.noteArt} data-clip-inset>
          <Image data-clip-zoom src={assetPath(post.artwork)} fill sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1600px) 31vw, 470px" alt="" />
        </span>
        <h3 className="display">{post.title}</h3>
        <p className={styles.noteMeta}><time dateTime={post.date}>{formatDate(post.date)}</time><span aria-hidden="true">·</span>{post.readingTime}</p>
      </ClipCard>
    </li>)}</ul>
  </section>;
}

export function PointOfView() {
  return <section className={`page-container ${styles.section} ${styles.statement}`} aria-labelledby="point-of-view-title">
    <h2 id="point-of-view-title" className={`display ${styles.statementHeadline}`}>Frontier AI is easy to get. Making it hold up is the last mile. We build for that mile, on a billion conversations a year.</h2>
    <Eyebrow href="/approach" className={styles.statementEyebrow}>Our point of view</Eyebrow>
  </section>;
}

export { TrustSummary } from './trust-summary';
