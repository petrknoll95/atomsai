import { assetPath, withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import styles from './approach.module.css';
import { clientPages } from './client-content';
import { ApproachProcess } from './approach-process';
import { ApprovalWorkflow, DeliveryWorkflow, HandoverVisual } from './workflow-visuals';
import { Faq } from '@/components/home/faq';

const content = clientPages.services;
const sourceSection = (id: string) => content.sections.find(section => section.id === id)!;

const originalSteps = [
  { name: 'Understand the work', short: 'Discover', label: 'Teardown', description: 'We sit with the people doing the work. Follow the handoffs, look at the exceptions, and find the workflow worth changing first.', output: 'A ranked starting point', detail: 'Workflows compared by volume, effort, payback and risk. A recommendation for what goes first—and what can wait.', need: 'A process owner, a few practitioners, and examples of the work.' },
  { name: 'Make the plan concrete', short: 'Map', label: 'Blueprint', description: 'Map the chosen workflow from first input to final action. Agree what good looks like, where a person steps in, and how the system will connect.', output: 'An agreed blueprint', detail: 'The workflow, integrations, approval rules and data flows. Baselines and success criteria your team can measure.', need: 'Your process, engineering and security owners.' },
  { name: 'Build where you work', short: 'Build', label: 'Build & integrate', description: 'Our engineers work in your repository, with your team. Connect the real systems and compare outputs alongside the existing process before switching over.', output: 'A working system to test', detail: 'Code, prompts and integrations in your repository. A side-by-side comparison with the way your team works today.', need: 'Repository access, scoped credentials and your code review.' },
  { name: 'Test the difficult parts', short: 'Test', label: 'Evals & hardening', description: 'Test the edge cases as carefully as the happy path. Check accuracy, cost and response time against the thresholds you agreed.', output: 'Evidence for the go-live decision', detail: 'An evaluation suite, monitoring and documented recovery. Known failure modes, named owners and a rollback plan.', need: 'Your acceptance criteria and a team to review the results.' },
  { name: 'Put your team in control', short: 'Handover', label: 'Handover & scale', description: 'Your team takes over with training, runbooks and a supervised operating period. Then we return to the workflow list and decide what is worth doing next.', output: 'A system your team can run', detail: 'The code, prompts, tests, infrastructure and operating instructions. Ownership that continues after the engagement.', need: 'Operators, an engineering owner and an agreed support plan.' },
];

const steps = originalSteps.map((step, index) => {
  const copy = sourceSection('approach').blocks[index];
  return { ...step, name: copy.title, description: copy.body.join(' '), short: ['Understand', 'Design', 'Build', 'Validate', 'Hand over'][index], label: ['Understand', 'Design', 'Build', 'Validate', 'Hand over'][index], output: copy.list.join(' · ') };
});

const questions = [
  ['What should we bring to the first conversation?', 'One workflow and a person who knows it well. A few examples of where it slows down or goes wrong are more useful than a presentation. We will work out what else is needed together.'],
  ['What if the workflow is not worth automating?', 'Then that is a useful result. We compare the likely value with the effort and risk before committing to a build. The next step may be a different workflow, a simpler change, or waiting.'],
  ['Can you work within our security requirements?', 'Deployment, access, data flows and approval rules are part of the blueprint. Bring your security team into that discussion early. The Trust Center explains the available deployment approaches and documentation.'],
  ['What happens after handover?', 'Your team operates the system with us alongside them for an agreed period. Further support or another workflow can be scoped separately. The code, prompts, evaluations and runbooks remain with you.'],
];

export function ApproachPage() {
  return <main id="main" className={styles.page} data-theme="light">
    <section className={styles.hero} aria-labelledby="hero-heading" data-theme="dark">
      <div className="page-container">
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><span className={styles.dot} />AI Services <span className={styles.kickerDivider}>/</span> How we work</p>
          <h1 className={`display ${styles.title}`} id="hero-heading">{content.title}</h1>
          <p className={styles.heroIntro}>{content.intro[0]}</p>
          <div className={styles.heroActions}><ButtonLink href="/company/contact?topic=services" size="large">Talk to our team <ArrowIcon size={18} /></ButtonLink><a href="#approach" className={styles.inlineLink}>See our approach <ArrowIcon direction="down" size={16} /></a></div>
          <p className={styles.heroNote}>Built in your systems. Owned by your team.</p>
        </div>
        <DeliveryWorkflow blocks={sourceSection('workflow').blocks} />
      </div>
      <div id="workflow" className={styles.workflowIntro}>
        <div><p className={styles.kicker}>{sourceSection('workflow').label}</p><h2 className={`display ${styles.smallHeading}`}>{sourceSection('workflow').title}</h2></div>
        <p>{sourceSection('workflow').intro.join(' ')}</p>
      </div>
      </div>
    </section>

    <section id="services" className={`page-container ${styles.services}`} aria-labelledby="services-heading">
      <header className={styles.sectionHead}><div><p className={styles.kicker}>Two services. One working system.</p><h2 className={`display ${styles.sectionTitle}`} id="services-heading">{sourceSection('services').title}</h2></div></header>
      <div className={styles.serviceGrid}>{sourceSection('services').blocks.map((block,index)=><article key={block.title} className={styles.serviceCard}>
        <div className={styles.serviceArt}><img src={assetPath(`/assets/illustrations/${index===0 ? 'layered-planes' : 'modular-cube'}-outline.svg`)} alt="" width="400" height="320" loading="lazy" /><span className={styles.serviceIndex}>0{index+1}</span></div>
        <div className={styles.serviceCopy}><p className={styles.serviceLabel}>{block.title}</p><h3 className={`display ${styles.serviceTitle}`}>{block.body[0]}</h3><p>{block.body.slice(1).join(' ')}</p><a href="#approach" className={styles.inlineLink}>{index===0 ? 'Find the starting point' : 'See how we build'}<ArrowIcon direction="down" size={18}/></a></div>
      </article>)}</div>
    </section>

    <section id="areas" className={`page-container ${styles.areas}`} aria-labelledby="areas-heading">
      <div className={styles.areasIntro}><p className={styles.kicker}>{sourceSection('areas').label}</p><h2 className={`display ${styles.smallHeading}`} id="areas-heading">{sourceSection('areas').title}</h2></div>
      <div className={styles.areaGrid}>{sourceSection('areas').blocks.map((block,index)=><article key={block.title} className={styles.areaCard}>
        <span className={styles.areaIndex}>0{index+1}</span><h3 className="display">{block.title}</h3><p>{block.body.join(' ')}</p>
      </article>)}</div>
    </section>

    <section id="approach" className={`page-container ${styles.processSection}`} aria-labelledby="process-heading">
      <div className={styles.process} data-theme="dark">
        <header className={styles.processHead}><div><p className={styles.kicker}>One considered step at a time</p><h2 className={`display ${styles.sectionTitle}`} id="process-heading">{sourceSection('approach').title}</h2></div><p>{sourceSection('approach').intro[0]}</p></header>
        <ApproachProcess steps={steps.map((step,index)=>({...step, items:sourceSection('approach').blocks[index].list}))}/>
      </div>
    </section>

    <section className={styles.controlSection} aria-labelledby="control-heading">
      <div className={`page-container ${styles.controlGrid}`}>
        <div className={styles.controlCopy}><p className={styles.kicker}>Your rules, built in</p><h2 className={`display ${styles.sectionTitle}`} id="control-heading">{sourceSection('integration').title}</h2><p>{sourceSection('integration').intro[0]}</p><p>Those boundaries are part of the build. Start with a person reviewing every action, then adjust as the evidence earns your confidence.</p><a className={styles.textLink} href={withBasePath("/trust")}><span className="link-underline">Explore trust & security</span><ArrowIcon size={18} /></a></div>
        <ApprovalWorkflow />
      </div>
    </section>

    <section id="proven-in-production-at-scale" className={`page-container ${styles.proof}`} aria-labelledby="proof-heading">
      <div className={styles.proofIntro}><div><p className={styles.kicker}>Track record</p><h2 id="proof-heading" className={`display ${styles.smallHeading}`}>{sourceSection('proven-in-production-at-scale').title}</h2></div><p>{sourceSection('proven-in-production-at-scale').intro[0]}</p></div>
      <dl className={styles.stats}>{sourceSection('proven-in-production-at-scale').stats?.map(stat=><div key={stat.label}><dt>{stat.label}</dt><dd className="display">{stat.value}</dd></div>)}</dl>
    </section>
    <section className={`page-container ${styles.ownership}`} aria-labelledby="ownership-heading">
      <div><p className={styles.kicker}>Built to be yours</p><h2 className={`display ${styles.sectionTitle}`} id="ownership-heading">{sourceSection('ownership').title}</h2><p className={styles.ownershipIntro}>{sourceSection('ownership').blocks.map(block => block.body.join(' ')).join(' ')}</p></div>
      <HandoverVisual />
    </section>

    <Faq id="questions" label="Before we begin" heading={<><span>A few things</span><span>you might ask.</span></>} questions={questions.map(([question, answer]) => ({ question, answer }))} showAskQuestion={false} />

    <section className={`page-container ${styles.closing}`} aria-labelledby="approach-closing-heading">
      <div className={styles.closingInner}><div><p className={styles.kicker}>Start with one workflow</p><h2 className={`display ${styles.sectionTitle}`} id="approach-closing-heading">{content.closing.title}</h2></div><div><p>{content.closing.body[0]}</p><ButtonLink href="/company/contact?topic=services" size="large">Talk to AtomsAI <ArrowIcon size={18} /></ButtonLink></div></div>
    </section>
  </main>;
}
