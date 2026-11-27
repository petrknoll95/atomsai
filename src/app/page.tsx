import { shareMetadata } from '@/lib/share-metadata';
import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
export default function Home() { return <HomePage operatingModelVariant="carousel" />; }

export const metadata: Metadata = shareMetadata({
  path: '/',
  title: 'AtomsAI — AI that works today. Built to get better tomorrow.',
  description: 'Explore AtomsAI’s voice and messaging applications, AI infrastructure, and engineering services for the conversations that keep businesses moving.',
});
