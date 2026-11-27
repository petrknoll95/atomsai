import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ApproachPage } from '@/components/pages/approach-page';
import { approachContent } from '@/components/pages/approach-content';
import { FooterCtaMuted } from '@/components/home/site-footer-directory';
import { ButtonLink } from '@/components/ui';

export const metadata: Metadata = shareMetadata({
  title: 'AI Services — Put AI where the work happens | AtomsAI',
  description: 'We find the process worth fixing, build AI into the systems you already run, and stay until it holds up in production. Then it runs without us.',
  path: '/approach',
});

/** The page ends the way the homepage does: straight into the footer's CTA band, which carries its closing line. */
const footerCta = {
  heading: <>What would you change <FooterCtaMuted>about how work gets done?</FooterCtaMuted></>,
  lead: approachContent.closing.body[0],
  actions: <ButtonLink href="/company/contact?topic=services" size="large">Talk to AtomsAI</ButtonLink>,
};

export default function Page() {
  return <PageShell initialTheme="light" footerCta={footerCta}><ApproachPage /></PageShell>;
}
