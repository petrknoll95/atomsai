import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ApproachPage } from '@/components/pages/approach-page';

export const metadata: Metadata = shareMetadata({
  title: 'AI Services — Put AI where the work happens | AtomsAI',
  description: 'We find the process worth fixing, build AI into the systems you already run, and stay until it holds up in production. Then it runs without us.',
  path: '/approach',
});

export default function Page() {
  return <PageShell initialTheme="dark"><ApproachPage /></PageShell>;
}
