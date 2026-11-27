import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { Faq } from '@/components/home/faq';
import { StatHighlights } from '@/components/home/stat-highlights';
import source from '@/content/client-pages/infrastructure.json';
import type { ContentBlock, ContentLink, ContentPage, ContentSection } from './client-content';
import { CodeExamples } from './content-catalog';
import { InfrastructureBandwidth, type BandwidthContent } from './infrastructure-bandwidth';
import { InfrastructureBox } from './infrastructure-box';
import { InfrastructureCallDemo, type CallDemoContent } from './infrastructure-call-demo';
import { SectionIntro } from './section-intro';
import styles from './infrastructure.module.css';

/** The shared client-page shape, plus the fields only this page's prototype has. */
export type InfrastructureSection = Omit<ContentSection, 'blocks'> & {
  blocks: (ContentBlock & { metricNote?: string })[];
  line?: { label: string; number: string; href: string; note: string };
  note?: string;
  more?: { lead: string; parts: { text?: string; label?: string; href?: string }[]; link: ContentLink };
  tryIt?: BandwidthContent;
};
type InfrastructureContent = Omit<ContentPage, 'sections'> & {
  note: string[]; callDemo: CallDemoContent;
  sections: InfrastructureSection[];
};
const content: InfrastructureContent = source;

function need<T>(value: T | undefined, field: string): T {
  if (value === undefined) throw new Error(`infrastructure.json is missing ${field}`);
  return value;
}
const section = (id: string) => need(content.sections.find(entry => entry.id === id), `section "${id}"`);
const demo = section('demo');
const demoLine = need(demo.line, 'demo.line');
const box = section('box');
const lessons = section('lessons');
const build = section('build');
const stack = section('stack');
const security = section('security');
const faq = section('faq');

const outbound = { target: '_blank', rel: 'noopener noreferrer' } as const;
const isOutbound = (href: string) => /^https?:\/\//.test(href);

/** The two clauses of a two-tone headline: the copy up to and including `after`, then the rest. */
export function splitAfter(text: string, after: string): [string, string] {
  const index = text.indexOf(after);
  if (index < 0) return [text, ''];
  const split = index + after.length;
  return [text.slice(0, split).trim(), text.slice(split).trim()];
}

/**
 * Dark cards that share their row with the light page keep the header on the
 * page's theme; where a card spans the width on narrow screens, this zone turns
 * the header dark over it.
 */
const HeaderZone = () => <span className={styles.headerZone} data-header-theme="dark" aria-hidden="true" />;

/** A link styled as a pill: an up-right arrow for other sites, which open in a new tab. */
function PillLink({ link, variant = 'secondary', className = '' }: { link: ContentLink; variant?: 'primary' | 'secondary' | 'ghost'; className?: string }) {
  const external = isOutbound(link.href);
  return <ButtonLink href={link.href} size="small" variant={variant} className={`${styles.pill} ${className}`} {...(external ? outbound : {})}>
    {link.label}<ArrowIcon direction={external ? 'up-right' : 'right'} size={16} />
  </ButtonLink>;
}

