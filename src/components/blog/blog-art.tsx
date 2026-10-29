import { assetPath } from '@/lib/base-path';
import Image from 'next/image';
import styles from './blog.module.css';

export function BlogArt({ artwork, priority = false, sizes = '(max-width: 700px) 100vw, 50vw' }: { artwork: string; priority?: boolean; sizes?: string }) {
  return <div className={styles.art}>
    <Image className={styles.pattern} src={assetPath(artwork)} alt="" fill sizes={sizes} priority={priority} />
  </div>;
}
