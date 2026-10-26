import { Eyebrow } from '@/components/ui';
import { HomePattern } from '@/components/patterns/home-pattern';
import styles from './offerings.module.css';
const offers=[
  {name:'Applications', lines:['More conversations.','Less chasing.'], action:'Find your application',href:'#applications',pattern:'offerings-drift',icon:'EveryThreadToOneCentre11'},
  {name:'Models & Infrastructure',lines:['Models and infrastructure.','More room to build.'],action:'Explore PyAI',href:'https://pyai.com/',pattern:'offerings-concentric',icon:'RisingOffABase11'},
  {name:'AI Services',lines:['When the right solution','doesn’t exist yet.'],action:'Discuss your project',href:'https://atomsai.com/company/contact',pattern:'offerings-band',icon:'RaysAroundACoreOneStillMissing11'},
] as const;
export function Offerings(){return <section className={`page-container ${styles.section}`} aria-label='Three ways to work with AtomsAI' data-section='offerings'><Eyebrow>Try the technology</Eyebrow><div className={styles.grid}>{offers.map((offer,i)=><a className={`${styles.card} theme-dark`} href={offer.href} key={offer.name}>
  <HomePattern application={offer.pattern} className={`${styles.pattern} ${i===1?styles.concentric:''}`} />
  <div className={`${styles.colorBurn} ${i>0?styles.lightBurn:''}`} aria-hidden='true'/><div className={styles.screen} aria-hidden='true'/>
  <img className={styles.icon} src={`/assets/figma/offerings-${offer.icon}.svg`} width='80' height='80' alt=''/>
  <div className={styles.copy}><span className={styles.tag}>{offer.name}</span><h2 className={`display ${styles.title}`}>{offer.lines[0]}<br/>{' '}{offer.lines[1]}</h2></div>
  <span className={styles.link}>{offer.action}<img src='/assets/figma/offerings-Union.svg' width='16' height='16' alt=''/></span>
</a>)}</div></section>;}
