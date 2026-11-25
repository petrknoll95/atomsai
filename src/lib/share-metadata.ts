import type { Metadata } from 'next';
import { withBasePath } from './base-path';

const origin = process.env.SITE_ORIGIN || 'https://atomsai.com';
const publicUrl = (path: string) => new URL(withBasePath(path), origin).href;

type SharePage = {
  path: string;
  title: string;
  description: string;
  article?: { artwork: string; artworkAlt: string; date: string; author: string };
};

export function shareMetadata({ path, title, description, article }: SharePage): Metadata {
  const image = article ? {
    url: publicUrl(article.artwork),
    alt: article.artworkAlt || `Cover artwork for ${title}`,
  } : {
    url: publicUrl('/assets/brand/atomsai-share.jpg'),
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'AtomsAI — AI that works today. Built to get better tomorrow.',
  };
  return {
    title,
    description,
    alternates: { canonical: new URL(path, 'https://atomsai.com').href },
    openGraph: {
      title, description, url: publicUrl(path), siteName: 'AtomsAI', locale: 'en_US',
      images: [image],
      ...(article
        ? { type: 'article', publishedTime: article.date, authors: [article.author] }
        : { type: 'website' }),
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
