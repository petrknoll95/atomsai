import { useEffect, useState, type RefObject } from 'react';
import type { PatternData, PatternKind } from './source-data';

const loaders = {
  drift: () => import('./sources/drift'),
  offset: () => import('./sources/offset'),
  'single-band': () => import('./sources/single-band'),
  concentric: () => import('./sources/concentric'),
};

export function usePatternData(kind: PatternKind, canvas: RefObject<HTMLCanvasElement | null>, margin: string | null) {
  const [data, setData] = useState<PatternData>();
  useEffect(() => {
    let current = true;
    const load = () => {
      void loaders[kind]().then(module => { if (current) setData(module.default); });
    };
    const observer = margin === null ? null : new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer?.disconnect();
        load();
      }
    }, { rootMargin: margin });
    if (observer && canvas.current) observer.observe(canvas.current);
    else load();
    return () => { current = false; observer?.disconnect(); };
  }, [canvas, kind, margin]);
  return data?.source.kind === kind ? data : undefined;
}
