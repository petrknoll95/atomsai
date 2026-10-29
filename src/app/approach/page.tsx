import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ApproachPage } from '@/components/pages/approach-page';

export const metadata: Metadata = {
  title: 'AI Services — From workflow to working system | AtomsAI',
  description: 'Find the right workflow, build it into your systems, and put your team in control. Explore the five steps of an AtomsAI engagement.',
  alternates: { canonical: 'https://atomsai.com/approach' },
};

export default function Page() {
  return <PageShell><ApproachPage /></PageShell>;
}
