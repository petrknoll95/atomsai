import publishedPosts from '@/content/blog/posts.json';
import editorialArtwork from '@/content/blog/editorial-artwork.json';

export type Category = 'Insights' | 'Technical';
export type BlogPost = {
  slug: string;
  title: string;
  category: Category;
  date: string;
  excerpt: string;
  artwork: string;
  artworkAlt: string;
  author: string;
  tags: string[];
  readingTime: string;
  sourceUrl: string;
};

export const posts: BlogPost[] = publishedPosts.map(post => ({
  ...post,
  artwork: editorialArtwork[post.slug as keyof typeof editorialArtwork] ?? post.artwork,
  category: post.category === 'Technical' ? 'Technical' : 'Insights',
}));
export const featuredPost = posts[0];

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
