'use client';

import { useEffect, useRef } from 'react';
import { mountOperatingModel } from '@/components/home/operating-model-three';

export default function DiagramStudy() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ?plane=0|1|2|3 renders one plane as a still in the light menu palette, for
    // scripts/render-menu-planes.mjs. Without it, this is the interactive study.
    const plane = new URLSearchParams(location.search).get('plane');
    const isolate = plane === null ? undefined : Number(plane);
    if (isolate !== undefined) {
      root.current!.dataset.capture = 'true';
      host.current!.style.setProperty('--diagram-fill', 'var(--palette-paper)');
      host.current!.style.setProperty('--diagram-ink', 'var(--palette-forest-shade)');
    }
    const diagram = mountOperatingModel(host.current!, {
      trigger: root.current!, pin: stage.current!, interactive: isolate === undefined,
      scroll: isolate === undefined, isolate, capture: isolate !== undefined,
    });
    return () => diagram.destroy();
  }, []);

  return <main ref={root} data-diagram-study aria-label="Four outlined square planes with an AtomsAI logo cutout in the top plane">
    <title>Diagram study · AtomsAI</title>
    <meta name="robots" content="noindex, nofollow" />
    <div ref={stage} data-diagram-stage data-expansion="0"><div ref={host} data-diagram-canvas aria-hidden="true" /></div>
    <style>{`
      [data-diagram-study] { position: relative; }
      [data-diagram-stage] {
        height: 100svh;
        width: 100%;
        display: grid;
        place-items: center;
        padding: 20px;
      }
      [data-diagram-canvas] {
        width: min(650px, calc(100vw - 40px));
        height: min(660px, calc(100svh - 40px));
      }
      [data-diagram-study] canvas { display: block; width: 100%; height: 100%; }
      [data-diagram-study][data-capture] [data-diagram-canvas] { width: 520px; height: 400px; }
      body:has([data-diagram-study]) > .skip-link,
      body:has([data-diagram-study]) [data-feedback] { display: none; }
    `}</style>
  </main>;
}
