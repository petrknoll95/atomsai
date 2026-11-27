import { withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { StatHighlights } from '@/components/home/stat-highlights';
import content from '@/content/client-pages/applications.json';
import { ApplicationsHeroStage } from './applications-hero-stage';
import { ApplicationsProduct, ProductLockup, type ApplicationsSection } from './applications-product';
import { ApplicationsProofStories } from './applications-proof';
import { ApplicationsStatement } from './applications-statement';
import { SectionIntro } from './section-intro';
import styles from './applications.module.css';

const sections: ApplicationsSection[] = content.sections;
const section = (id: string) => sections.find(item => item.id === id)!;
const next = section('next');
const proof = section('proof');
const engineering = section('engineering');
/** The chapters already quote some customers in their steps; the stories open on the first one they don't. */
const chapters = ['serviceagent', 'justcall'].map(section);
const quotedInChapters = new Set(chapters.flatMap(chapter => chapter.blocks.filter(step => step.quote).map(step => step.company)));
const firstStory = Math.max(0, proof.blocks.findIndex(story => !quotedInChapters.has(story.company)));

/**
 * Applications overview, composed like the homepage: a centred hero over one
 * product panel, a light index of the two applications, their chapters, the
 * customer proof and the engineering statement. The page's closing line sits in
 * the footer's CTA band (see app/applications/page.tsx).
 */
export function ApplicationsPage() {
  return <main id="main" className={styles.page} data-theme="light">
    <section id="hero" className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <header className={styles.heroIntro}>
        <h1 id="hero-heading" className={`display ${styles.heroTitle}`}><span>{content.title}</span> <span className={styles.heroMuted}>{content.intro[0]}</span></h1>
        <p className={styles.heroLead}>{content.intro[1]}</p>
        <ButtonLink href={content.actions[0].href} className={styles.heroAction}>{content.actions[0].label}<ArrowIcon direction="down" size={16} /></ButtonLink>
      </header>
      <ApplicationsHeroStage events={content.hero.events} className={styles.heroStage} />
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

    {chapters.map(chapter => <ApplicationsProduct key={chapter.id} section={chapter} />)}

    <section id="proof" className={`page-container ${styles.proof}`} aria-labelledby="proof-heading">
      <SectionIntro id="proof-heading" title={proof.title} action={
        <ButtonLink href={proof.links[0].href} target="_blank" rel="noopener noreferrer" variant="secondary">
          {proof.links[0].label}<span className="sr-only"> (opens in a new tab)</span><ArrowIcon direction="up-right" size={16} />
        </ButtonLink>} />
      <div className={styles.stats}>
        <StatHighlights label="Customer results">
          {proof.stats!.map(stat => <div key={stat.label}>
            <dt>{stat.label} <span className={styles.statCompany}>{stat.company}</span></dt>
            <dd className="display">{stat.value}</dd>
          </div>)}
        </StatHighlights>
      </div>
      <ApplicationsProofStories stories={proof.blocks} stats={proof.stats} initial={firstStory} />
    </section>

    <section id="engineering" className={`page-container ${styles.engineering}`} aria-labelledby="engineering-heading">
      <ApplicationsStatement id="engineering-heading" title={engineering.title} statement={engineering.intro[0]}
        needs={engineering.blocks.map(block => ({ title: block.title, body: block.body[0], link: block.links[0] }))} />
    </section>
  </main>;
}
