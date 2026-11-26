import type { CSSProperties, ReactNode } from 'react';
import { assetPath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import type { ContentBlock, ContentLink, ContentSection } from './client-content';
import { FeatureTabs } from './feature-tabs';
import styles from './applications.module.css';

/** The shared client-page shape, plus the fields the Applications JSON adds. One type for the whole page. */
export type ApplicationsBlock = ContentBlock & { label: string; role?: string; logo?: string };
export type ApplicationsSection = Omit<ContentSection, 'blocks' | 'stats'> & {
  blocks: ApplicationsBlock[]; descriptor?: string; emphasis?: string; footer?: { title: string; body: string[] };
  stats?: { value: string; label: string; company?: string }[];
};

const isOutbound = (href: string) => /^https?:\/\//.test(href);

/** Product name beside its mark, the mark drawn in the current text colour. */
export function ProductLockup({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`${styles.lockup} ${className}`}>
    <span className={styles.lockupMark} aria-hidden="true"
      style={{ maskImage: assetPath(`url("/assets/products/${name.toLowerCase()}-mark.svg")`) } as CSSProperties} />
    <span className={styles.lockupName}>{name}</span>
  </span>;
}

/** Line glyphs from the client prototype, one per step; the accent stroke takes the product tint. */
const glyphs: Record<string, ReactNode[]> = {
  serviceagent: [
    <><path d="M5 4H9L11 9L8.5 10.5C9.6 12.9 11.1 14.4 13.5 15.5L15 13L20 15V19C20 19.6 19.6 20 19 20C11 20 4 13 4 5C4 4.4 4.4 4 5 4Z" /><path data-accent d="M15 3h6v6M21 3l-6 6" /></>,
    <><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /><path data-accent d="M9 15l2 2 4-4" /></>,
    <><path d="M4 5h12v9H9l-4 4V5z" /><path data-accent d="M14 10h6v7h-2v3l-3-3h-1" /></>,
    <><path d="M5 4h11l3 3v13H5z" /><path d="M8 10h8M8 13h8M8 16h5" /><path data-accent d="M16 4v3h3" /></>,
    <><path d="M4 20v-6M9 20V9M14 20v-9M19 20V4" /><path data-accent d="M4 11l5-5 5 4 5-6" /></>,
  ],
  justcall: [
    <><path d="M4 12h3l2-5 3 10 3-7 2 2h3" /><path data-accent d="M20 6v12" /></>,
    <><path d="M4 12h6M10 12l6-6h4M10 12l6 6h4" /><circle data-accent cx="10" cy="12" r="1.5" /></>,
    <><path d="M4 5h9v7H8l-3 3V5z" /><path data-accent d="M11 12h9v7h-2v3l-3-3h-4" /></>,
    <><circle cx="12" cy="12" r="8" /><circle data-accent cx="12" cy="12" r="3" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2" /></>,
    <><path d="M4 20v-6M9 20V9M14 20v-9M19 20V4" /><path data-accent d="M4 11l5-5 5 4 5-6" /></>,
  ],
};

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function StepPanel({ step, index, product }: { step: ApplicationsBlock; index: number; product: string }) {
  const story = step.links[0];
  return <div className={styles.stepPanel}>
    {/* Full-width on narrow screens: the header reads dark while this panel is beneath it. */}
    <span className={styles.headerZone} data-header-theme="dark" aria-hidden="true" />
    <svg className={styles.glyph} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">{glyphs[product]?.[index]}</svg>
    <div className={styles.stepCopy}>
      <span className={styles.stepIndex}>{String(index + 1).padStart(2, '0')}</span>
      <h3 className={`display ${styles.stepTitle}`}>{step.title}</h3>
      <p className={styles.stepBody}>{step.body.join(' ')}</p>
      {step.quote && <figure className={styles.stepQuote}>
        <blockquote>{step.quote}</blockquote>
        <figcaption>
          <span className={styles.stepPerson}>{step.attribution}</span>
          <span className={styles.stepRole}>{step.role}</span>
          {step.metric && <span className={styles.stepMetric}>{step.metric}</span>}
          {story && <ButtonLink href={story.href} target="_blank" rel="noopener noreferrer" size="small" variant="ghost" className={styles.storyLink}>
            {story.label}<span className="sr-only">: {step.company} (opens in a new tab)</span><ArrowIcon direction="up-right" size={14} />
          </ButtonLink>}
        </figcaption>
      </figure>}
    </div>
  </div>;
}

function Action({ link, primary }: { link: ContentLink; primary: boolean }) {
  const outbound = isOutbound(link.href);
  return <ButtonLink href={link.href} size="large" variant={primary ? 'primary' : 'outline'}
    {...(outbound ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
    {link.label}{outbound && <span className="sr-only"> (opens in a new tab)</span>}
    <ArrowIcon direction={outbound ? 'up-right' : 'right'} size={18} />
  </ButtonLink>;
}

/** One product chapter: the customer's question, five steps on a product-tinted stage, then the way out. */
export function ApplicationsProduct({ section }: { section: ApplicationsSection }) {
  const product = section.id;
  const headingId = `${product}-heading`;
  const [lead, ...rest] = section.intro;
  return <section id={section.id} className={`page-container ${styles.product}`} aria-labelledby={headingId} data-product={product}>
    <header className={styles.productHead}>
      <p className={styles.productLabel}><ProductLockup name={section.label} /><span className={styles.labelDivider} aria-hidden="true" /><span>{section.descriptor}</span></p>
      <h2 id={headingId} className={`display ${styles.productTitle}`}>{section.title}</h2>
      <p className={styles.productLead}>{lead}</p>
      {rest.map(paragraph => <p key={paragraph} className={styles.productSub}>{paragraph}</p>)}
    </header>
    <FeatureTabs label={`What ${section.label} does`} className={styles.steps}
      stageClassName={`theme-dark ${styles.stepStage}`}
      stageProps={{ 'data-header-backdrop': '' }}
      items={section.blocks.map((step, index) => ({ id: slug(step.title), title: step.title, panel: <StepPanel step={step} index={index} product={product} /> }))} />
    <div className={`${styles.productFoot} ${section.footer ? '' : styles.productFootActionsOnly}`}>
      {section.footer && <div>
        <p className={`display ${styles.productFootTitle}`}>{section.footer.title}</p>
        {section.footer.body.map(paragraph => <p key={paragraph} className={styles.productFootBody}>{paragraph}</p>)}
      </div>}
      <div className={styles.productActions}>{section.links.map((link, index) => <Action key={link.label} link={link} primary={index === 0} />)}</div>
    </div>
  </section>;
}
