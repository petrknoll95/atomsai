'use client';

import type { ReactNode } from 'react';
import { PrototypeHero } from './prototype-hero/hero';
export { SiteHeader } from './site-header';

export function Hero({ children }: { children: ReactNode }) {
  return <PrototypeHero>{children}</PrototypeHero>;
}
