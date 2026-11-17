import { withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ContentLinks } from '@/components/pages/content-blocks';
import { ContentClosing, ContentSectionView } from '@/components/pages/content-page';
import { clientPages } from '@/components/pages/client-content';
import styles from '@/components/pages/trust.module.css';

const content = clientPages.trust;
const section = (id: string) => content.sections.find(item => item.id === id)!;
export const metadata: Metadata = {
  title: 'Trust & Security — AtomsAI',
  description: content.intro[0],
  alternates: { canonical: 'https://atomsai.com/trust' },
};

export default function TrustPage() {
  const certifications = section('certifications');
  const controls = section('controls');
  const documents = section('documents');
  return <PageShell><main id="main" className={styles.page}>
    <section className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <div><p className={styles.kicker}><span aria-hidden="true" />{content.label}</p><h1 id="hero-heading" className={`display ${styles.title}`}>{content.title}</h1></div>
      <div className={styles.heroAside}><p>{content.intro[0]}</p><ContentLinks links={content.actions} buttons /></div>
    </section>
    <div className={`page-container ${styles.indexWrap}`}><nav className={styles.index} aria-label="On this page">{[['Certifications','#certifications'],['Controls','#controls'],['Documents','#documents'],['By product','#byproduct']].map(([label,href]) => <a href={withBasePath(href)} key={href}>{label}<span aria-hidden="true"><ArrowIcon direction="down" /></span></a>)}</nav></div>
    <section id="certifications" className={`page-container ${styles.section}`} aria-labelledby="certifications-heading">
      <div className={styles.sectionHeading}><p className={styles.kicker}>{certifications.label}</p><div><h2 id="certifications-heading" className={`display ${styles.heading}`}>{certifications.title}</h2>{certifications.intro.map(text => <p className={styles.intro} key={text}>{text}</p>)}</div></div>
      <div className={styles.evidence}>{certifications.blocks.map(block => <article className={styles.evidenceRow} key={block.title}>
        <h3 className={`display ${styles.rowTitle}`}>{block.title}</h3><div>{block.body.map(text => <p key={text}>{text}</p>)}</div>
        <a className={styles.requestArrow} href={withBasePath(block.links[0].href)} aria-label={block.links[0].label}><ArrowIcon direction="right" /></a>
      </article>)}</div>
    </section>
    <section id="controls" className={`page-container ${styles.section}`} aria-labelledby="controls-heading">
      <div className={styles.sectionHeading}><p className={styles.kicker}>{controls.label}</p><div><h2 id="controls-heading" className={`display ${styles.heading}`}>{controls.title}</h2><p className={styles.intro}>{controls.intro[0]}</p></div></div>
      <div className={styles.controls}>{controls.blocks.map(block => <article key={block.title}><h3 className={`display ${styles.controlTitle}`}>{block.title}</h3><ul className={styles.controlList}>{block.list.map(item => <li key={item}>{item}</li>)}</ul><ContentLinks links={block.links} /></article>)}</div>
    </section>
    <section id="documents" className={styles.documentsSection} aria-labelledby="documents-heading"><div className={`page-container ${styles.section} ${styles.documentGrid}`}>
      <div><p className={styles.kicker}>{documents.label}</p><h2 id="documents-heading" className={`display ${styles.heading}`}>{documents.title}</h2><p className={styles.intro}>{documents.intro[0]}</p></div>
      <ul className={styles.documents}>{documents.blocks.map(block => <li key={block.title}><a href={withBasePath(block.links[0].href)}><span className={styles.documentName}>{block.title}<small>{block.body[0]}</small></span><ArrowIcon direction="right" /></a></li>)}</ul>
    </div></section>
    <ContentSectionView section={section('byproduct')} />
    <ContentSectionView section={section('faq')} />
    <ContentClosing page={content} />
  </main></PageShell>;
}
