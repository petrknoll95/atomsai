import type { Metadata } from 'next';
import { MotionLab } from '@/components/patterns/motion-lab';

export const metadata: Metadata = {
  title: 'Motion studies · AtomsAI',
  description: 'Four subtle, palette-preserving loops for the AtomsAI pattern shaders.',
  robots: { index: false, follow: false },
};

export default function MotionPage() { return <MotionLab />; }