export function InfrastructurePage() {
  const [primary, docs] = content.actions;
  const [talk, playground] = demo.links;
  const [claim, turn] = splitAfter(content.title, 'year.');
  const [demoClaim, demoTurn] = splitAfter(demo.title, 'claim.');
  const [stackClaim, stackTurn] = splitAfter(stack.title, 'stack.');

  return <main id="main" className={styles.page} data-theme="light">
    {/* Stacked, as the developer heroes that run a live demo are: the claim and its actions, then the call at full width. */}
    <section id="hero" className={styles.hero} aria-labelledby="hero-heading" data-theme="dark">
      <div className="page-container">
        <header className={styles.heroHead}>
          <h1 className={`display ${styles.title}`} id="hero-heading">{claim} <span className={styles.titleMuted}>{turn}</span></h1>
          <p className={styles.heroIntro}>{content.intro[0]}</p>
          <div className={styles.heroActions}>
            <ButtonLink href={primary.href} {...outbound}>{primary.label}<ArrowIcon direction="up-right" size={16} /></ButtonLink>
            <ButtonLink href={docs.href} variant="ghost" className={styles.heroDocs} {...outbound}>{docs.label}<ArrowIcon direction="up-right" size={16} /></ButtonLink>
          </div>
          <p className={styles.heroNote}>{content.note.join(' ')}</p>
        </header>
        <InfrastructureCallDemo content={content.callDemo} />
      </div>
    </section>

    <section className={`page-container ${styles.stats}`} aria-label="In numbers">
      <StatHighlights label="In numbers">{need(content.stats, 'stats').map(stat =>
        <div key={stat.label}><dt>{stat.label}</dt><dd className="display">{stat.value}</dd></div>)}
      </StatHighlights>
    </section>

    <section id="demo" className={`page-container ${styles.demo}`} aria-labelledby="demo-heading">
      <SectionIntro id="demo-heading" title={demoClaim} muted={demoTurn} lead={demo.intro[0]} />
      {/* One dark-green panel, as on the homepage: the things to try on the left, the line to call on the right. */}
      <div className={`theme-dark ${styles.demoPanel}`} data-theme="dark">
        <div className={styles.demoFrame}>
          <div className={`theme-light ${styles.callCard}`} data-header-backdrop="">
            <div className={styles.callHeader}>
              <span className={styles.callStatus}><i className={styles.callLive} aria-hidden="true" />{demoLine.label}</span>
            </div>
            <div className={styles.callBody}>
              <a className={`display ${styles.callNumber}`} href={demoLine.href}>{demoLine.number}</a>
              <p className={styles.callNote}>{demoLine.note}</p>
              <ButtonLink href={talk.href} className={styles.callAction} {...outbound}>{talk.label}<ArrowIcon direction="up-right" size={16} /></ButtonLink>
            </div>
          </div>
        </div>
        <div className={styles.demoCopy}>
          <ol className={styles.askList} aria-label="Three things to try on the call">
            {demo.blocks.map((block, index) => <li key={block.title}>
              <span className={styles.askIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className={`display ${styles.askTitle}`}>{block.title}</span>
            </li>)}
          </ol>
          <div className={styles.askNext}>
            <PillLink link={playground} variant="ghost" className={styles.ghostLink} />
            <p>{demo.note}</p>
          </div>
        </div>
      </div>
    </section>

    <InfrastructureBox section={box} />

    <section id="lessons" className={`page-container ${styles.lessons}`} aria-labelledby="lessons-heading">
      <SectionIntro id="lessons-heading" title={lessons.title} />
      {/* Open columns, metric first, ruled like the numbers strip above. */}
      <ol className={styles.columns}>
        {lessons.blocks.map(block => <li key={block.title}>
          <p className={styles.metric}><span className="display">{block.metric}</span><span>{block.metricNote}</span></p>
          <p className={`${styles.columnLabel} ${styles.lessonLabel}`}>{block.label}</p>
          <h3 className={`display ${styles.columnTitle}`}>{block.title}</h3>
          <p className={styles.columnBody}>{block.body[0]}</p>
        </li>)}
      </ol>
      <p className={styles.columnsNote}>{lessons.note}</p>
      <InfrastructureBandwidth content={need(lessons.tryIt, 'lessons.tryIt')} />
    </section>

    <section id="build" className={`page-container ${styles.build}`} aria-labelledby="build-heading">
      <SectionIntro id="build-heading" title={build.title} />
      <ul className={styles.columns}>
        {build.blocks.map(block => <li key={block.title}>
          <p className={styles.columnLabel}>{block.label}</p>
          <h3 className={`display ${styles.columnTitle}`}>{block.title}</h3>
          <p className={styles.columnBody}>{block.body[0]}</p>
          <PillLink link={block.links[0]} className={styles.columnAction} />
        </li>)}
      </ul>
      {/* Part of building on the API, as in the prototype: a sub-heading, not a section of its own. */}
      <div id="stack" className={styles.stack}>
        <div className={styles.stackCopy}>
          <SectionIntro as="h3" id="stack-heading" className={styles.stackIntro}
            title={<span className={styles.line}>{stackClaim}</span>} muted={stackTurn} />
          <ul className={styles.stackList}>{need(stack.items, 'stack.items').map(item => {
            const split = item.indexOf('?') + 1;
            return <li key={item}><b>{item.slice(0, split)}</b>{item.slice(split)}</li>;
          })}</ul>
        </div>
        <div className={styles.stackCode} data-header-backdrop>
          <CodeExamples examples={need(stack.examples, 'stack.examples')} />
          <HeaderZone />
        </div>
      </div>
    </section>

    {/* The homepage trust summary's layout: the heading and its one link, beside a ruled list. */}
    <section id="security" className={`page-container ${styles.security}`} aria-labelledby="security-heading">
      <header className={styles.securityIntro}>
        <h2 className={`display ${styles.securityTitle}`} id="security-heading">{security.title}</h2>
        <PillLink link={security.links[0]} className={styles.securityAction} />
      </header>
      <ul className={styles.guarantees}>
        {security.blocks.map(block => <li key={block.title}>
          <h3 className={`display ${styles.guaranteeTitle}`}>{block.title}</h3>
          <p>{block.body[0]}</p>
        </li>)}
      </ul>
    </section>

    {/* As in the prototype: its intro line, no Trust Center button (security links it above), first question open. */}
    <Faq id="faq" label={faq.label} heading={faq.title} showAskQuestion={false} intro={faq.intro[0]} action={null} defaultOpen={0}
      questions={faq.blocks.map(block => ({ question: block.title, answer: block.body[0] }))} />
  </main>;
}
