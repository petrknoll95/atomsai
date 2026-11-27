import { ArrowIcon } from '@/components/arrow-icon';
import { InfrastructureFigure } from './infrastructure-figure';
import { OfferingCard } from './offering-card';
import { offeringIllustrations } from './offering-illustrations';
import styles from './offerings.module.css';
const offers = [
  {name:'01 · Models & Infrastructure', lines:['Models &','infrastructure'], description:'Speech and conversational AI, built for real-world phone calls.', action:'Explore PyAI', href:'https://pyai.com/', illustration:offeringIllustrations.infrastructure},
  {name:'02 · Orchestration & Workflows', lines:['Orchestration','& workflows'], description:'Models, software, data, and people working together around the job.', action:'Explore our approach', href:'/approach', illustration:'server-modules'},
  {name:'03 · Applications', lines:['Applications'], description:'Complete products for customer conversations and business operations.', action:'Explore applications', href:'#applications', illustration:offeringIllustrations.applications},
  {name:'04 · Custom AI Engineering', lines:['Custom AI','engineering'], description:'Tailored AI systems for workflows that need more than ready-made software.', action:'Discuss your project', href:'/company/contact', illustration:offeringIllustrations.services},
] as const;
export function Offerings(){return <section className={`page-container ${styles.section}`} aria-label='Four connected layers of AtomsAI' data-section='offerings'><ol className={styles.layerPath} aria-label='How the layers connect'>{['Models & infrastructure', 'Orchestration & workflows', 'Applications', 'Custom AI engineering'].map((label, index) => <li key={label}><span>0{index + 1}</span>{label}</li>)}</ol><div className={styles.grid}>{offers.map(offer=><OfferingCard className={`${styles.card} theme-light`} href={offer.href} name={offer.name} key={offer.name}>
  <div className={styles.backgroundClip} data-offering-clip aria-hidden='true'><div className={styles.backgroundLayer} data-offering-background>
  </div></div>
  <div className={styles.illustration}><InfrastructureFigure name={offer.illustration} variant="outline" /></div>
  <div className={styles.copy}><span className={styles.tag}>{offer.name.slice(0, 2)}</span><h2 className={`display ${styles.title}`}>{offer.lines.map((line, index) => <span key={line}>{index > 0 && <><br />{' '}</>}{line}</span>)}</h2><p className={styles.description}>{offer.description}</p></div>
  <span className={styles.link}><span className="link-underline">{offer.action}</span><ArrowIcon direction="up-right" size={16} /></span>
</OfferingCard>)}</div></section>;}
