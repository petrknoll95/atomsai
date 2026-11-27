import type { ReactNode } from 'react';
import { withBasePath } from '@/lib/base-path';
import { AnimatedLogo } from '@/components/animated-logo';
import Link from 'next/link';
import { siteHref } from '@/lib/site-links';
import { ButtonLink } from '../ui';
import { applicationsPath, infrastructurePath, productNavHref, products, useCaseLinks } from './navigation-data';
import { FooterSlitFade } from './footer-slit-fade';
import { FooterMarkHalf } from './footer-mark-half';
import styles from './site-footer-directory.module.css';

const groups = [
  { title: 'Applications', links: [
    { label: 'All applications', path: applicationsPath },
    ...products.map(product => ({ label: product.name, path: productNavHref(product) })),
    { label: 'Models & infrastructure', path: infrastructurePath },
    { label: 'Try the playground', path: 'https://pyai.com/playground' },
  ] },
  { title: 'Solutions', links: [
    { label: 'AI services', path: '/approach' },
    { label: 'Voice AI', path: '/capabilities/voice' },
    { label: 'Chat', path: '/capabilities/chat' },
    { label: 'Custom agents', path: '/agents' },
    ...useCaseLinks.map(([label, path]) => ({ label, path })),
  ] },
  { title: 'Company', links: [
    { label: 'About AtomsAI', path: '/company/about' },
    { label: 'Our approach', path: '/approach' },
    { label: 'Careers', path: '/company/careers' },
    { label: 'Contact us', path: '/company/contact' },
    { label: 'Trust Center', path: '/trust' },
    { label: 'Press & media', path: '/company/press' },
    { label: 'Brand', path: '/brand' },
  ] },
  { title: 'Resources', links: [
    { label: 'Blog', path: '/blog' },
    { label: 'Customer stories', path: '#customer-stories' },
    { label: 'Testimonials', path: '/customers/testimonials' },
    { label: 'Help center', path: '#faq' },
    { label: 'Website updates', path: '/changelog' },
  ] },
  { title: 'Legal', links: [
    { label: 'Terms of Service', path: '/legal/terms' },
    { label: 'Privacy Policy', path: '/legal/privacy' },
  ] },
];

// Keep the original directory columns; fit the client wording into their slots.
const homepageGroups = [
  { title: 'Applications', links: [
    { label: 'Explore products', path: applicationsPath },
    ...(['JustCall', 'ServiceAgent', 'Helpwise'] as const).map(name => ({ label: name, path: productNavHref(products.find(product => product.name === name)!) })),
    { label: 'PyAI', path: infrastructurePath },
    { label: 'Models & infrastructure', path: infrastructurePath },
    { label: 'Try the playground', path: 'https://pyai.com/playground' },
  ] },
  { title: 'Solutions', links: [
    { label: 'Custom AI engineering', path: '/approach' },
    { label: 'Orchestration & workflows', path: '#offerings' },
    { label: 'Voice AI', path: '/capabilities/voice' },
    { label: 'Chat', path: '/capabilities/chat' },
    { label: 'Custom agents', path: '/agents' },
    ...useCaseLinks.map(([label, path]) => ({ label, path })),
  ] },
  { title: 'Company', links: [
    { label: 'About', path: '/company/about' },
    { label: 'Our approach', path: '/approach' },
    { label: 'Careers', path: '/company/careers' },
    { label: 'Contact', path: '/company/contact' },
    { label: 'Trust Center', path: '/trust' },
    { label: 'Brand', path: '/brand' },
  ] },
  { title: 'Resources', links: [
    { label: 'Notes from the field', path: '/blog' },
    { label: 'Customer stories', path: '#customer-stories' },
    { label: 'Help center', path: '#faq' },
    { label: 'Website updates', path: '/changelog' },
  ] },
  { title: 'Legal', links: [
    { label: 'Privacy', path: '/legal/privacy' },
    { label: 'Terms', path: '/legal/terms' },
    { label: 'Security', path: '/trust' },
  ] },
];

/** A page's own closing line and actions for the dark CTA band, in place of the site-wide one. */
export type FooterCta = { heading: ReactNode; actions: ReactNode };

/** The muted second clause of the CTA heading. */
export function FooterCtaMuted({ children }: { children: ReactNode }) {
  return <span className={styles.headingMuted}>{children}</span>;
}

/** Current footer, shared by every site page through SiteFooter. */
export function SiteFooterDirectory({ homepage = false, cta }: { homepage?: boolean; cta?: FooterCta }) {
  const interiorPaths: Record<string, string> = { '/company/about': '/company/about', '/company/careers': '/company/careers', '/company/press': '/company/press', '#customer-stories': '/customers/success-stories', '/customers/testimonials': '/customers/testimonials', '#faq': '/help' };
  return <footer className={`theme-dark ${styles.footer}`} data-theme="dark" data-footer-variant="directory">
    <section className={styles.cta} aria-labelledby="footer-directory-heading">
      <FooterMarkHalf side="start" className={styles.ctaSide} />
      <div className={styles.ctaPanel}>
        <h2 id="footer-directory-heading" className={`display ${styles.heading}`}>{cta ? cta.heading : homepage
          ? <>The next build starts <span className={styles.headingMuted}>with your business.</span></>
          : <>Put AI to work <span className={styles.headingMuted}>in your business.</span></>}</h2>
        <div className={styles.ctaActions}>
          {cta ? cta.actions : <>
            <ButtonLink href="/company/contact" size="large">Talk to AtomsAI</ButtonLink>
            <ButtonLink href={applicationsPath} size="large" variant="outline">Explore applications</ButtonLink>
          </>}
        </div>
      </div>
      <FooterMarkHalf side="end" className={styles.ctaSide} />
    </section>
    <div className={`page-container ${styles.container}`}>
      <div className={styles.directory}>
        <Link href="/#top" prefetch={false} className={styles.logo} aria-label="AtomsAI — back to top"><AnimatedLogo playOnHover /></Link>
        <nav className={styles.navigation} aria-label="Footer">
          {(homepage ? homepageGroups : groups).map(({ title, links }) => <div className={styles.group} key={title}>
            <h3>{title}</h3>
            <ul>{links.map(({ label, path }) => <li key={label}><a href={withBasePath(!homepage && interiorPaths[path] ? interiorPaths[path] : siteHref(path))}>{label}<span className={styles.arrow} aria-hidden="true">→</span></a></li>)}</ul>
          </div>)}
        </nav>
        <p className={styles.copyright}>{homepage && <span className={styles.tagline}>Frontier AI, engineered for the way your business works.</span>}{homepage ? '© 2026 AtomsAI. SaaS\u00A0Labs is now AtomsAI.' : '© 2026 AtomsAI, a brand of SaaS\u00A0Labs US, Inc.'}</p>
      </div>
    </div>
    <FooterSlitFade />
  </footer>;
}
