import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { FooterCtaMuted } from '@/components/home/site-footer-directory';
import { PageShell } from '@/components/pages/page-shell';
import { InfrastructurePage, splitAfter } from '@/components/pages/infrastructure-page';
import { clientPages } from '@/components/pages/client-content';

const content = clientPages.infrastructure;
export const metadata: Metadata = shareMetadata({
  title: 'Infrastructure — PyAI | AtomsAI',
  description: content.intro[0],
  path: content.route,
});

// The page closes straight into the footer's dark band, with its own line and actions.
// The muted clause starts its own line, so "or" never trails the first one.
const [getKey, contact] = content.closing.links;
const [claim, turn] = splitAfter(content.closing.title, 'key,');
const footerCta = {
  heading: <>{claim}<br /><FooterCtaMuted>{turn}</FooterCtaMuted></>,
  actions: <>
    <ButtonLink href={getKey.href} size="large" target="_blank" rel="noopener noreferrer">{getKey.label}<ArrowIcon direction="up-right" size={18} /></ButtonLink>
    <ButtonLink href={contact.href} size="large" variant="outline">{contact.label}</ButtonLink>
  </>,
};

export default function Page() {
  return <PageShell initialTheme="dark" footerCta={footerCta}><InfrastructurePage /></PageShell>;
}
