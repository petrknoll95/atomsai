import type { Metadata } from 'next';
import { posts } from '@/components/blog/blog-data';
import { Playground } from './playground';

export const metadata: Metadata = {
  title: 'Blog art playground | AtomsAI',
  robots: { index: false, follow: false },
};

const articles = posts.map(({ slug, title }) => ({ slug, title }));

export default function BlogArtPlaygroundPage() {
  return <Playground articles={articles} />;
}
