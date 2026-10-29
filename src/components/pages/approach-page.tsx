import { withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import styles from './approach.module.css';

const steps = [
  { name: 'Understand the work', short: 'Discover', label: 'Teardown', description: 'We sit with the people doing the work. Follow the handoffs, look at the exceptions, and find the workflow worth changing first.', output: 'A ranked starting point', detail: 'Workflows compared by volume, effort, payback and risk. A recommendation for what goes first—and what can wait.', need: 'A process owner, a few practitioners, and examples of the work.' },
  { name: 'Make the plan concrete', short: 'Map', label: 'Blueprint', description: 'Map the chosen workflow from first input to final action. Agree what good looks like, where a person steps in, and how the system will connect.', output: 'An agreed blueprint', detail: 'The workflow, integrations, approval rules and data flows. Baselines and success criteria your team can measure.', need: 'Your process, engineering and security owners.' },
  { name: 'Build where you work', short: 'Build', label: 'Build & integrate', description: 'Our engineers work in your repository, with your team. Connect the real systems and compare outputs alongside the existing process before switching over.', output: 'A working system to test', detail: 'Code, prompts and integrations in your repository. A side-by-side comparison with the way your team works today.', need: 'Repository access, scoped credentials and your code review.' },
  { name: 'Test the difficult parts', short: 'Test', label: 'Evals & hardening', description: 'Test the edge cases as carefully as the happy path. Check accuracy, cost and response time against the thresholds you agreed.', output: 'Evidence for the go-live decision', detail: 'An evaluation suite, monitoring and documented recovery. Known failure modes, named owners and a rollback plan.', need: 'Your acceptance criteria and a team to review the results.' },
  { name: 'Put your team in control', short: 'Handover', label: 'Handover & scale', description: 'Your team takes over with training, runbooks and a supervised operating period. Then we return to the workflow list and decide what is worth doing next.', output: 'A system your team can run', detail: 'The code, prompts, tests, infrastructure and operating instructions. Ownership that continues after the engagement.', need: 'Operators, an engineering owner and an agreed support plan.' },
];

const questions = [
  ['What should we bring to the first conversation?', 'One workflow and a person who knows it well. A few examples of where it slows down or goes wrong are more useful than a presentation. We will work out what else is needed together.'],
  ['What if the workflow is not worth automating?', 'Then that is a useful result. We compare the likely value with the effort and risk before committing to a build. The next step may be a different workflow, a simpler change, or waiting.'],
  ['Can you work within our security requirements?', 'Deployment, access, data flows and approval rules are part of the blueprint. Bring your security team into that discussion early. The Trust Center explains the available deployment approaches and documentation.'],
  ['What happens after handover?', 'Your team operates the system with us alongside them for an agreed period. Further support or another workflow can be scoped separately. The code, prompts, evaluations and runbooks remain with you.'],
];

export function ApproachPage() {
  return <main id="main" className={styles.page} data-theme="light">
    <section className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <p className={styles.kicker}><span className={styles.dot} />AI Services <span className={styles.kickerDivider}>/</span> How we work</p>
      <div className={styles.heroCopy}>
        <h1 className={`display ${styles.title}`} id="hero-heading">From workflow.<br />To working system.</h1>
        <div className={styles.heroAside}>
          <p>We help you find the right starting point, build around your business, and put your team in control.</p>
          <ButtonLink href="/company/contact?topic=services" size="large">Find your starting point <ArrowIcon size={18} /></ButtonLink>
        </div>
      </div>
      <div className={styles.journey}>
        <div className={styles.journeyNote}><span>Your business, connected.</span><span>One considered step at a time.</span></div>
        <ol className={styles.journeySteps}>
          {steps.map((step, index) => <li key={step.short}><a href={withBasePath(`#step-${index + 1}`)}><span className={`display ${styles.journeyNumber}`}>0{index + 1}</span><span>{step.short}</span><span className={styles.journeyDot} aria-hidden="true" /></a></li>)}
        </ol>
        <div className={styles.journeyFoot}><span>Built in your systems.</span><span>Owned by your team. <ArrowIcon size={18} /></span></div>
      </div>
    </section>

    <section className={`page-container ${styles.process}`} aria-labelledby="process-heading">
      <div className={styles.sectionHead}>
        <p className={styles.kicker}>The process</p>
        <div><h2 className={`display ${styles.sectionTitle}`} id="process-heading">Five steps.<br />Something real at each one.</h2><p className={styles.sectionIntro}>Every stage ends in work you can inspect.<br className={styles.desktopBreak} /> From the first recommendation to the final handover.</p></div>
      </div>
      <ol className={styles.processList}>
        {steps.map((step, index) => <li key={step.name} id={`step-${index + 1}`} className={styles.processRow}>
          <div className={styles.stepIdentity}><span className={`display ${styles.stepNumber}`}>0{index + 1}</span><span>{step.label}</span></div>
          <div className={styles.stepCopy}><h3 className={`display ${styles.stepTitle}`}>{step.name}</h3><p>{step.description}</p><details className={styles.need}><summary>What we need from you <span aria-hidden="true">+</span></summary><p>{step.need}</p></details></div>
          <div className={styles.output}><span className={styles.outputLabel}><span aria-hidden="true">↳</span> What you take away</span><h4 className={`display ${styles.outputTitle}`}>{step.output}</h4><p>{step.detail}</p></div>
        </li>)}
      </ol>
    </section>

    <section className={styles.controlSection} aria-labelledby="control-heading">
      <div className={`page-container ${styles.controlGrid}`}>
        <div className={styles.controlCopy}><p className={styles.kicker}>Your rules, built in</p><h2 className={`display ${styles.sectionTitle}`} id="control-heading">The next action.<br />On your terms.</h2><p>You decide what the system can do on its own, what needs approval, and when it should hand over.</p><p>Those boundaries are part of the build. Start with a person reviewing every action, then adjust as the evidence earns your confidence.</p><a className={styles.textLink} href={withBasePath("/trust")}><span className="link-underline">Explore trust & security</span><ArrowIcon size={18} /></a></div>
        <figure className={styles.workflow}>
          <div className={styles.workflowHeader}><span>Illustrative approval flow</span><span className={styles.workflowTag}>Your policy</span></div>
          <div className={styles.workflowInput}><span className={styles.smallDot} /><span>New request</span><span className={styles.statusLabel}>Received</span></div>
          <div className={styles.connector} aria-hidden="true" />
          <div className={styles.policy}><span className={styles.policyIcon} aria-hidden="true">···</span><div><p>Check the rules</p><span>Scope · permissions · confidence</span></div></div>
          <div className={styles.branch} aria-hidden="true"><span /><span /></div>
          <div className={styles.outcomes}>
            <div><span className={styles.outcomeLabel}>Within agreed policy</span><p className="display">Take action</p><span className={styles.outcomeDetail}>Update the system.<br />Log what happened.</span></div>
            <div><span className={styles.outcomeLabel}>Needs a decision</span><p className="display">Ask your team</p><span className={styles.outcomeDetail}>Share the context.<br />Wait for approval.</span></div>
          </div>
          <figcaption>Every outcome has a record. Every exception has an owner.</figcaption>
        </figure>
      </div>
    </section>

    <section className={`page-container ${styles.ownership}`} aria-labelledby="ownership-heading">
      <div><p className={styles.kicker}>Built to be yours</p><h2 className={`display ${styles.sectionTitle}`} id="ownership-heading">The work stays.<br />Even when we leave.</h2><p className={styles.ownershipIntro}>Your repository from the first merge. Your team at the handover. Everything needed to keep the system running, in your hands.</p></div>
      <div className={styles.handover}>
        <div className={styles.handoverHead}><span className={styles.folderIcon} aria-hidden="true" /><p>Your working system</p><span className={styles.owned}>Yours</span></div>
        {[
          ['The build', 'Code, prompts and integrations'],
          ['The checks', 'Evaluations and monitoring'],
          ['The operation', 'Infrastructure and runbooks'],
          ['The knowledge', 'Training and handover'],
        ].map(([label, value], index) => <div key={label} className={styles.handoverRow}><span className={styles.fileNumber}>0{index + 1}</span><div><p>{label}</p><span>{value}</span></div><span className={styles.check} aria-label="Included">✓</span></div>)}
        <p className={styles.handoverFoot}>In your repository. Under your license.</p>
      </div>
    </section>

    <section className={`page-container ${styles.questions}`} aria-labelledby="questions-heading">
      <div><p className={styles.kicker}>Before we begin</p><h2 className={`display ${styles.questionsTitle}`} id="questions-heading">A few things<br />you might ask.</h2></div>
      <div className={styles.questionList}>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className={`page-container ${styles.closing}`} aria-labelledby="approach-closing-heading">
      <div className={styles.closingInner}><div><p className={styles.kicker}>Start with one workflow</p><h2 className={`display ${styles.sectionTitle}`} id="approach-closing-heading">Show us where<br />work gets stuck.</h2></div><div><p>A conversation about your process.<br />A clearer idea of what comes next.</p><ButtonLink href="/company/contact?topic=services" size="large">Talk to AtomsAI <ArrowIcon size={18} /></ButtonLink></div></div>
    </section>
  </main>;
}
