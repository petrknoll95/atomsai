'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ArrowIcon } from '@/components/arrow-icon';
import { products } from './navigation-data';
import { JustCallScene, HelpwiseScene, ServiceAgentScene, CallPageScene } from './application-scenes';
import styles from './responsive-applications.module.css';

const scenes = { JustCall: JustCallScene, Helpwise: HelpwiseScene, ServiceAgent: ServiceAgentScene, CallPage: CallPageScene };

export function ResponsiveApplications() {
  const id = useId();
  const [active, setActive] = useState<string | null>(null);
  return <div className={styles.applications}>
    <div className={styles.products}>
      {products.map((product, index) => {
        const open = active === product.name;
        const Scene = scenes[product.name];
        return <div className={styles.product} key={product.name}>
          <button className={styles.trigger} type="button" aria-expanded={open} aria-controls={`${id}-${index}`} onClick={() => setActive(open ? null : product.name)}>
            <span aria-hidden="true" className={styles.mark} style={{ maskImage: `url('/assets/products/${product.mark}')` }} />
            <span className={styles.copy}><span>{product.name}</span><span>{product.description}</span></span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d={open ? 'M4 9h10' : 'M4 9h10M9 4v10'} stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <div id={`${id}-${index}`} hidden={!open} className={styles.detail}>
            {open && <>
              <div className={`theme-dark ${styles.preview}`} data-responsive-preview={product.name} aria-hidden="true" inert>
                <div className={styles.canvas}><Scene /></div>
              </div>
              <a className={styles.explore} href={product.href}>Explore {product.name}<ArrowIcon size={18} /></a>
            </>}
          </div>
        </div>;
      })}
      <Link className={styles.all} href="/#applications" prefetch={false}>All applications<ArrowIcon size={18} /></Link>
    </div>
  </div>;
}
