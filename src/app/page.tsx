import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
export default function Home() { return <HomePage />; }

export const metadata: Metadata = { title: 'AtomsAI — AI that works today. Built to get better tomorrow.', description: 'At AtomsAI, models power products. Products inform better technology. And solving new business problems gives both more to build on. Together, they make possible what no single product could.' };
