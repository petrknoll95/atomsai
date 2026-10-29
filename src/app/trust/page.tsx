import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { DeploymentExplorer } from '@/components/pages/trust-deployment';
import { ButtonLink } from '@/components/ui';
import styles from '@/components/pages/trust.module.css';

export const metadata: Metadata = {
  title: 'Trust Center — AtomsAI',
  description: 'Review how AtomsAI handles deployment, data, access and security documentation. Start with your environment and the scope of your engagement.',
  alternates: { canonical: 'https://atomsai.com/trust' },
};
const evidence = [
  ['SOC 2 Type II', 'Report available under NDA', 'Request the current report to review its scope, auditor and audit window. These details are not published on this page.'],
  ['HIPAA', 'BAA for covered workloads', 'A Business Associate Agreement and the handling of protected health information are agreed for the engagement. Review the architecture and approved data flows before launch.'],
  ['GDPR & UK GDPR', 'DPA and SCCs available', 'Request the Data Processing Agreement and Standard Contractual Clauses. Region, retention and processing arrangements are agreed for your deployment.'],
  ['Penetration testing', 'Summary available under NDA', 'Request the latest test summary for the reference architecture and shared tooling, including the test scope and remediation status.'],
];
const documents = [
  ['SOC 2 Type II report', 'Under NDA'], ['HIPAA BAA template', 'On request'],
  ['Data Processing Agreement', 'On request'], ['Sub-processor list', 'On request'],
  ['Security whitepaper', 'On request'], ['Penetration test summary', 'Under NDA'],
  ['Security questionnaire', 'On request'], ['Business continuity & DR summary', 'Per engagement'],
  ['Insurance certificates', 'On request'],
];
export default function TrustPage() {
  return <PageShell><main id="main" className={styles.page}>
    <section className={`page-container ${styles.hero}`} aria-labelledby="hero-heading">
      <div><p className={styles.kicker}><span aria-hidden="true" />Trust Center</p><h1 id="hero-heading" className={`display ${styles.title}`}>Your data.<br />Your boundaries.</h1></div>
      <div className={styles.heroAside}><p>Where the system runs. What it can access. Who stays in control.</p><p className={styles.muted}>Start with the architecture, then review the documents that apply to your engagement.</p><ButtonLink href="#documents">Request security documents <span aria-hidden="true">↗</span></ButtonLink></div>
    </section>
    <div className={`page-container ${styles.indexWrap}`}><nav className={styles.index} aria-label="On this page">{[['01','Scope','#scope'],['02','Deployment','#deployment'],['03','Data & access','#data'],['04','Documents','#documents']].map(([n,label,href])=><a href={href} key={href}><span>{n}</span>{label}<span aria-hidden="true">↓</span></a>)}</nav></div>
    <section id="scope" className={`page-container ${styles.section}`} aria-labelledby="scope-heading">
      <div className={styles.sectionHeading}><p className={styles.kicker}>01 / Scope & assurance</p><div><h2 id="scope-heading" className={`display ${styles.heading}`}>The detail behind<br />the assurance.</h2><p className={styles.intro}>A badge is a starting point. The report, agreement and deployment scope are what your reviewer needs.</p></div></div>
      <div className={styles.evidence}>{evidence.map(([title,status,copy])=><article className={styles.evidenceRow} key={title}><h3 className={`display ${styles.rowTitle}`}>{title}</h3><div><p className={styles.status}><span aria-hidden="true" />{status}</p><p>{copy}</p></div><a className={styles.requestArrow} href={`mailto:security@atomsai.com?subject=${encodeURIComponent('Request: '+title)}`} aria-label={`Request ${title} documentation by email`}>↗</a></article>)}</div>
      <p className={styles.disclosure}><span>For clarity</span> ISO 27001 is not currently held. Business continuity and disaster recovery targets are documented per engagement; no group-level target is published.</p>
    </section>
    <section id="deployment" className={styles.deploymentSection} data-theme="dark" aria-labelledby="deployment-heading"><div className={`page-container ${styles.section}`}>
      <div className={styles.sectionHeading}><p className={styles.kicker}>02 / Deployment</p><div><h2 id="deployment-heading" className={`display ${styles.heading}`}>Choose where<br />the work happens.</h2><p className={styles.intro}>Your cloud is the default. Operations and access are agreed around the way your team works.</p></div></div>
      <DeploymentExplorer />
      <div className={styles.deploymentNotes}><p><span>Cloud options</span>AWS · Google Cloud · Azure</p><p><span>Model choice</span>Your provider, including self-hosted models</p><p><span>Before the build</span>Agree the region, data flows and access</p></div>
    </div></section>
    <section id="data" className={`page-container ${styles.section}`} aria-labelledby="data-heading">
      <div className={styles.sectionHeading}><p className={styles.kicker}>03 / Data & access</p><div><h2 id="data-heading" className={`display ${styles.heading}`}>Only the access<br />the work needs.</h2><p className={styles.intro}>The boundaries belong in the build: credentials, approval rules, retention and a record of what happened.</p></div></div>
      <div className={styles.controls}>{[
        ['01','Your data is not training data.','The commitment not to train on your data is contractual. Any required data egress is identified and approved before the build.'],
        ['02','Credentials you can revoke.','Access is scoped to the actions a workflow needs. Your team issues the credentials and controls access to its systems.'],
        ['03','A record your team can inspect.','Inputs, decisions, authorisation and outcomes are logged in your environment. Approval gates and recovery procedures are defined for the workflow.'],
        ['04','Retention on your terms.','Retention follows the agreed policy. Deletion and written confirmation are available on request or at the end of the contract.'],
      ].map(([number,title,copy])=><article key={number}><span className={styles.controlNumber}>{number}</span><h3 className={`display ${styles.controlTitle}`}>{title}</h3><p>{copy}</p></article>)}</div>
      <a className={`link-underline ${styles.textLink}`} href="/approach">See how we build approval rules into the workflow <span aria-hidden="true">↗</span></a>
    </section>
    <section id="documents" className={styles.documentsSection} aria-labelledby="documents-heading"><div className={`page-container ${styles.section} ${styles.documentGrid}`}>
      <div><p className={styles.kicker}>04 / Security documents</p><h2 id="documents-heading" className={`display ${styles.heading}`}>A shorter path<br />through review.</h2><p className={styles.intro}>Choose a document to open an email request. Reports are shared directly; NDA and engagement requirements may apply.</p><a className={`link-underline ${styles.email}`} href="mailto:security@atomsai.com">security@atomsai.com</a></div>
      <ul className={styles.documents}>{documents.map(([name,availability], index)=><li key={name}><a href={`mailto:security@atomsai.com?subject=${encodeURIComponent('Request: '+name)}`}><span className={styles.documentNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className={styles.documentName}>{name}<small>{availability}</small></span><span aria-hidden="true">↗</span><span className="sr-only"> — request by email</span></a></li>)}</ul>
    </div></section>
    <section className={`page-container ${styles.closing}`} aria-labelledby="trust-closing"><div><p className={styles.kicker}>Let’s work through it</p><h2 id="trust-closing" className={`display ${styles.heading}`}>Bring your security team.<br />And their questions.</h2><ButtonLink href="/company/contact?topic=security">Talk to AtomsAI <span aria-hidden="true">↗</span></ButtonLink></div><div className={styles.contactNotes}><a href="mailto:security@atomsai.com"><span>Vulnerabilities & security reviews</span>security@atomsai.com ↗</a><a href="mailto:privacy@atomsai.com"><span>Privacy requests</span>privacy@atomsai.com ↗</a><p>For current service status, contact the security team. A public status page is not available.</p></div></section>
  </main></PageShell>;
}
