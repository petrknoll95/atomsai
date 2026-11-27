import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ApproachPage } from '@/components/pages/approach-page';
import { approachContent } from '@/components/pages/approach-content';
import { FooterCtaMuted } from '@/components/home/site-footer-directory';
import { ButtonLink } from '@/components/ui';

export const metadata: Metadata = shareMetadata({
  title: 'AI Services — Put AI where the work actually happens | AtomsAI',
  description: 'We find the process worth fixing, build AI into the systems you already run, and stay until it holds up in production. Then it runs without us.',
  path: '/approach',
});

/** The closing question in two tones, as in the prototype: the ask, then muted, what it is about. */
const closing = approachContent.closing;
const turnAt = closing.title.indexOf(' about ');
const [contact] = closing.links;

/** The page ends the way the homepage does: straight into the footer's CTA band, which carries its closing line. */
const footerCta = {
  heading: turnAt < 0 ? closing.title : <>{closing.title.slice(0, turnAt)} <FooterCtaMuted>{closing.title.slice(turnAt + 1)}</FooterCtaMuted></>,
  lead: closing.body[0],
  actions: <ButtonLink href={contact.href} size="large">{contact.label}</ButtonLink>,
  wide: true,
};

export default function Page() {
  return <PageShell initialTheme="light" footerCta={footerCta}><ApproachPage /></PageShell>;
}
