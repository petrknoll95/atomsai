import { ArrowIcon } from '@/components/arrow-icon';
import type { ReactNode } from 'react';
import type { MenuLink } from './navigation-data';
import styles from './mega-menu.module.css';
import { InfrastructureFigure, type FigureName } from './infrastructure-figure';
import { offeringIllustrations } from './offering-illustrations';

type Feature = { title: string; description: string; href: string; image?: string; mark?: string; illustration?: FigureName; theme?: 'dark' };
const artwork = (name: string) => `/assets/figma/menu-${name}.webp`;
const photo = (name: string) => `/assets/figma/industries-${name}-512.webp`;
const features: Record<string, { label: string; cards: Feature[] }> = {
  Infrastructure: { label: 'From exploration to production', cards: [
    { title: 'Models & infrastructure', description: 'Explore the platform behind your next AI application.', href: 'https://pyai.com/', illustration: offeringIllustrations.infrastructure },
    { title: 'Start in the playground', description: 'Try the technology and find what works for your use case.', href: 'https://pyai.com/playground', illustration: offeringIllustrations.applications },
    { title: 'Build with our engineers', description: 'Take a workflow from an early idea to a working system.', href: '/approach', illustration: offeringIllustrations.services },
  ] },
  Industries: { label: 'By role', cards: [
    { title: 'Operations leaders', description: 'Reduce manual handoffs with AI workflows built around your systems, processes and approval rules.', href: '/approach#step-1', image: photo('BackgroundImage3') },
    { title: 'Sales & support leaders', description: 'Connect customer conversations to follow-ups, bookings and answers, with your team in control.', href: '/capabilities/voice', image: photo('BackgroundImage2') },
    { title: 'Technology leaders', description: 'Build with our engineers in your repository. Keep the code, evaluations and runbooks to operate it.', href: '/approach#ownership-heading', image: photo('BackgroundImage') },
  ] },
  Resources: { label: 'Ideas, examples and practical next steps', cards: [
    { title: 'Customer stories', description: 'See how teams put our technology to work.', href: 'https://atomsai.com/resources/case-studies', image: '/assets/figma/stories-Media-512.webp' },
    { title: 'Explore Voice AI', description: 'Listen to a sample conversation and follow the workflow.', href: '/capabilities/voice', image: artwork('drift'), mark: 'EveryThreadToOneCentre11' },
    { title: 'How we build', description: 'From a focused first workflow to an owned, working system.', href: '/approach', image: artwork('concentric'), mark: 'RisingOffABase11' },
  ] },
  Company: { label: 'Get to know AtomsAI', cards: [
    { title: 'Our approach', description: 'Small, focused teams. Clear decisions. Systems you own.', href: '/approach' },
    { title: 'Trust Center', description: 'Explore deployment, data access and security responsibilities.', href: '/trust' },
    { title: 'Let’s talk', description: 'Bring us the workflow you want to improve.', href: '/company/contact', theme: 'dark' },
  ] },
};


export function MegaMenu({ link, children, compact = false }: { link: MenuLink; children?: ReactNode; compact?: boolean }) {
  const feature = features[link.label];
  return <div className={`theme-light ${styles.panel}`} data-mega-menu={link.label} data-compact={compact || undefined}>
    <div className={styles.inner}>
      {children ?? <div className={styles.layout}>
        <div className={styles.directory}>
          {link.label === 'Industries' && <h2 className={styles.groupLabel}>By industry</h2>}
          <div className={styles.links}>
            {link.children?.map(([label, href]) => <a key={label} href={href}><span>{label}</span><ArrowIcon size={20} /></a>)}
          </div>
          {compact && !link.children?.some(([, href]) => href === link.href) && <a className={styles.overview} href={link.href}>{link.overviewLabel ?? `All ${link.label.toLowerCase()}`}<ArrowIcon size={18} /></a>}
        </div>
        <div className={styles.features}>
          {link.label === 'Industries' && <h2 className={styles.groupLabel}>{feature.label}</h2>}
          <div className={styles.cards}>
            {feature.cards.map(card => <a className={`${styles.card} ${!card.image ? styles.surfaceCard : ''} ${card.illustration ? styles.illustratedCard : !card.image ? styles.textCard : ''} ${card.theme === 'dark' ? styles.darkCard : ''}`} href={card.href} key={card.title}>
              {(card.image || card.illustration) && <div className={styles.image}>
                {card.illustration ? <InfrastructureFigure name={card.illustration} /> : <img src={card.image} alt="" width="512" height="400" decoding="async" />}
                {card.mark && <img className={styles.mark} src={`/assets/figma/offerings-${card.mark}.svg`} alt="" width="80" height="80" />}
                {!card.illustration && <span className={styles.imageArrow}><ArrowIcon size={20} /></span>}
              </div>}
              {card.illustration && <span className={styles.imageArrow}><ArrowIcon size={20} /></span>}
              <span className={`display ${styles.title}`}>{card.title}</span>
              <span className={styles.description}>{card.description}</span>
            </a>)}
          </div>
        </div>
      </div>}
    </div>
  </div>;
}
