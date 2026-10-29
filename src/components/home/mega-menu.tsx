import type { ReactNode } from 'react';
import styles from './mega-menu.module.css';

type Feature = { title: string; description: string; href: string; image?: string; mark?: string };
type MenuLink = { label: string; href: string; children?: string[][]; overviewLabel?: string };
const artwork = (name: string) => `/assets/figma/menu-${name}.webp`;
const photo = (name: string) => `/assets/figma/industries-${name}-512.webp`;
const features: Record<string, { label: string; cards: Feature[] }> = {
  Infrastructure: { label: 'From exploration to production', cards: [
    { title: 'Models & infrastructure', description: 'Explore the platform behind your next AI application.', href: 'https://pyai.com/', image: artwork('concentric'), mark: 'RisingOffABase11' },
    { title: 'Start in the playground', description: 'Try the technology and find what works for your use case.', href: 'https://pyai.com/playground', image: artwork('drift'), mark: 'EveryThreadToOneCentre11' },
    { title: 'Build with our engineers', description: 'Take a workflow from an early idea to a working system.', href: '/approach', image: artwork('band'), mark: 'RaysAroundACoreOneStillMissing11' },
  ] },
  Industries: { label: 'Built around the work', cards: [
    { title: 'Healthcare', description: 'More time for people. Less time finding answers.', href: '/industries/healthcare', image: photo('BackgroundImage1') },
    { title: 'Manufacturing', description: 'Connect the supplier, the shop floor and the office.', href: 'https://atomsai.com/industries/manufacturing', image: photo('BackgroundImage') },
    { title: 'Logistics', description: 'Keep freight, documents and exceptions moving.', href: 'https://atomsai.com/industries/logistics', image: photo('BackgroundImage3') },
  ] },
  Resources: { label: 'Ideas, examples and practical next steps', cards: [
    { title: 'Customer stories', description: 'See how teams put our technology to work.', href: 'https://atomsai.com/resources/case-studies', image: '/assets/figma/stories-Media-512.webp' },
    { title: 'Explore voice AI', description: 'Listen to a sample conversation and follow the workflow.', href: '/capabilities/voice', image: artwork('drift'), mark: 'EveryThreadToOneCentre11' },
    { title: 'How we build', description: 'From a focused first workflow to an owned, working system.', href: '/approach', image: artwork('concentric'), mark: 'RisingOffABase11' },
  ] },
  Company: { label: 'Get to know AtomsAI', cards: [
    { title: 'Our approach', description: 'Small, focused teams. Clear decisions. Systems you own.', href: '/approach' },
    { title: 'Trust Center', description: 'Explore deployment, data access and security responsibilities.', href: '/trust' },
    { title: 'Let’s talk', description: 'Bring us the workflow you want to improve.', href: '/company/contact' },
  ] },
};

export function MenuArrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function MegaMenu({ link, children }: { link: MenuLink; children?: ReactNode }) {
  const feature = features[link.label];
  return <div className={`theme-light ${styles.panel}`} data-mega-menu={link.label}>
    <div className={styles.inner}>
      {children ?? <div className={styles.layout}>
        <div className={styles.directory}>
          <div className={styles.links}>
            {link.children?.map(([label, href]) => <a key={label} href={href}><span>{label}</span><MenuArrow /></a>)}
          </div>
        </div>
        <div className={styles.features}>
          <div className={styles.cards}>
            {feature.cards.map(card => <a className={`${styles.card} ${!card.image ? styles.textCard : ''}`} href={card.href} key={card.title}>
              {card.image && <div className={styles.image}>
                <img src={card.image} alt="" width="512" height="400" decoding="async" />
                {card.mark && <img className={styles.mark} src={`/assets/figma/offerings-${card.mark}.svg`} alt="" width="80" height="80" />}
                <span className={styles.imageArrow}><MenuArrow /></span>
              </div>}
              <span className={`display ${styles.title}`}>{card.title}</span>
              <span className={styles.description}>{card.description}</span>
            </a>)}
          </div>
        </div>
      </div>}
    </div>
  </div>;
}
