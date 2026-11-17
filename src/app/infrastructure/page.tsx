import type { Metadata } from 'next';
import { PageShell } from '@/components/pages/page-shell';
import { ClientContentPage } from '@/components/pages/content-page';
import { clientPages } from '@/components/pages/client-content';

const content = clientPages['infrastructure'];
export const metadata: Metadata = {
  title: `${content.label} | AtomsAI`,
  description: content.intro[0],
  alternates: { canonical: `https://atomsai.com${content.route}` },
};

export default function Page() {
  return <PageShell><ClientContentPage name="infrastructure" /></PageShell>;
}
