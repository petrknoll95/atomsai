import { assetPath } from '@/lib/base-path';
import Image from 'next/image';
import styles from './blog.module.css';

// Illustrated covers ship as sharp SVGs; the .webp is only a fallback/OG raster.
// Shared with the homepage so both always show the same, current artwork.
export function blogArtSource(artwork: string) {
  const isIllustration = artwork.startsWith('/assets/blog/illustrations/');
  return { isIllustration, src: isIllustration ? artwork.replace(/\.webp$/, '.svg') : artwork };
}

export function BlogArt({ artwork, priority = false, sizes = '(max-width: 700px) 100vw, 50vw' }: { artwork: string; priority?: boolean; sizes?: string }) {
  const { isIllustration, src: source } = blogArtSource(artwork);
  return <div className={styles.art} data-illustration={isIllustration || undefined}>
    <Image className={styles.pattern} src={assetPath(source)} alt="" fill sizes={sizes} preload={priority} unoptimized={isIllustration} />
  </div>;
}
