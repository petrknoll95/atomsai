import { Hero as NebulaHero } from '@/components/home/hero';
import { SiteHeader } from '@/components/home/site-header';
import { MenuHero } from '@/components/home/menu-hero';
import { PlainHero } from '@/components/home/plain-hero';
import { Offerings } from '@/components/home/offerings';
import { Applications } from '@/components/home/applications';
import { ApplicationsWorkflow } from '@/components/home/applications-workflow';
import { Preview } from '@/components/home/preview';
import { Industries } from '@/components/home/industries';
import { Stories } from '@/components/home/stories';
import { Faq } from '@/components/home/faq';
import { SiteFooter } from '@/components/home/site-footer';
import { SectionReveals } from '@/components/motion/section-reveals';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { StarfieldHero } from '@/components/home/starfield-hero/hero';
import { Intro } from '@/components/home/intro';
import { Integrations } from '@/components/home/integrations';
import { IntegrationsMarquee } from '@/components/home/integrations-marquee';

export function HomePage({ heroVariant = 'menu', integrationsVariant = 'grid', applicationsVariant = 'workflow' }: { heroVariant?: 'menu' | 'plain' | 'stars' | 'nebula'; integrationsVariant?: 'grid' | 'marquee'; applicationsVariant?: 'original' | 'workflow' }){ const Hero = heroVariant === 'menu' ? MenuHero : heroVariant === 'plain' ? PlainHero : heroVariant === 'nebula' ? NebulaHero : StarfieldHero; return <><SiteHeader initialTheme={heroVariant === 'plain' || heroVariant === 'menu' ? 'dark' : 'light'}/><SmoothScroll><SectionReveals id='top'><main id='main' className="bg-background" data-theme="light"><Hero>{heroVariant !== 'nebula' && <Intro/>}<div id='offerings' data-text-reveal='off'><Offerings/></div></Hero>{applicationsVariant === 'original' ? <Applications/> : <ApplicationsWorkflow/>}<Preview/>{integrationsVariant === 'marquee' ? <IntegrationsMarquee/> : <Integrations/>}<Industries/><Stories/><Faq/></main><SiteFooter/></SectionReveals></SmoothScroll></>;}
