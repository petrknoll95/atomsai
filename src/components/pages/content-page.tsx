import { ContentCard, ContentLinks, ContentRow } from './content-blocks';
import { CodeExamples, ContentCatalog } from './content-catalog';
import { clientPages, type ContentPage, type ContentSection } from './client-content';
import styles from './content-page.module.css';

export function ContentSectionView({ section }: { section: ContentSection }) {
  const dark = section.kind === 'dark';
  return <section id={section.id} data-theme={dark ? 'dark' : 'light'} className={`${styles.section} ${dark ? `theme-dark ${styles.dark}` : ''} ${section.kind === 'statement' ? styles.statement : ''}`} aria-labelledby={section.title ? `${section.id}-heading` : undefined}>
    <div className="page-container">
      {(section.title || section.label || section.intro.length > 0) && <header className={styles.sectionHead}>
        <p className={styles.kicker}>{section.label}</p>
        <div>{section.title && <h2 id={`${section.id}-heading`} className={`display ${styles.sectionTitle}`}>{section.title}</h2>}
          {section.intro.map((text, i) => <p className={styles.intro} key={i}>{text}</p>)}
        </div>
      </header>}
      {!!section.stats?.length && <dl className={`${styles.stats} ${styles.sectionStats}`}>{section.stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd className="display">{stat.value}</dd></div>)}</dl>}
      {section.kind === 'catalog' ? <ContentCatalog blocks={section.blocks} />
        : section.kind === 'faq' ? <div className={styles.faq}>{section.blocks.map(block => <details key={block.title}><summary>{block.title}<span aria-hidden="true">+</span></summary><div>{block.body.map((text, i) => <p key={i}>{text}</p>)}<ContentLinks links={block.links} /></div></details>)}</div>
          : section.kind === 'code' ? <div className={styles.codeLayout}><ul className={styles.bullets}>{section.items?.map(text => <li key={text}>{text}</li>)}</ul>{section.examples && <CodeExamples examples={section.examples} />}</div>
            : section.kind === 'rows' ? <div className={styles.rows}>{section.blocks.map((block, i) => <ContentRow key={`${block.title}-${i}`} block={block} />)}</div>
              : !!section.blocks.length && <div className={styles.grid} data-count={section.blocks.length}>{section.blocks.map((block, i) => <ContentCard key={`${block.title}-${i}`} block={block} />)}</div>}
      <ContentLinks links={section.links} />
    </div>
  </section>;
}

export function ContentClosing({ page }: { page: ContentPage }) {
  if (!page.closing.title) return null;
  return <section className={`page-container ${styles.closing}`} aria-labelledby="closing-heading"><div className={styles.closingInner}>
    <h2 id="closing-heading" className={`display ${styles.sectionTitle}`}>{page.closing.title}</h2>
    <div>{page.closing.body.map((text, i) => <p className={styles.intro} key={i}>{text}</p>)}<ContentLinks links={page.closing.links} buttons /></div>
  </div></section>;
}

export function ClientContentPage({ name }: { name: string }) {
  const page = clientPages[name];
  const helpTopics = name === 'help' ? page.sections.filter(s => s.id === 'products' || s.id === 'security').flatMap(s => s.blocks) : [];
  return <main id="main" className={styles.page}>
    <section className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <p className={styles.kicker}><span className={styles.dot} />{page.label}</p>
      <div className={styles.heroGrid}><h1 className={`display ${styles.title}`} id="hero-heading">{page.title}</h1>
        <div className={styles.heroAside}>{page.intro.map((text, i) => <p key={i}>{text}</p>)}<ContentLinks links={page.actions} buttons /></div>
      </div>
      {!!page.stats?.length && <dl className={styles.stats}>{page.stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd className="display">{stat.value}</dd></div>)}</dl>}
    </section>
    {name === 'help' && <section className={`page-container ${styles.helpSearch}`} aria-label="Search help"><ContentCatalog blocks={helpTopics} searchable searchOnly /></section>}
    {page.sections.map(section => <ContentSectionView key={section.id} section={section} />)}
    <ContentClosing page={page} />
  </main>;
}
