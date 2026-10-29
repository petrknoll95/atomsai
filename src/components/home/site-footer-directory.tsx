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
    { label: 'Insurance', path: '/industries/insurance' },
    { label: 'Credit & lending', path: '/industries/lending' },
    { label: 'Logistics', path: '/industries/logistics' },
    { label: 'Retail & commerce', path: '/industries/retail' },
    { label: 'Manufacturing', path: '/industries/manufacturing' },
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
    { label: 'Customer stories', path: '/resources/case-studies' },
    { label: 'Help center', path: '#faq' },
    { label: 'Website updates', path: '/changelog' },
  ] },
  { title: 'Legal', links: [
    { label: 'Terms of Service', path: '/legal/terms' },
    { label: 'Privacy Policy', path: '/legal/privacy' },
  ] },
];

/** Current footer, shared by every site page through SiteFooter. */
export function SiteFooterDirectory() {
  return <footer className={`theme-dark ${styles.footer}`} data-theme="dark" data-footer-variant="directory">
    <div className={`page-container ${styles.container}`}>
      <section className={styles.cta} aria-labelledby="footer-directory-heading">
        <h2 id="footer-directory-heading" className={`display ${styles.heading}`}>Put AI to work in your business.</h2>
        <ButtonLink href="/company/contact" className={styles.ctaButton}>Talk to AtomsAI</ButtonLink>
      </section>
      <div className={styles.directory}>
        <Link href="/#top" prefetch={false} className={styles.logo} aria-label="AtomsAI — back to top"><AnimatedLogo playOnHover /></Link>
        <nav className={styles.navigation} aria-label="Footer">
          {groups.map(({ title, links }) => <div className={styles.group} key={title}>
            <h3>{title}</h3>
            <ul>{links.map(({ label, path }) => <li key={label}><a href={withBasePath(siteHref(path))}>{label}<span className={styles.arrow} aria-hidden="true">→</span></a></li>)}</ul>
          </div>)}
        </nav>
        <p className={styles.copyright}>© 2026 AtomsAI, a brand of SaaS Labs US, Inc.</p>
      </div>
    </div>
    <FooterSlitFade />
  </footer>;
}
