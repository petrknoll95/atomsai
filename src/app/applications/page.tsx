import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ApplicationsPage } from '@/components/pages/applications-page';
import { FooterCtaMuted } from '@/components/home/site-footer-directory';
import { ButtonLink } from '@/components/ui';
import content from '@/content/client-pages/applications.json';

export const metadata: Metadata = shareMetadata({
  title: 'Applications — JustCall and ServiceAgent | AtomsAI',
  description: content.intro[1],
  path: content.route,
});

/** The page ends the way the homepage does: straight into the footer's CTA band, which carries its closing line. */
const footerCta = {
  heading: <>There’s a lot riding <FooterCtaMuted>on the next hello.</FooterCtaMuted></>,
  actions: <ButtonLink href="/company/contact" size="large">Talk to AtomsAI</ButtonLink>,
};

export default function Page() {
  return <PageShell initialTheme="light" footerCta={footerCta}><ApplicationsPage /></PageShell>;
}
