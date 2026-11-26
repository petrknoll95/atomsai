import type { ReactNode } from 'react';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { Faq } from '@/components/home/faq';
import { Pattern } from '@/components/patterns/pattern';
import { withBasePath } from '@/lib/base-path';
import source from '@/content/client-pages/infrastructure.json';
import type { ContentBlock, ContentLink, ContentPage, ContentSection } from './client-content';
import { CodeExamples } from './content-catalog';
import { FeatureTabs } from './feature-tabs';
import { InfrastructureBandwidth, type BandwidthContent } from './infrastructure-bandwidth';
import { InfrastructureCallDemo, type CallDemoContent } from './infrastructure-call-demo';
import { LineArt, LineIcon, type LineArtName, type LineIconName } from './infrastructure-icons';
import styles from './infrastructure.module.css';

/** The shared client-page shape, plus the fields only this page's prototype has. */
type InfrastructureSection = Omit<ContentSection, 'blocks'> & {
  blocks: (ContentBlock & { metricNote?: string })[];
  line?: { label: string; number: string; href: string; note: string };
  note?: string;
  more?: { lead: string; parts: { text?: string; label?: string; href?: string }[]; link: ContentLink };
  tryIt?: BandwidthContent;
};
type InfrastructureContent = Omit<ContentPage, 'sections' | 'closing'> & {
  kicker: string[]; note: string[]; callDemo: CallDemoContent;
  sections: InfrastructureSection[];
  closing: ContentPage['closing'] & { label: string };
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
const boxMore = need(box.more, 'box.more');
const lessons = section('lessons');
const build = section('build');
const stack = section('stack');
const security = section('security');
const faq = section('faq');

const outbound = { target: '_blank', rel: 'noopener noreferrer' } as const;
const isOutbound = (href: string) => /^https?:\/\//.test(href);

/**
 * Dark cards that share their row with the light page keep the header on the
 * page's theme; where a card spans the width on narrow screens, this zone turns
 * the header dark over it.
 */
const HeaderZone = () => <span className={styles.headerZone} data-header-theme="dark" aria-hidden="true" />;

/** Headline lines as the prototype breaks them; spans keep the shared line reveal intact. */
function Lines({ text, after }: { text: string; after: string }) {
  const index = text.indexOf(after);
  if (index < 0) return <>{text}</>;
  const split = index + after.length;
  return <><span className={styles.line}>{text.slice(0, split).trim()}</span><span className={styles.line}>{text.slice(split).trim()}</span></>;
}

function SectionHead({ id, label, title, intro, action }: { id: string; label: string; title: ReactNode; intro?: string; action?: ReactNode }) {
  return <header className={styles.sectionHead}>
    <p className={styles.kicker}>{label}</p>
    <h2 className={`display ${styles.sectionTitle}`} id={`${id}-heading`}>{title}</h2>
    {(intro || action) && <div className={styles.sectionAside}>{intro && <p>{intro}</p>}{action}</div>}
  </header>;
}

function TextLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  const external = isOutbound(href);
  return <ButtonLink href={href} size="small" variant="ghost" className={`${styles.inlineLink} ${className}`} {...(external ? outbound : {})}>
    {children}<ArrowIcon direction={external ? 'up-right' : 'right'} size={16} />
  </ButtonLink>;
}

const fanIcons: LineIconName[] = ['followUp', 'correct', 'interrupt'];
const boxIcons: LineIconName[] = ['telephony', 'hear', 'omni', 'speak', 'recap', 'trace'];
const lessonIcons: LineIconName[] = ['phoneAudio', 'turnTaking', 'oneSystem'];
const securityIcons: LineIconName[] = ['servers', 'keys', 'recording', 'evidence'];
const buildArt: LineArtName[] = ['applications', 'api', 'services'];
const buildTones = ['cream', 'dark', 'iris'] as const;

