import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { BlogPage } from '@/components/blog/blog-page';

export const metadata: Metadata = {
  title: 'Notes from the field | AtomsAI',
  description: 'Working notes from the teams building AtomsAI, on phone audio, voice agents, and the software that has to hold up around a call.',
  alternates: { canonical: 'https://atomsai.com/blog' },
};

export default function Page() {
  return <PageShell><BlogPage /></PageShell>;
}
