import { ArrowIcon } from '@/components/arrow-icon';
import { InfrastructureFigure } from './infrastructure-figure';
import { OfferingCard } from './offering-card';
import { offeringIllustrations } from './offering-illustrations';
import styles from './offerings.module.css';
const offers=[
  {name:'Applications', lines:['More conversations.','Less chasing.'], action:'Find your application',href:'#applications',illustration:offeringIllustrations.applications},
  {name:'Models & Infrastructure',lines:['Models and infrastructure.','More room to build.'],action:'Explore PyAI',href:'https://pyai.com/',illustration:offeringIllustrations.infrastructure},
  {name:'AI Services',lines:['When the right solution','doesn’t exist yet.'],action:'Discuss your project',href:'/company/contact',illustration:offeringIllustrations.services},
] as const;
export function Offerings(){return <section className={`page-container ${styles.section}`} aria-label='Three ways to work with AtomsAI' data-section='offerings'><div className={styles.grid}>{offers.map(offer=><OfferingCard className={`${styles.card} theme-light`} href={offer.href} name={offer.name} key={offer.name}>
  <div className={styles.backgroundClip} data-offering-clip aria-hidden='true'><div className={styles.backgroundLayer} data-offering-background>
  </div></div>
  <div className={styles.illustration}><InfrastructureFigure name={offer.illustration} variant="outline" /></div>
  <div className={styles.copy}><span className={styles.tag}>{offer.name}</span><h2 className={`display ${styles.title}`}>{offer.lines[0]}<br/>{' '}{offer.lines[1]}</h2></div>
  <span className={styles.link}><span className="link-underline">{offer.action}</span><ArrowIcon direction="up-right" size={16} /></span>
</OfferingCard>)}</div></section>;}
