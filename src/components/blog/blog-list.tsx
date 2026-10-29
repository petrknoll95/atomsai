'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate, posts } from './blog-data';
import styles from './blog.module.css';

export function ArticleList() {
  const [limit, setLimit] = useState(8);
  return <section className={styles.archive} aria-labelledby="all-articles-title">
    <h2 className={`display ${styles.archiveHeading}`} id="all-articles-title">All Articles</h2>
    <ul className={styles.articleList}>
      {posts.slice(0, limit).map(post => <li key={post.slug}>
        <Link href={`/blog/${post.slug}`} className={styles.articleRow}>
          <span>{post.title}</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </Link>
      </li>)}
    </ul>
    {limit < posts.length && <button className={`button button-outline ${styles.seeMore}`} type="button" onClick={() => setLimit(current => current + 8)}>See More</button>}
  </section>;
}
