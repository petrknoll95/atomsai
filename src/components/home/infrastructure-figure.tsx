'use client';

import { assetPath } from '@/lib/base-path';

import { useEffect, useRef, type CSSProperties } from 'react';
import illustrationBounds from './illustration-bounds.json';
import styles from './infrastructure-figure.module.css';

export type FigureName = 'server-modules' | 'test-bench' | 'modular-cube' | 'nested-cube' | 'layered-planes';
type HairlineRuntime = { inject(root: Document): void };
type Figure = {
  range: [number, number, number];
  mount(host: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string }; animate?: boolean; interactive?: boolean }, value: number): { set(value: number): void; setActive?(active: boolean): void; destroy(): void };
};
declare global { interface Window { HL?: HairlineRuntime } }
let runtime: Promise<HairlineRuntime> | undefined;
function loadRuntime() {
  return runtime ??= new Promise<HairlineRuntime>((resolve, reject) => {
    if (window.HL) { resolve(window.HL); return; }
    const script = document.createElement('script');
    script.src = assetPath('/assets/hairline/kernel.js');
    script.onload = () => window.HL ? resolve(window.HL) : reject(new Error('Hairline did not initialize'));
    script.onerror = () => { script.remove(); runtime = undefined; reject(new Error('Hairline could not load')); };
    document.head.appendChild(script);
  });
}

/** A static fallback remains visible until the Hairline figure is mounted. */
export function InfrastructureFigure({ name, variant = 'panel' }: { name: FigureName; variant?: 'panel' | 'outline' }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current!, stage = stageRef.current!;
    let disposed = false, destroy: (() => void) | undefined;
    const load = async () => {
      try {
        const engine = await loadRuntime();
        const { default: figure } = await import(/* webpackIgnore: true */ assetPath(`/assets/hairline/${name}.mjs`)) as { default: Figure };
        if (disposed) return;
        engine.inject(document);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 400 320');
        svg.setAttribute('aria-hidden', 'true');
        stage.appendChild(svg);
        const card = host.closest<HTMLElement>('[data-offering]');
        const handle = figure.mount({ stage, svg, read: { textContent: 'rest' }, animate: true, interactive: !card }, figure.range[1]);
        if (variant === 'outline') {
          const bounds = svg.getBBox();
          // Keep the kernel's 400 × 320 pointer coordinates intact. Position
          // that full stage behind the cropped fallback instead of cropping
          // the SVG's coordinate system, which misaligns pointer hit areas.
          const width = bounds.width + 1, height = bounds.height + 1;
          stage.style.width = `${400 / width * 100}%`;
          stage.style.height = `${320 / height * 100}%`;
          stage.style.left = `${-(bounds.x - .5) / width * 100}%`;
          stage.style.top = `${-(bounds.y - .5) / height * 100}%`;
        }
        // Reuse the card's existing hover/focus state. The figure's own pointer
        // handler is disabled here so crossing its bounds cannot cancel the card hover.
        const syncCard = () => handle.setActive?.(card?.dataset.active === 'true');
        const cardObserver = card && handle.setActive ? new MutationObserver(syncCard) : undefined;
        if (card && cardObserver) {
          cardObserver.observe(card, { attributes: true, attributeFilter: ['data-active'] });
          syncCard();
        }
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateMotion = () => handle.set(figure.range[1]);
        preference.addEventListener('change', updateMotion);
        destroy = () => { cardObserver?.disconnect(); preference.removeEventListener('change', updateMotion); handle.destroy(); svg.remove(); };
        host.dataset.ready = 'true';
      } catch {
        // The authored static artwork is the complete no-script/error fallback.
      }
    };
    void load();
    return () => { disposed = true; destroy?.(); delete host.dataset.ready; };
  }, [name, variant]);
  if (variant === 'outline') {
    const bounds = illustrationBounds[name];
    return <div ref={hostRef} className={styles.outline} style={{ '--illustration-ink-ratio': bounds.width / 400 } as CSSProperties} aria-hidden="true" data-infrastructure-figure={name}>
      <div className={styles.outlineArt} style={{ aspectRatio: `${bounds.width} / ${bounds.height}` }}>
        <span className={styles.outlineFallback} style={{ maskImage: assetPath(`url(/assets/illustrations/${name}-outline.svg)`) }} />
        <div ref={stageRef} className={styles.stage} data-hairline={name} data-hairline-theme="light" />
      </div>
    </div>;
  }
  return <div ref={hostRef} className={styles.figure} aria-hidden="true" data-infrastructure-figure={name}>
    <img className={styles.fallback} src={assetPath(`/assets/illustrations/${name}.svg`)} alt="" width="400" height="320" />
    <div ref={stageRef} className={styles.stage} data-hairline={name} data-hairline-theme="light" />
  </div>;
}
