import { BlogArt } from './blog-art';
import { clientPages } from '@/components/pages/client-content';
import styles from './blog.module.css';

const content = clientPages.blog;
const startingArticles = content.sections.find(section => section.id === 'start')!.blocks;
const articles = content.sections.find(section => section.id === 'all')!.blocks;
const art = ['/assets/field-notes/voice-signal.webp', '/assets/field-notes/last-mile.webp', '/assets/field-notes/conversation.webp'];

export function BlogPage() {
  return <main className={`page-container ${styles.page}`} id="main">
    <h1 className={`display ${styles.heading} ${styles.contentHeading}`} id="hero-heading">{content.title}</h1>
    <p className={styles.description}>{content.intro[0]}</p>
    <section className={styles.featured} aria-label="Featured articles">
      <div className={styles.featureSticky}>
        <article className={styles.feature}>
          <div className={styles.featureImage}><BlogArt artwork="/assets/field-notes/conversation.webp" priority sizes="(max-width: 767px) 100vw, 66vw" /></div>
          <div className={styles.featureCopy}><h2 className="display">{content.featured!.title}</h2><p className={styles.excerpt}>{content.featured!.body[0]}</p></div>
        </article>
      </div>
      <ul className={styles.latest}>
        {startingArticles.map((article, index) => <li key={article.title}><article className={styles.card}>
          <div className={styles.cardImage}><BlogArt artwork={art[index]} sizes="(max-width: 767px) 100vw, 33vw" /></div>
          <div className={styles.cardCopy}><h3 className="display">{article.title}</h3><p className={styles.excerpt}>{article.body[0]}</p></div>
        </article></li>)}
      </ul>
    </section>
    <section className={styles.archive} id="all" aria-labelledby="all-articles-title">
      <h2 className={`display ${styles.archiveHeading}`} id="all-articles-title">All notes</h2>
      <ul className={styles.articleList}>{articles.map(article => <li key={article.title}><article className={`${styles.articleRow} ${styles.noteRow}`}><h3 className="display">{article.title}</h3><p>{article.body[0]}</p></article></li>)}</ul>
    </section>
  </main>;
}
