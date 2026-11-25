import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { VoicePage } from '@/components/pages/voice-page';

export const metadata: Metadata = shareMetadata({
  title: 'Voice AI — Conversations that move work forward | AtomsAI',
  description: 'Voice agents that answer in context, connect to your tools, and help callers take the next step. Explore a sample and plan your first voice workflow.',
  path: '/capabilities/voice',
});

export default function Page() {
  return <PageShell><VoicePage /></PageShell>;
}