export function InfrastructurePage() {
  const [primary, docs] = content.actions;
  const [talk, playground] = demo.links;
  const [getKey, contact] = content.closing.links;

  return <main id="main" className={styles.page} data-theme="light">
    <section id="hero" className={styles.hero} aria-labelledby="hero-heading" data-theme="dark">
      <div className="page-container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span className={styles.dot} />{content.kicker[0]} <span className={styles.kickerDivider}>/</span> {content.kicker[1]}</p>
            <h1 className={`display ${styles.title}`} id="hero-heading">{content.title}</h1>
            <p className={styles.heroIntro}>{content.intro[0]}</p>
            <div className={styles.heroActions}>
              <ButtonLink href={primary.href} size="large" {...outbound}>{primary.label} <ArrowIcon direction="up-right" size={18} /></ButtonLink>
              <ButtonLink href={docs.href} size="large" variant="outline" {...outbound}>{docs.label} <ArrowIcon direction="up-right" size={18} /></ButtonLink>
            </div>
            <p className={styles.heroNote}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              {content.note.map(note => <span key={note}>{note}</span>)}
            </p>
          </div>
          <InfrastructureCallDemo content={content.callDemo} />
        </div>
      </div>
    </section>

    <section className={`page-container ${styles.stats}`} aria-label="In numbers">
      <dl className={styles.statList}>{need(content.stats, 'stats').map(stat => {
        const [, number, suffix] = /^([\d,.]+)(.*)$/.exec(stat.value) ?? [, stat.value, ''];
        return <div key={stat.label}><dt>{stat.label}</dt><dd className="display">{number}{suffix && <span>{suffix}</span>}</dd></div>;
      })}</dl>
    </section>

    <section id="demo" className={`page-container ${styles.demo}`} aria-labelledby="demo-heading">
      <SectionHead id="demo" label={demo.label} title={<Lines text={demo.title} after="claim." />} intro={demo.intro[0]} />
      <div className={styles.demoGrid}>
        <div className={styles.demoLine} data-theme="dark">
          <p className={styles.demoLabel}>{demoLine.label}</p>
          <a className={`display ${styles.demoNumber}`} href={demoLine.href}>{demoLine.number}</a>
          <p className={styles.demoNote}>{demoLine.note}</p>
          <ButtonLink href={talk.href} size="large" {...outbound}>{talk.label} <ArrowIcon direction="up-right" size={18} /></ButtonLink>
        </div>
        <ul className={styles.fan} aria-label="Three things to try on the call">
          {demo.blocks.map((block, index) => <li key={block.title} className={styles.fanCard} data-tone={index === 1 ? 'iris' : 'cream'}>
            <LineIcon name={fanIcons[index]} className={styles.fanIcon} />
            <p className="display">{block.title}</p>
          </li>)}
        </ul>
      </div>
      <div className={styles.demoFooter}>
        <ButtonLink href={playground.href} variant="outline" {...outbound}>{playground.label} <ArrowIcon direction="up-right" size={16} /></ButtonLink>
        <p>{demo.note}</p>
      </div>
    </section>

    <section id="box" className={`page-container ${styles.box}`} aria-labelledby="box-heading">
      <SectionHead id="box" label={box.label} title={box.title} intro={box.intro[0]}
        action={<TextLink href={box.links[0].href}>{box.links[0].label}</TextLink>} />
      <div className={styles.boxTabsFrame}>
        <div className={styles.boxPattern} aria-hidden="true">
          <Pattern kind="drift" count={16} mode="dark" fit="stretch" loading="lazy" label="" />
        </div>
        <FeatureTabs label={box.label} className={styles.boxTabs} stageClassName={styles.boxStage}
          items={box.blocks.map((block, index) => ({
            id: boxIcons[index], title: block.title, meta: block.label,
            panel: <div className={styles.boxPanel} data-theme="dark" data-header-theme="light">
              <HeaderZone />
              <LineIcon name={boxIcons[index]} className={styles.boxIcon} />
              <div className={styles.boxCopy}>
                <p className={styles.boxMeta}>{block.label}</p>
                <h3 className={`display ${styles.boxTitle}`}>{block.title}</h3>
                <p className={styles.boxBody}>{block.body[0]}</p>
                <p className={styles.boxUse}><ArrowIcon size={12} />{block.body[1]}</p>
                <TextLink href={block.links[0].href} className={styles.boxDocs}>{block.links[0].label}</TextLink>
              </div>
            </div>,
          }))} />
      </div>
      <p className={styles.boxMore}>
        <b>{boxMore.lead}</b>{' '}
        {boxMore.parts.map((part, index) => 'href' in part && part.href
          ? <a key={index} className={styles.textLink} href={part.href} {...outbound}>{part.label}<ArrowIcon direction="up-right" size={12} /></a>
          : <span key={index}>{part.text}</span>)}{' '}
        <a className={styles.textLink} href={boxMore.link.href} {...outbound}>{boxMore.link.label}<ArrowIcon direction="up-right" size={12} /></a>
      </p>
    </section>

    <section id="lessons" className={styles.lessons} aria-labelledby="lessons-heading">
      <div className="page-container">
        <header className={styles.lessonsHead}>
          <p className={styles.kicker}>{lessons.label}</p>
          <h2 className={`display ${styles.sectionTitle}`} id="lessons-heading">{lessons.title}</h2>
        </header>
        <ol className={styles.lessonGrid}>
          {lessons.blocks.map((block, index) => <li key={block.title} className={styles.lessonCard} data-tone={index === 1 ? 'iris' : 'paper'}>
            <span className={styles.lessonIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <LineIcon name={lessonIcons[index]} className={styles.lessonIcon} />
            <p className={styles.lessonMeta}>{block.label}</p>
            <h3 className={`display ${styles.cardTitle}`}>{block.title}</h3>
            <p className={styles.cardBody}>{block.body[0]}</p>
            <p className={styles.lessonMetric}><span className="display">{block.metric}</span> <span>{block.metricNote}</span></p>
          </li>)}
        </ol>
        <InfrastructureBandwidth content={need(lessons.tryIt, 'lessons.tryIt')} />
        <p className={styles.footnote}>{lessons.note}</p>
      </div>
    </section>

    <section id="build" className={`page-container ${styles.build}`} aria-labelledby="build-heading">
      <SectionHead id="build" label={build.label} title={build.title} />
      <ul className={styles.buildGrid}>
        {build.blocks.map((block, index) => {
          const link = block.links[0];
          const external = isOutbound(link.href);
          const dark = buildTones[index] === 'dark';
          return <li key={block.title} className={styles.buildCard} data-tone={buildTones[index]} data-theme={dark ? 'dark' : undefined} data-header-theme={dark ? 'light' : undefined}>
            {dark && <HeaderZone />}
            <LineArt name={buildArt[index]} className={styles.buildArt} />
            <p className={styles.buildMeta}>{block.label}</p>
            <h3 className={`display ${styles.cardTitle}`}>{block.title}</h3>
            <p className={styles.cardBody}>{block.body[0]}</p>
            <a className={styles.buildLink} href={withBasePath(link.href)} {...(external ? outbound : {})}>
              {link.label}<ArrowIcon direction={external ? 'up-right' : 'right'} size={16} />
            </a>
          </li>;
        })}
      </ul>
      {/* Part of building on the API, as in the prototype: a sub-heading, not a section of its own. */}
      <div id="stack" className={styles.stack}>
        <div className={styles.stackCopy}>
          <h3 className={`display ${styles.stackTitle}`}><Lines text={stack.title} after="stack." /></h3>
          <ul className={styles.stackList}>{need(stack.items, 'stack.items').map(item => {
            const split = item.indexOf('?') + 1;
            return <li key={item}><b>{item.slice(0, split)}</b>{item.slice(split)}</li>;
          })}</ul>
        </div>
        <div className={styles.stackCode}>
          <CodeExamples examples={need(stack.examples, 'stack.examples')} />
          <HeaderZone />
        </div>
      </div>
    </section>

    <section id="security" className={`page-container ${styles.security}`} aria-labelledby="security-heading">
      <SectionHead id="security" label={security.label} title={security.title}
        action={<TextLink href={security.links[0].href}>{security.links[0].label}</TextLink>} />
      <ul className={styles.securityGrid}>
        {security.blocks.map((block, index) => <li key={block.title} className={styles.securityCard}>
          <LineIcon name={securityIcons[index]} className={styles.securityIcon} />
          <h3 className={`display ${styles.cardTitle}`}>{block.title}</h3>
          <p className={styles.cardBody}>{block.body[0]}</p>
        </li>)}
      </ul>
    </section>

    <Faq id="faq" label={faq.label} heading={faq.title} showAskQuestion={false}
      questions={faq.blocks.map(block => ({ question: block.title, answer: block.body[0] }))} />

    <section id="talk" className={`page-container ${styles.closing}`} aria-labelledby="talk-heading">
      <div className={styles.closingInner}>
        <div>
          <p className={styles.kicker}>{content.closing.label}</p>
          <h2 className={`display ${styles.sectionTitle}`} id="talk-heading"><Lines text={content.closing.title} after="key," /></h2>
        </div>
        <div>
          <p>{content.closing.body[0]}</p>
          <div className={styles.closingActions}>
            <ButtonLink href={getKey.href} size="large" {...outbound}>{getKey.label} <ArrowIcon direction="up-right" size={18} /></ButtonLink>
            <ButtonLink href={contact.href} size="large" variant="outline">{contact.label} <ArrowIcon size={18} /></ButtonLink>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
