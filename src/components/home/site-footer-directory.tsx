import { withBasePath } from '@/lib/base-path';
import { AnimatedLogo } from '@/components/animated-logo';
import Link from 'next/link';
import { siteHref } from '@/lib/site-links';
import { ButtonLink } from '../ui';
import { products } from './navigation-data';
import { FooterSlitFade } from './footer-slit-fade';
import styles from './site-footer-directory.module.css';

const groups = [
  { title: 'Applications', links: [
    { label: 'All applications', path: '#applications' },
    ...products.map(({ name, href }) => ({ label: name, path: href })),
    { label: 'Models & infrastructure', path: 'https://pyai.com/' },
    { label: 'Try the playground', path: 'https://pyai.com/playground' },
  ] },
  { title: 'Solutions', links: [
    { label: 'AI services', path: '/approach' },
    { label: 'Voice AI', path: '/capabilities/voice' },
    { label: 'Chat', path: '/capabilities/chat' },
    { label: 'Custom agents', path: '/agents' },
    { label: 'Healthcare', path: '/industries/healthcare' },
    { label: 'Home services', path: '#industry-home-services' },
    { label: 'Financial services', path: '#industry-financial-services' },
    { label: 'Education', path: '#industry-education' },
  ] },
  { title: 'Company', links: [
    { label: 'About AtomsAI', path: '/company/about' },
    { label: 'Our approach', path: '/approach' },
    { label: 'Careers', path: '/company/careers' },
    { label: 'Contact us', path: '/company/contact' },
    { label: 'Trust Center', path: '/trust' },
    { label: 'Brand', path: '/brand' },
  ] },
  { title: 'Resources', links: [
    { label: 'Blog', path: '/blog' },
    { label: 'Customer stories', path: '#customer-stories' },
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
    { label: 'Explore products', path: '#applications' },
    { label: 'JustCall', path: 'https://justcall.io/' },
    { label: 'ServiceAgent', path: 'https://serviceagent.ai/' },
    { label: 'Helpwise', path: 'https://helpwise.io/' },
    { label: 'PyAI', path: 'https://pyai.com/' },
    { label: 'Models & infrastructure', path: '#offerings' },
    { label: 'Try the playground', path: 'https://pyai.com/playground' },
  ] },
  { title: 'Solutions', links: [
    { label: 'Custom AI engineering', path: '/approach' },
    { label: 'Orchestration & workflows', path: '#offerings' },
    { label: 'Voice AI', path: '/capabilities/voice' },
    { label: 'Chat', path: '/capabilities/chat' },
    { label: 'Custom agents', path: '/agents' },
    { label: 'Home services', path: '#industry-home-services' },
    { label: 'Healthcare', path: '/industries/healthcare' },
    { label: 'Financial services', path: '#industry-financial-services' },
    { label: 'Education', path: '#industry-education' },
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

/** Current footer, shared by every site page through SiteFooter. */
export function SiteFooterDirectory({ homepage = false }: { homepage?: boolean }) {
  return <footer className={`theme-dark ${styles.footer}`} data-theme="dark" data-footer-variant="directory">
    <div className={`page-container ${styles.container}`}>
      <section className={styles.cta} aria-labelledby="footer-directory-heading">
        <h2 id="footer-directory-heading" className={`display ${styles.heading}`}>{homepage ? 'The next build starts with your business' : 'Put AI to work in your business.'}</h2>
        <div className={styles.ctaAside}>
          {homepage && <p className={styles.ctaDescription}>Whether there’s a product for it or something new to build, we start with what you need to achieve.</p>}
          <ButtonLink href="/company/contact" className={styles.ctaButton}>Talk to AtomsAI</ButtonLink>
        </div>
      </section>
      <div className={styles.directory}>
        <Link href="/#top" prefetch={false} className={styles.logo} aria-label="AtomsAI — back to top"><AnimatedLogo playOnHover /></Link>
        <nav className={styles.navigation} aria-label="Footer">
          {(homepage ? homepageGroups : groups).map(({ title, links }) => <div className={styles.group} key={title}>
            <h3>{title}</h3>
            <ul>{links.map(({ label, path }) => <li key={label}><a href={withBasePath(siteHref(path))}>{label}<span className={styles.arrow} aria-hidden="true">→</span></a></li>)}</ul>
          </div>)}
        </nav>
        <p className={styles.copyright}>{homepage && <span className={styles.tagline}>Frontier AI, engineered for the way your business works.</span>}{homepage ? '© 2026 AtomsAI. SaaS Labs is now AtomsAI.' : '© 2026 AtomsAI, a brand of SaaS Labs US, Inc.'}</p>
      </div>
    </div>
    <FooterSlitFade />
  </footer>;
}
