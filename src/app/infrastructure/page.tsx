import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { InfrastructurePage } from '@/components/pages/infrastructure-page';
import { clientPages } from '@/components/pages/client-content';

const content = clientPages.infrastructure;
export const metadata: Metadata = shareMetadata({
  title: `${content.label} | AtomsAI`,
  description: content.intro[0],
  path: content.route,
});

export default function Page() {
  return <PageShell initialTheme="dark"><InfrastructurePage /></PageShell>;
}
