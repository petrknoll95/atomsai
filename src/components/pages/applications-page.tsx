import type { ReactNode } from 'react';
import { markBounds, slitBlades, slitClip } from '@/lib/slit-logo';
import { assetPath, withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import content from '@/content/client-pages/applications.json';
import { ApplicationsHeroStage } from './applications-hero-stage';
import { ApplicationsProduct, ProductLockup, type ApplicationsSection } from './applications-product';
import { ApplicationsStatement } from './applications-statement';
import { SectionIntro } from './section-intro';
import styles from './applications.module.css';

const sections: ApplicationsSection[] = content.sections;
const section = (id: string) => sections.find(item => item.id === id)!;
const next = section('next');
const proof = section('proof');
const engineering = section('engineering');
const { hero, closing } = content;

/** Splits "3×" or "80%" into the figure and its unit, so the unit can sit smaller beside it. */
const figure = (value: string) => value.match(/^([\d.,]+)(.*)$/)?.slice(1) ?? [value, ''];

/** The still AtomsAI mark, from the same slit geometry as the animated logo. */
function Mark({ className }: { className: string }) {
  const bounds = markBounds();
  return <svg className={className} viewBox={[bounds.x, bounds.y, bounds.width, bounds.height].join(' ')} fill="currentColor" aria-hidden="true" focusable="false">
    <defs>{slitBlades().map((blade, index) => <clipPath key={index} id={`applications-mark-${index}`} clipPathUnits="userSpaceOnUse">
      <rect x={blade.x} y={slitClip.y} width={blade.w} height={slitClip.height} />
    </clipPath>)}</defs>
    {slitBlades().map((blade, index) => <circle key={index} cx={blade.cx} cy="50" r={blade.r} clipPath={`url(#applications-mark-${index})`} />)}
  </svg>;
}

function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`${styles.kicker} ${className}`}><span className={styles.dot} aria-hidden="true" />{children}</p>;
}

export function ApplicationsPage() {
  return <main id="main" className={styles.page} data-theme="light">
    <section id="hero" className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <header className={styles.heroIntro}>
        <h1 id="hero-heading" className={`display ${styles.heroTitle}`}><span>{content.title}</span> <span className={styles.heroMuted}>{content.intro[0]}</span></h1>
        <p className={styles.heroLead}>{content.intro[1]}</p>
        <ButtonLink href={content.actions[0].href} className={styles.heroAction}>{content.actions[0].label}<ArrowIcon direction="down" size={16} /></ButtonLink>
      </header>
      <ApplicationsHeroStage events={hero.events} className={styles.heroStage} />
    </section>

    <section id="next" className={`page-container ${styles.next}`} aria-labelledby="next-heading">
      <SectionIntro id="next-heading" title={next.title} lead={next.intro[0]} />
      <div className={styles.apps}>
        {next.blocks.map(block => <article key={block.label} className={styles.app}>
          <p className={styles.appFor}><ProductLockup name={block.label} /><span>{block.category}</span></p>
          <h3 className={`display ${styles.appTitle}`}>{block.title}</h3>
          <p className={styles.appBody}>{block.body[0]}</p>
          <a className={styles.appLink} href={withBasePath(block.links[0].href)}>{block.links[0].label}<ArrowIcon direction="down" size={16} /></a>
        </article>)}
      </div>
    </section>

    <ApplicationsProduct section={section('serviceagent')} />
    <ApplicationsProduct section={section('justcall')} />

    <section id="proof" className={`page-container ${styles.proof}`} aria-labelledby="proof-heading">
      <header className={styles.proofHead}>
        <div><Kicker>{proof.label}</Kicker><h2 id="proof-heading" className={`display ${styles.sectionTitle}`}>{proof.title}</h2></div>
        <ButtonLink href={proof.links[0].href} target="_blank" rel="noopener noreferrer" variant="ghost" className={styles.inlineLink}>
          {proof.links[0].label}<span className="sr-only"> (opens in a new tab)</span><ArrowIcon direction="up-right" size={18} />
        </ButtonLink>
      </header>
      <dl className={styles.stats}>
        {proof.stats!.map(stat => {
          const [number, unit] = figure(stat.value);
          return <div key={stat.label}>
            <dt><span>{stat.label}</span><span className={styles.statCompany}>{stat.company}</span></dt>
            <dd className="display">{number}{unit && <span className={styles.statUnit}>{unit}</span>}</dd>
          </div>;
        })}
      </dl>
      <ul className={styles.quotes}>
        {proof.blocks.map(block => <li key={block.quote}>
          <figure className={styles.quoteCard}>
            <div className={styles.quoteTop}>
              {/* The customer's logo where the prototype has one; otherwise its name. */}
              {block.logo ? <img className={styles.quoteLogo} src={assetPath(block.logo)} alt={block.company} height="64" loading="lazy" decoding="async" />
                : <span className={`display ${styles.quoteCompany}`}>{block.company}</span>}
              <ProductLockup name={block.label} className={styles.quoteProduct} />
            </div>
            <blockquote className="display">{block.quote}</blockquote>
            <figcaption><span className={styles.quotePerson}>{block.attribution}</span><span>{block.role}</span></figcaption>
            <ButtonLink href={block.links[0].href} target="_blank" rel="noopener noreferrer" size="small" variant="ghost" className={styles.storyLink}>
              {block.links[0].label}<span className="sr-only">: {block.company} (opens in a new tab)</span><ArrowIcon direction="up-right" size={14} />
            </ButtonLink>
          </figure>
        </li>)}
      </ul>
    </section>

    <section id="engineering" className={styles.engineering} aria-labelledby="engineering-heading">
      <span className={styles.engineeringGrid} aria-hidden="true" />
      <div className={`page-container ${styles.engineeringLayout}`}>
        <ApplicationsStatement id="engineering-heading" title={engineering.title}
          kicker={<Kicker>{engineering.label}</Kicker>}
          needs={engineering.blocks.map(block => ({ index: block.label, title: block.title, body: block.body[0] }))}
          statement={engineering.intro[0]} emphasis={engineering.emphasis} />
        <Mark className={styles.engineeringMark} />
      </div>
    </section>

    <section id="talk" className={`page-container ${styles.closing}`} aria-labelledby="talk-heading">
      <div className={styles.closingInner}>
        <div><Kicker>{closing.label}</Kicker><h2 id="talk-heading" className={`display ${styles.closingTitle}`}>{closing.title}</h2></div>
        <div>
          <p>{closing.body[0]}</p>
          <div className={styles.closingActions}>
            <ButtonLink href={closing.links[0].href} size="large">{closing.links[0].label}<ArrowIcon direction="up" size={18} /></ButtonLink>
            <ButtonLink href={closing.links[1].href} size="large" variant="outline">{closing.links[1].label}<ArrowIcon direction="up" size={18} /></ButtonLink>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
