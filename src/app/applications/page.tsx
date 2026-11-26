import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ApplicationsPage } from '@/components/pages/applications-page';
import content from '@/content/client-pages/applications.json';

export const metadata: Metadata = shareMetadata({
  title: 'Applications — JustCall and ServiceAgent | AtomsAI',
  description: content.intro[1],
  path: content.route,
});

export default function Page() {
  return <PageShell initialTheme="light"><ApplicationsPage /></PageShell>;
}
