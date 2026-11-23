import type { Metadata } from 'next';
import { blogArtSource } from '@/components/blog/blog-art';
import { posts } from '@/components/blog/blog-data';
import { assetPath } from '@/lib/base-path';
import { Playground } from './playground';

export const metadata: Metadata = {
  title: 'Blog art playground | AtomsAI',
  robots: { index: false, follow: false },
};

const covers = posts.map(({ slug, title, artwork }) => ({
  slug,
  title,
  src: assetPath(blogArtSource(artwork).src),
}));

export default function BlogArtPlaygroundPage() {
  return <Playground covers={covers} />;
}
