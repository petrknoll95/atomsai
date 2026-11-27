import type { CSSProperties } from 'react';
import { assetPath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import type { ContentBlock, ContentLink, ContentSection } from './client-content';
import { ScenePanel } from './scene-panel';
import { SectionIntro } from './section-intro';
import { productScenes } from './applications-scenes';
import lockupStyles from './applications.module.css';
import styles from './applications-product.module.css';

/** The shared client-page shape, plus the fields the Applications JSON adds. One type for the whole page. */
export type ApplicationsBlock = ContentBlock & { label: string; role?: string; logo?: string };
export type ApplicationsSection = Omit<ContentSection, 'blocks' | 'stats'> & {
  blocks: ApplicationsBlock[]; descriptor?: string; footer?: { title: string; body: string[] };
  stats?: { value: string; label: string; company?: string }[];
};

const isOutbound = (href: string) => /^https?:\/\//.test(href);
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sentence = (text: string) => /[.!?]$/.test(text) ? text : `${text}.`;

/** Product name beside its mark, the mark drawn in the current text colour. */
export function ProductLockup({ name, id, className = '' }: { name: string; id?: string; className?: string }) {
  return <span id={id} className={`${lockupStyles.lockup} ${className}`}>
    <span className={lockupStyles.lockupMark} aria-hidden="true"
      style={{ maskImage: assetPath(`url("/assets/products/${name.toLowerCase()}-mark.svg")`) } as CSSProperties} />
    <span>{name}</span>
  </span>;
}

/** One full-size button out to the product (the homepage's medium primary), one quiet arrow link to the homepage demo. */
function Actions({ links }: { links: ContentLink[] }) {
  return <>{links.map((link, index) => {
    const outbound = isOutbound(link.href);
    return <ButtonLink key={link.label} href={link.href} size={index === 0 ? 'medium' : 'small'} variant={index === 0 ? 'primary' : 'ghost'}
      className={`${styles.action} ${index === 0 ? '' : styles.quietAction}`}
      {...(outbound ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {link.label}{outbound && <span className="sr-only"> (opens in a new tab)</span>}
      <ArrowIcon direction={outbound ? 'up-right' : 'right'} size={index === 0 ? 16 : 14} />
    </ButtonLink>;
  })}</>;
}

/** A step's body, and for JustCall the customer who lives it: quote, name and role, result, story. */
function StepDetail({ step }: { step: ApplicationsBlock }) {
  const story = step.links[0];
  return <>
    {step.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {step.quote && <figure className={styles.quote}>
      <blockquote>{step.quote}</blockquote>
      <figcaption>{step.attribution}{step.role && <> · {step.role}</>}</figcaption>
    </figure>}
    {step.metric && <p className={styles.metric}>{step.metric}</p>}
    {story && <ButtonLink href={story.href} target="_blank" rel="noopener noreferrer" size="small" variant="ghost" className={styles.action}>
      {story.label}<span className="sr-only">: {step.company} (opens in a new tab)</span><ArrowIcon direction="up-right" size={14} />
    </ButtonLink>}
  </>;
}

/** ServiceAgent's closing note on the trade, under the steps in the panel. */
function TradeNote({ footer, className }: { footer: { title: string; body: string[] }; className: string }) {
  return <div className={className}>
    <p className={styles.noteTitle}>{footer.title}</p>
    {footer.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
  </div>;
}

/**
 * One product chapter: the product, the customer’s question, what it does, then each step beside its scene.
 * The region is named by both the product and the question, so landmarks tell the chapters apart.
 */
export function ApplicationsProduct({ section }: { section: ApplicationsSection }) {
  const product = section.id;
  const headingId = `${product}-heading`;
  const lockupId = `${product}-lockup`;
  const scenes = productScenes[product] ?? [];
  // ServiceAgent's descriptor repeats its second paragraph; JustCall's opens the paragraph.
  const lead = [...(product === 'justcall' && section.descriptor ? [sentence(section.descriptor)] : []), ...section.intro].join(' ');
  return <section id={section.id} className={`page-container ${styles.chapter}`} aria-labelledby={`${lockupId} ${headingId}`} data-product={product}>
    <div className={styles.head}>
      <ProductLockup id={lockupId} name={section.label} className={styles.lockup} />
      <SectionIntro id={headingId} title={section.title} lead={lead} action={<Actions links={section.links} />} className={styles.intro} />
    </div>
    <ScenePanel label={`${section.label} steps`} visualClassName={styles.visual}
      items={section.blocks.map((step, index) => ({
        id: slug(step.title), title: step.title, detail: <StepDetail step={step} />, scene: scenes[index],
      }))}
      aside={section.footer && <TradeNote footer={section.footer} className={styles.aside} />} />
  </section>;
}
