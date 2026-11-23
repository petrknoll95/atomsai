import Link from 'next/link';
import { BlogArt } from './blog-art';
import { ArticleList } from './blog-list';
import { featuredPost, formatDate, posts } from './blog-data';
import styles from './blog.module.css';

export function BlogPage() {
  const latestPosts = posts.filter(post => post.slug !== featuredPost.slug).slice(0, 7);
  return <main className={`page-container ${styles.page}`} id="blog">
    <h1 className={`display ${styles.heading}`} id="hero-heading">Blog</h1>
    <section className={styles.featured} aria-label="Featured articles">
      <div className={styles.featureSticky}>
        <Link href={`/blog/${featuredPost.slug}`} className={styles.feature}>
          <div className={styles.featureImage}><BlogArt artwork={featuredPost.artwork} priority sizes="(max-width: 767px) 100vw, (max-width: 1599px) 66vw, 1000px" /></div>
          <div className={styles.featureCopy}>
            <h2 className="display">{featuredPost.title}</h2>
            <time dateTime={featuredPost.date}>{formatDate(featuredPost.date)}</time>
          </div>
        </Link>
      </div>
      <ul className={styles.latest}>
        {latestPosts.map(post => <li key={post.slug}>
          <Link href={`/blog/${post.slug}`} className={styles.card}>
            <div className={styles.cardImage}><BlogArt artwork={post.artwork} sizes="(max-width: 767px) 100vw, (max-width: 1599px) 33vw, 500px" /></div>
            <div className={styles.cardCopy}>
              <h3 className="display">{post.title}</h3>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </div>
          </Link>
        </li>)}
      </ul>
    </section>
    <ArticleList />
  </main>;
}
