import { Hero, SiteHeader } from '@/components/home/hero';
import { Offerings } from '@/components/home/offerings';
import { Applications } from '@/components/home/applications';
import { Preview } from '@/components/home/preview';
import { Industries } from '@/components/home/industries';
import { Stories } from '@/components/home/stories';
import { Faq } from '@/components/home/faq';
import { Closing } from '@/components/home/closing';
import { SectionReveals } from '@/components/motion/section-reveals';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
export default function Home(){return <><SiteHeader/><SmoothScroll><SectionReveals id='top'><main id='main'><Hero/><div id='offerings'><Offerings/></div><Applications/><Preview/><Industries/><Stories/><Faq/></main><Closing/></SectionReveals></SmoothScroll></>;}
