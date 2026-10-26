import type { Metadata } from 'next';
import { PatternLab } from '@/components/patterns/pattern-lab';

export const metadata: Metadata = {
  title: 'Pattern studio · AtomsAI',
  description: 'Explore the AtomsAI pattern families and compare their original settings.',
  robots: { index: false, follow: false },
};

export default function PatternsPage() {
  return <PatternLab />;
}
