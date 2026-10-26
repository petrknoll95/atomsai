'use client';

import { useEffect, useRef, useState } from 'react';
import { createPatternRenderer } from './renderer';
import type { PatternProps } from './types';

export type { PatternProps, PatternOptions, PatternKind, PatternColors, PatternColor, PatternMode } from './types';

/** Static procedural pattern; changing props updates the shader, without a clock. */
export function Pattern({ className, style, label, loading = 'eager', ...options }: PatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ReturnType<typeof createPatternRenderer> | null>(null);
  const latest = useRef(options);
  const loadingMode = useRef(loading);
  const redraw = useRef<() => void>(() => {});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let activated = false;
    let contextLost = false;
    let lastDraw: string | null = null;
    let intersection: IntersectionObserver | null = null;
    const render = () => {
      if (!activated) {
        if (loadingMode.current === 'lazy' && typeof IntersectionObserver !== 'undefined') {
          intersection ??= new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            // Start once. Scrolling away retains the still and its renderer;
            // later prop changes and resizes continue to update it normally.
            activated = true;
            intersection?.disconnect(); intersection = null;
            render();
          }, { rootMargin: '400px' });
          intersection.observe(canvas);
          return;
        }
        activated = true;
        intersection?.disconnect(); intersection = null;
      }
      if (contextLost) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const width = canvas.clientWidth, height = canvas.clientHeight;
        if (!canvas.isConnected || !width || !height || contextLost) return;
        const pixelRatio = window.devicePixelRatio;
        // Value-based comparison also ignores recreated/reordered color objects.
        const signature = JSON.stringify([width, height, pixelRatio, latest.current], (_key, value) =>
          value && typeof value === 'object' && !Array.isArray(value)
            ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
            : value);
        if (signature === lastDraw) return;
        canvas.dataset.renderState = 'pending';
        try {
          rendererRef.current ??= createPatternRenderer(canvas);
          rendererRef.current.render(latest.current, width, height, pixelRatio);
          lastDraw = signature;
          setError(null);
        } catch (cause) {
          lastDraw = null;
          const message = cause instanceof Error ? cause.message : 'Pattern rendering failed.';
          canvas.dataset.renderState = 'error'; setError(message);
        }
      });
    };
    redraw.current = render;
    const lost = (event: Event) => {
      event.preventDefault(); cancelAnimationFrame(frame);
      contextLost = true; lastDraw = null;
      canvas.dataset.renderState = 'lost'; rendererRef.current = null;
    };
    const restored = () => { contextLost = false; lastDraw = null; render(); };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    const observer = new ResizeObserver(render); observer.observe(canvas);
    window.addEventListener('resize', render);
    render();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); intersection?.disconnect(); window.removeEventListener('resize', render);
      canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored);
      rendererRef.current?.dispose(); rendererRef.current = null; redraw.current = () => {};
    };
  }, []);
  useEffect(() => { latest.current = options; loadingMode.current = loading; redraw.current(); }, [options.kind, options.count, options.mode, options.fit, options.blurScale, options.rotation, options.zoom, options.panX, options.panY, options.colors, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>
    <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%', ...style }} role='img' aria-label={label ?? `${options.kind} pattern, ${options.count} ${options.kind === 'concentric' ? 'rings' : 'slits'}`} data-pattern={options.kind} data-count={options.count} data-render-state='pending'>Procedural {options.kind} pattern.</canvas>
    {error && <p role='alert'>The pattern could not be rendered. {error}</p>}
  </>;
}

export type PatternVariantProps = Omit<PatternProps, 'kind'>;
export const DriftPattern = (props: PatternVariantProps) => <Pattern {...props} kind='drift' />;
export const OffsetPattern = (props: PatternVariantProps) => <Pattern {...props} kind='offset' />;
export const SingleBandPattern = (props: PatternVariantProps) => <Pattern {...props} kind='single-band' />;
export const ConcentricPattern = (props: PatternVariantProps) => <Pattern {...props} kind='concentric' />;
