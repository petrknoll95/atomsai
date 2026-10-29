import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { BlogPage } from '@/components/blog/blog-page';

export const metadata: Metadata = {
  title: 'Blog | AtomsAI',
  description: 'Notes on AI workflows, evaluation, and the work between a demo and production, from AtomsAI.',
  alternates: { canonical: 'https://atomsai.com/blog' },
};

export default function Page() {
  return <PageShell><BlogPage /></PageShell>;
}
