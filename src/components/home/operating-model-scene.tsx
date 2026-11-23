'use client';

import { useEffect, useRef } from 'react';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import type { OperatingModelController } from './operating-model-three';
import { expandPinnedRow, TRANSITION } from './operating-model-expand';
import styles from './operating-model.module.css';

export type OperatingModelSceneProps = {
  active: number;
  selection: { index: number } | null;
  onHighlight: (index: number) => void;
};

type StackMount = typeof import('./operating-model-three').mountOperatingModel;
export type OperatingModelMount = (
  element: HTMLElement,
  options: Parameters<StackMount>[1] & { initialIndex: number },
) => OperatingModelController;

export function useOperatingModelScene({ selection, onHighlight }: OperatingModelSceneProps, loadMount: () => Promise<OperatingModelMount>) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<OperatingModelController | null>(null);
  const pendingSelection = useRef<number | null>(null);

  useEffect(() => {
    if (!selection) return;
    if (controller.current) controller.current.select(selection.index);
    else pendingSelection.current = selection.index;
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
    let mount: OperatingModelMount | undefined;
    const configure = () => {
      if (!mount || disposed) return;
      // Adding or removing the pin changes the page height above anyone already past the
      // section; keep what they are looking at in place instead of letting the page jump.
      const heightBefore = document.documentElement.scrollHeight;
      const viewerBelow = section.getBoundingClientRect().bottom <= 0;
      collapse?.();
      collapse = undefined;
      controller.current?.destroy();
      // Desktop pins the diagram row (it expands to the viewport); tablet pins the
      // headline with it so the section reads as one unit; short screens pin the visual.
      // Mobile leaves room for native page scrolling and direct diagram controls.
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
        // Desktop: room after the last layer for the panel to shrink back.
        tail: mode === 'row' && backdrop ? TRANSITION : 0,
        initialIndex: Number(visual.dataset.active),
        onHighlight,
      });
      const pinTrigger = controller.current.pin;
      if (desktop.matches && pin === row && backdrop && pinTrigger) {
        collapse = expandPinnedRow({ row, backdrop, pin: pinTrigger, pinnedTop, collapseShare: controller.current.tailShare });
      }
      const delta = document.documentElement.scrollHeight - heightBefore;
      if (viewerBelow && delta) {
        const smoother = ScrollSmoother.get();
        if (smoother) smoother.scrollTo(smoother.scrollTop() + delta, false);
        else window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' });
      }
      if (pendingSelection.current !== null) {
        controller.current.select(pendingSelection.current);
        pendingSelection.current = null;
      }
    };
    // Mount soon after load rather than on approach: the pin adds several viewport heights
    // of scroll, which must exist before a visitor (e.g. after a reload near the bottom)
    // scrolls back up into the section. Approaching it still mounts immediately.
    let loading = false;
    const load = () => {
      if (loading || disposed) return;
      loading = true;
      observer.disconnect();
      void loadMount().then(createController => {
        if (disposed) return;
        mount = createController;
        configure();
      }).catch(() => { /* Keep the static illustration and accessible descriptions available. */ });
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) load();
    }, { rootMargin: '500px' });
    observer.observe(element);
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle ? window.requestIdleCallback(load, { timeout: 2000 }) : setTimeout(load, 800);
    wide.addEventListener('change', configure);
    desktop.addEventListener('change', configure);
    mobile.addEventListener('change', configure);
    reduced.addEventListener('change', configure);
    return () => {
      disposed = true;
      observer.disconnect();
      if (hasIdle) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle);
      wide.removeEventListener('change', configure);
      desktop.removeEventListener('change', configure);
      mobile.removeEventListener('change', configure);
      reduced.removeEventListener('change', configure);
      collapse?.();
      controller.current?.destroy();
      controller.current = null;
      delete section.dataset.modelPin;
    };
  }, [loadMount, onHighlight]);

  return host;
}

const loadStack = () => import('./operating-model-three').then(module => module.mountOperatingModel);

export function OperatingModelScene(props: OperatingModelSceneProps) {
  const host = useOperatingModelScene(props, loadStack);

  return <div ref={host} className={styles.art} data-model-scene data-active={props.active} aria-hidden="true">
    <div className={styles.sceneFallback}><i/><i/><i/><i/></div>
  </div>;
}
