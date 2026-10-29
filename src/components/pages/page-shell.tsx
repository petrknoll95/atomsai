import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/home/site-header';
import { SiteFooter } from '@/components/home/site-footer';
import styles from './page-shell.module.css';

/** Shared identity; each page owns its content, composition and closing action. */
export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <><SiteHeader /><div id="smooth-content" className={className}><div id="top" data-theme="light">{children}</div><div className={styles.footer} data-theme="dark"><SiteFooter /></div></div></>;
}
