'use client';
import { useState } from 'react';
import styles from './trust.module.css';
const deployments = [
  { label: 'Your cloud', note: 'Default deployment', title: 'Inside your environment.', copy: 'Compute, storage and keys stay in your account. Your team operates the system and controls its credentials.', owner: 'Your team', boundary: 'Your cloud account', rows: [['Compute & data','Your account, your region'],['Encryption keys','Your KMS'],['Model endpoint','Your chosen provider'],['Network egress','Controlled by your team'],['Access','Issued and revoked by you']] },
  { label: 'Your cloud, managed', note: 'Operated by AtomsAI', title: 'Your environment. Our operations.', copy: 'The architecture stays in your account. AtomsAI operates it through a scoped service account, with responsibilities agreed together.', owner: 'AtomsAI, with scoped access', boundary: 'Your cloud account', rows: [['Compute & data','Your account, your region'],['Encryption keys','Your KMS'],['Model endpoint','Your chosen provider'],['Network egress','Controlled by your team'],['Access','Scoped service account']] },
  { label: 'Hosted pilot', note: 'Non-sensitive workloads', title: 'A place to test the fit.', copy: 'Hosted by AtomsAI for pilots, on request. Regulated and sensitive workloads need an appropriate deployment agreed with your security team.', owner: 'AtomsAI', boundary: 'AtomsAI account', rows: [['Compute & data','AtomsAI infrastructure'],['Encryption keys','Managed KMS'],['Model endpoint','AtomsAI-selected by default'],['Network egress','Controlled by AtomsAI'],['Access','Managed by AtomsAI']] },
];
export function DeploymentExplorer() {
  const [selected,setSelected]=useState(0);const current=deployments[selected];
  return <div className={styles.explorer}>
    <div className={styles.deploymentChoices} role="group" aria-label="Compare deployment options">{deployments.map((item,index)=><button type="button" key={item.label} aria-pressed={index===selected} aria-controls="deployment-detail" onClick={()=>setSelected(index)}>{item.label}</button>)}</div>
    <div id="deployment-detail" className={styles.deploymentDetail} aria-live="polite" aria-atomic="true">
      <div className={styles.deploymentCopy}><p className={styles.deploymentNote}>{current.note}</p><h3 className={`display ${styles.deploymentTitle}`}>{current.title}</h3><p>{current.copy}</p><p className={styles.operator}><span>Operated by</span>{current.owner}</p></div>
      <div className={styles.boundary}><div className={styles.boundaryHeading}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M10 2 16 4.5V10c0 3.5-6 7-6 7s-6-3.5-6-7V4.5L10 2Z"/><path d="m7 9 2 2 4-4"/></svg>{current.boundary}<span className={styles.boundaryTag}>Deployment boundary</span></div><dl>{current.rows.map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p className={styles.boundaryFoot}>Permissions and data flows agreed before launch.</p></div>
    </div>
  </div>;
}
