import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PatternRenderClient } from '@/components/patterns/pattern-render-client';

export const metadata: Metadata = { title: 'Pattern render · AtomsAI', robots: { index: false, follow: false } };

export default function PatternRenderPage() {
  return <Suspense fallback={null}><PatternRenderClient /></Suspense>;
}
