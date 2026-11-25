import { Stories } from './stories';
import { UseCases } from './use-cases';
import { Hero as NebulaHero } from '@/components/home/hero';
import { SiteHeader } from '@/components/home/site-header';
import { MenuHero } from '@/components/home/menu-hero';
import { PlainHero } from '@/components/home/plain-hero';
import { OperatingModel } from './operating-model';
import { OperatingModelCarousel } from './operating-model-carousel';
import { Applications } from '@/components/home/applications';
import { ApplicationsWorkflow } from '@/components/home/applications-workflow';
import { CompanyProof, PointOfView, TrustSummary, FieldNotes } from './story-sections';
import { Faq } from '@/components/home/faq';
import { SiteFooter } from '@/components/home/site-footer';
import { SectionReveals } from '@/components/motion/section-reveals';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { StarfieldHero } from '@/components/home/starfield-hero/hero';
import { Integrations } from '@/components/home/integrations';
import { IntegrationsMarquee } from '@/components/home/integrations-marquee';

export function HomePage({
  heroVariant = 'menu',
  integrationsVariant = 'grid',
  applicationsVariant = 'workflow',
  operatingModelVariant = 'stack',
}: {
  heroVariant?: 'menu' | 'plain' | 'stars' | 'nebula';
  integrationsVariant?: 'grid' | 'marquee';
  applicationsVariant?: 'original' | 'workflow';
  operatingModelVariant?: 'stack' | 'carousel';
}) {
  const Hero = heroVariant === 'menu' ? MenuHero : heroVariant === 'plain' ? PlainHero : heroVariant === 'nebula' ? NebulaHero : StarfieldHero;
  const ModelSection = operatingModelVariant === 'carousel' ? OperatingModelCarousel : OperatingModel;
  return <><SiteHeader initialTheme={heroVariant === 'plain' || heroVariant === 'menu' ? 'dark' : 'light'}/><SmoothScroll><SectionReveals id='top'><main id='main' className="bg-background" data-theme="light"><Hero><CompanyProof showProducts={heroVariant !== 'menu'}/><ModelSection/></Hero><PointOfView/>{applicationsVariant === 'original' ? <Applications/> : <ApplicationsWorkflow/>}<Stories/><TrustSummary/><UseCases/>{integrationsVariant === 'marquee' ? <IntegrationsMarquee/> : <Integrations/>}<FieldNotes/><Faq/></main><SiteFooter homepage/></SectionReveals></SmoothScroll></>;
}
