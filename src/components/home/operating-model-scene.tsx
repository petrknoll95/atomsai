'use client';

import { useEffect, useRef } from 'react';
import type { OperatingModelController } from './operating-model-three';
import { expandPinnedRow } from './operating-model-expand';
import styles from './operating-model.module.css';

export function OperatingModelScene({ active, selection, onHighlight }: {
  active: number;
  selection: { index: number } | null;
  onHighlight: (index: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<OperatingModelController | null>(null);

  useEffect(() => {
    if (selection) controller.current?.select(selection.index);
  }, [selection]);

  useEffect(() => {
    const element = host.current!;
    const section = element.closest<HTMLElement>('#offerings')!;
    const visual = element.closest<HTMLElement>('[data-model-visual]')!;
    const row = element.closest<HTMLElement>('[data-model-row]')!;
    const stage = element.closest<HTMLElement>('[data-model-stage]') ?? row;
    const wide = matchMedia('(min-width: 768px) and (min-height: 700px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 1200px) and (min-height: 700px)');
    const mobile = matchMedia('(max-width: 767px)');
    const backdrop = row.querySelector<HTMLElement>('[data-model-backdrop]');
    let collapse: (() => void) | undefined;
    let disposed = false;
    let mount: typeof import('./operating-model-three').mountOperatingModel | undefined;
    const configure = () => {
      if (!mount || disposed) return;
      collapse?.();
      collapse = undefined;
      controller.current?.destroy();
      // Desktop pins the diagram row (it expands to the viewport); tablet pins the
      // headline with it so the section reads as one unit; short screens pin the visual.
      // Mobile doesn't pin or scroll-animate: the tabs alone drive the diagram.
      const mode = mobile.matches ? 'none' : !wide.matches ? 'visual' : desktop.matches ? 'row' : 'stage';
      const pin = mode === 'visual' || mode === 'none' ? visual : mode === 'row' ? row : stage;
      section.dataset.modelPin = mode;
      const pinnedTop = () => {
        const headerSpace = 96;
        return Math.max(headerSpace, headerSpace + (window.innerHeight - headerSpace - pin.offsetHeight) / 2);
      };
      controller.current = mount(element, {
        trigger: pin,
        pin,
        start: () => `top ${pinnedTop()}px`,
        scroll: mode !== 'none',
        onHighlight,
      });
      const pinTrigger = controller.current.pin;
      if (desktop.matches && pin === row && backdrop && pinTrigger) {
        collapse = expandPinnedRow({ row, backdrop, pin: pinTrigger, pinnedTop });
      }
    };
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void import('./operating-model-three').then(module => {
        if (disposed) return;
        mount = module.mountOperatingModel;
        configure();
      }).catch(() => { /* Keep the static stack and accessible descriptions available. */ });
    }, { rootMargin: '500px' });
    observer.observe(element);
    wide.addEventListener('change', configure);
    desktop.addEventListener('change', configure);
    mobile.addEventListener('change', configure);
    reduced.addEventListener('change', configure);
    return () => {
      disposed = true;
      observer.disconnect();
      wide.removeEventListener('change', configure);
      desktop.removeEventListener('change', configure);
      mobile.removeEventListener('change', configure);
      reduced.removeEventListener('change', configure);
      collapse?.();
      controller.current?.destroy();
      controller.current = null;
      delete section.dataset.modelPin;
    };
  }, [onHighlight]);

  return <div ref={host} className={styles.art} data-model-scene data-active={active} aria-hidden="true">
    <div className={styles.sceneFallback}><i/><i/><i/><i/></div>
  </div>;
}
