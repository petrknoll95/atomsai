import { assetPath, withBasePath } from '@/lib/base-path';
import Link from 'next/link';
import { ArrowIcon } from '@/components/arrow-icon';
import { applicationsPath, productNavHref, products } from './navigation-data';
import styles from './responsive-applications.module.css';

export function ResponsiveApplications({ overviewHref = applicationsPath }: { overviewHref?: string }) {
  return <div className={styles.applications}>
    <ul className={styles.products}>
      {products.map(product => <li key={product.name}>
        <a className={styles.product} href={withBasePath(productNavHref(product))}>
          <span aria-hidden="true" className={styles.mark} style={{ maskImage: assetPath(`url('/assets/products/${product.mark}')`) }} />
          <span className={styles.copy}><span>{product.name}</span><span>{product.description}</span></span>
          <ArrowIcon size={18} />
        </a>
      </li>)}
    </ul>
    <Link className={styles.all} href={overviewHref} prefetch={false}>All applications<ArrowIcon size={18} /></Link>
  </div>;
}
