import type { Metadata } from 'next';
import { Pattern } from '@/components/patterns/pattern';
import { HomePattern, homePatternPlacements, type HomePatternApplication } from '@/components/patterns/home-pattern';
import type { PatternKind } from '@/components/patterns/types';
import styles from '@/components/patterns/pattern-lab.module.css';

export const metadata: Metadata = {
  title: 'Pattern render · AtomsAI',
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;

function first(value: Query[string]) {
  return Array.isArray(value) ? value[0] : value;
}

function number(value: Query[string], fallback: number, min: number, max: number) {
  const text = first(value);
  const parsed = text?.trim() ? Number(text) : NaN;
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

export default async function PatternRenderPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const application = first(query.application);
  if (application && Object.hasOwn(homePatternPlacements, application)) {
    const placement = homePatternPlacements[application as HomePatternApplication];
    return <main className={styles.fixture} style={{ position: 'relative', width: placement.viewport[0], height: placement.viewport[1], background: application === 'cta-pattern' ? 'color-mix(in display-p3, var(--palette-cream) 10%, var(--palette-forest-shade))' : 'var(--palette-paper)' }}>
      <HomePattern animated={false} application={application as HomePatternApplication} loading="eager" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: placement.radius === 'circle' ? '50%' : placement.radius }} />
    </main>;
  }
  const requestedKind = first(query.kind);
  const kind: PatternKind = requestedKind === 'offset' || requestedKind === 'single-band' || requestedKind === 'concentric'
    ? requestedKind : 'drift';
  const count = Math.round(number(query.count, kind === 'concentric' ? 15 : 5, 1, 80));
  const size = Math.round(number(query.size, 800, 1, 4096));

  return (
    <main className={styles.fixture} style={{ width: size, height: size }}>
      <Pattern
        kind={kind}
        count={count}
        mode={first(query.mode) === 'dark' ? 'dark' : 'light'}
        rotation={number(query.rotation, 0, -180, 180)}
        zoom={number(query.zoom, 1, 1, 3)}
        panX={number(query.panX, 0, -1, 1)}
        panY={number(query.panY, 0, -1, 1)}
        style={{ display: 'block', width: '100%', height: '100%' }}
        label={`${kind} pattern, ${count} repetitions`}
      />
    </main>
  );
}
