import Link from 'next/link';
import { BlogArt } from './blog-art';
import { BlogStories, type Story } from './blog-stories';
import { posts } from './blog-data';
import { clientPages } from '@/components/pages/client-content';
import styles from './blog.module.css';

const content = clientPages.blog;

// The index lists the published articles, newest first, so every story opens its /blog/[slug] page.
const [featured, ...rest] = [...posts].sort((a, b) => b.date.localeCompare(a.date));
const stories: Story[] = rest.map(post => ({
  title: post.title, excerpt: post.excerpt, category: post.category, artwork: post.artwork, href: `/blog/${post.slug}`,
}));

export function BlogPage() {
  return <main className={`page-container ${styles.page}`} id="main">
    <header className={styles.intro}>
      <h1 className={`display ${styles.heading}`} id="hero-heading">{content.title}</h1>
      <p className={styles.description}>{content.intro[0]}</p>
    </header>

    <article className={styles.featured} aria-labelledby="featured-title">
      <div className={styles.featuredCopy}>
        <p className={styles.eyebrowText}>Featured</p>
        <div className={styles.featuredText}>
          <p className={styles.meta}>{featured.category}</p>
          <h2 className={`display ${styles.featuredTitle}`} id="featured-title">
            <Link className={styles.storyLink} href={`/blog/${featured.slug}`}>{featured.title}</Link>
          </h2>
          <p className={styles.excerpt}>{featured.excerpt}</p>
        </div>
      </div>
      <div className={styles.featuredImage}><BlogArt artwork={featured.artwork} priority sizes="(max-width: 767px) 100vw, 66vw" /></div>
    </article>

    <BlogStories stories={stories} />
  </main>;
}
