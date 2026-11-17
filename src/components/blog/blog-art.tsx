import { assetPath } from '@/lib/base-path';
import Image from 'next/image';
import styles from './blog.module.css';

export function BlogArt({ artwork, priority = false, sizes = '(max-width: 700px) 100vw, 50vw' }: { artwork: string; priority?: boolean; sizes?: string }) {
  const isIllustration = artwork.startsWith('/assets/blog/illustrations/');
  const source = isIllustration ? artwork.replace(/\.webp$/, '.svg') : artwork;
  return <div className={styles.art} data-illustration={isIllustration || undefined}>
    <Image className={styles.pattern} src={assetPath(source)} alt="" fill sizes={sizes} preload={priority} unoptimized={isIllustration} />
  </div>;
}
