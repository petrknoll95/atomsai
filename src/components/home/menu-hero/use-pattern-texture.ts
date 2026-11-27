'use client';

import { useEffect, useState, type RefObject } from 'react';
import offsetData from '@/components/patterns/sources/offset';
import { createPatternRenderer } from '@/components/patterns/renderer';

/** Capture the original Figma-derived offset pattern once per size, not per frame. */
export function usePatternTexture(host: RefObject<HTMLDivElement | null>, count: number) {
  const [texture, setTexture] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const source = document.createElement('canvas');
    let renderer: ReturnType<typeof createPatternRenderer> | undefined;
    let frame = 0;
    let signature = '';
    const capture = () => {
      frame = 0;
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const next = `${Math.round(width)}:${Math.round(height)}:${devicePixelRatio}`;
      if (next === signature) return;
      try {
        renderer ??= createPatternRenderer(source, offsetData);
        renderer.render({ kind: 'offset', count, mode: 'dark', fit: 'stretch' }, width, height, Math.min(devicePixelRatio, 1.5));
        setTexture(source.toDataURL('image/png'));
        signature = next;
      } catch {
        setFailed(true);
      }
    };
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(capture);
    });
    resize.observe(element);
    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      renderer?.dispose();
      source.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [count, host]);

  return { texture, failed };
}
