'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { MotionPattern } from '@/components/patterns/motion-pattern';

const Glass = lazy(() => import('./fluted-glass'));
export type FlutedPatternProps = { count: number; onAvailabilityChange: (available: boolean) => void };

export function FlutedFallback({ count, onAvailabilityChange }: FlutedPatternProps) {
  return <div data-fluted-hero="fallback" style={{ width: '100%', height: '100%' }}>
    <MotionPattern kind="offset" count={count} mode="dark" fit="stretch" motion="tide"
      duration={12} intensity={0.7} resolution="display" onAvailabilityChange={onAvailabilityChange} />
  </div>;
}

export function FlutedPattern(props: FlutedPatternProps) {
  const [supported, setSupported] = useState<boolean>();
  useEffect(() => {
    let current = true;
    async function probe() {
      try {
        const { gpu } = navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } };
        const adapter = await gpu?.requestAdapter();
        if (current) setSupported(Boolean(adapter));
      } catch {
        if (current) setSupported(false);
      }
    }
    void probe();
    return () => { current = false; };
  }, []);
  if (supported === undefined) return null;
  return supported ? <Suspense fallback={null}><Glass {...props} /></Suspense> : <FlutedFallback {...props} />;
}
