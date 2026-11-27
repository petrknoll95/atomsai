import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/home/site-header';
import { SiteFooter } from '@/components/home/site-footer';
import { HeadlineRevealScope } from '@/components/motion/headline-reveal-scope';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { interiorNavigation } from './page-navigation';

/** Shared identity and the site-wide smooth scroll; each page owns its content, composition and closing action. */
export function PageShell({ children, className = '', initialTheme = 'light' }: { children: ReactNode; className?: string; initialTheme?: 'light' | 'dark' }) {
  return <><SiteHeader links={interiorNavigation} initialTheme={initialTheme} /><SmoothScroll><HeadlineRevealScope className={className}><div id="top" data-theme="light">{children}</div><SiteFooter /></HeadlineRevealScope></SmoothScroll></>;
}
