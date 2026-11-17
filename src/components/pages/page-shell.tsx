import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/home/site-header';
import { SiteFooter } from '@/components/home/site-footer';
import { HeadlineRevealScope } from '@/components/motion/headline-reveal-scope';
import { interiorNavigation } from './page-navigation';

/** Shared identity; each page owns its content, composition and closing action. */
export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <><SiteHeader links={interiorNavigation} /><HeadlineRevealScope id="smooth-content" className={className}><div id="top" data-theme="light">{children}</div><SiteFooter /></HeadlineRevealScope></>;
}
