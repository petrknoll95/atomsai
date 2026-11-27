import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink, Eyebrow } from '@/components/ui';
import { StatHighlights } from '@/components/home/stat-highlights';
import { approachContent, approachSection } from './approach-content';
import { ApproachIntegration, splitAtStop } from './approach-integration';
import { ApproachStages } from './approach-stages';
import { ApproachWorkflow } from './approach-workflow';
import { SectionIntro } from './section-intro';
import styles from './approach.module.css';

const services = approachSection('services');
const areas = approachSection('areas');
const proof = approachSection('proven-in-production-at-scale');
const ownership = approachSection('ownership');
const [contact, tour] = approachContent.actions;
const [servicesClaim, servicesTurn] = splitAtStop(services.title);

/**
 * AI Services, in the prototype's order and the homepage's language: a centred statement, the
 * one request that runs through five steps, the two services and the work they apply to, the
 * integration diagram and the track record, the five stages, and what stays yours. The closing
 * line sits in the footer's CTA band (see app/approach/page.tsx).
 */
export function ApproachPage() {
  return <main id="main" className={styles.page} data-theme="light">
    <section id="hero" className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      {/* The page's name above the claim, as the PyAI hero names its product: quiet display text, no mark. */}
      <p className={`display ${styles.heroName}`}>{approachContent.label}</p>
      <SectionIntro as="h1" id="hero-heading" className={styles.heroIntro} title={approachContent.title} lead={approachContent.intro[0]} action={<>
        <ButtonLink href={contact.href}>{contact.label}<ArrowIcon size={16} /></ButtonLink>
        <ButtonLink href={tour.href} variant="ghost">{tour.label}<ArrowIcon direction="down" size={16} /></ButtonLink>
      </>} />
    </section>

    <ApproachWorkflow section={approachSection('workflow')} />

    {/* Two open columns under one hairline, a rule between: the service, then what it is for, at the same size. */}
    <section id="services" className="page-container" aria-labelledby="services-heading">
      <SectionIntro id="services-heading" title={servicesClaim} muted={servicesTurn} />
      <div className={styles.serviceColumns}>
        {services.blocks.map(block => <article key={block.title} className={styles.service}>
          <h3 className={`display ${styles.serviceTitle}`}>{block.title}. <span className={styles.muted}>{block.body[0]}</span></h3>
          <p className={styles.serviceBody}>{block.body[1]}</p>
        </article>)}
      </div>
    </section>

    {/* The four areas in one ruled row on wide screens, two by two on tablets; the third column starts on the services' second column line. */}
    <section id="areas" className="page-container" aria-labelledby="areas-heading">
      <SectionIntro id="areas-heading" title={areas.title} />
      <ul className={styles.areaGrid}>
        {areas.blocks.map(block => <li key={block.title} className={styles.area}>
          <h3 className={`display ${styles.areaTitle}`}>{block.title}</h3>
          <p className={styles.areaBody}>{block.body[0]}</p>
        </li>)}
      </ul>
    </section>

    <ApproachIntegration section={approachSection('integration')} />

    {/* The homepage stats strip between hairlines, as on the Applications and PyAI pages. */}
    <section id={proof.id} className={`page-container ${styles.proof}`} aria-labelledby="proof-heading">
      <SectionIntro id="proof-heading" title={proof.title} lead={proof.intro[0]} />
      <div className={styles.stats}>
        <StatHighlights label={proof.label}>
          {proof.stats!.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd className="display">{stat.value}</dd></div>)}
        </StatHighlights>
      </div>
    </section>

    <ApproachStages section={approachSection('approach')} />

    {/* The PyAI security layout: the heading and its one link, beside three ruled statements. */}
    <section id="ownership" className={`page-container ${styles.ownership}`} aria-labelledby="ownership-heading">
      <header className={styles.ownershipIntro}>
        <h2 id="ownership-heading" className={`display ${styles.ownershipTitle}`}>{ownership.title}</h2>
        <Eyebrow href={ownership.links[0].href} className={styles.ownershipAction}>{ownership.links[0].label}</Eyebrow>
      </header>
      <ul className={styles.statements}>
        {ownership.blocks.map(block => <li key={block.title} className={`display ${styles.statement}`}>{block.body[0]}</li>)}
      </ul>
    </section>
  </main>;
}
