import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/pages/page-shell';
import { BlogArt } from '@/components/blog/blog-art';
import articleBodies from '@/content/blog/bodies.json';
import { posts } from '@/components/blog/blog-data';
import styles from '@/components/blog/article.module.css';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return posts.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find(item => item.slug === slug);
  return post ? { title: `${post.title} | AtomsAI`, description: post.excerpt, alternates: { canonical: `https://atomsai.com/blog/${post.slug}` }, openGraph: { title: post.title, description: post.excerpt, type: 'article', publishedTime: post.date, authors: [post.author], images: [{ url: `https://atomsai.com${post.artwork}` }] } } : {};
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find(item => item.slug === slug);
  if (!post) notFound();
  const otherPosts = posts.filter(item => item.slug !== post.slug);
  const nextPosts = [
    ...otherPosts.filter(item => item.category === post.category),
    ...otherPosts.filter(item => item.category !== post.category),
  ].slice(0, 3);
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${post.date}T12:00:00Z`));

  return <PageShell><main className={`page-container ${styles.page}`}>
    <article className={styles.article}>
      <header className={styles.header}>
        <Link href="/blog" className={styles.category}>{post.category}</Link>
        <h1 className="display">{post.title}</h1>
        <div className={styles.byline}><span>by {post.author}</span><span className={styles.separator} aria-hidden="true">•</span><time dateTime={post.date}>{date}</time></div>
      </header>
      {/* The checked-in importer allowlists markup and strips source scripts/styles. */}
      <div className={styles.body} dangerouslySetInnerHTML={{ __html: articleBodies[post.slug as keyof typeof articleBodies] }} />
    </article>
    <section className={styles.nextUp} aria-labelledby="next-up-title">
      <h2 className="display" id="next-up-title">Next Up</h2>
      <div className={styles.nextGrid}>{nextPosts.map(nextPost => <Link key={nextPost.slug} href={`/blog/${nextPost.slug}`} className={styles.nextCard}>
        <div className={styles.nextImage}><BlogArt artwork={nextPost.artwork} /></div>
        <h3 className="display">{nextPost.title}</h3>
      </Link>)}</div>
    </section>
  </main></PageShell>;
}
