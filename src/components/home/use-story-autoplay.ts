'use client';

import { useEffect, useRef, useState } from 'react';
import type { EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

export const STORY_DELAY = 7000;

export function createStoryAutoplay() {
  const autoplay = Autoplay({
    delay: STORY_DELAY, playOnInit: false,
    stopOnInteraction: false, stopOnFocusIn: false, stopOnMouseEnter: false,
  });
  const initialize = autoplay.init;
  autoplay.init = (embla, optionsHandler) => {
    // Embla Autoplay 8 still stops on pointerDown even with stopOnInteraction
    // disabled (that option only resumes on pointerUp). Exclude those plugin
    // listeners through the public event API; Embla's own dragging stays intact.
    const isPointerEvent = (event: string) => event === 'pointerDown' || event === 'pointerUp';
    const pluginApi: EmblaCarouselType = {
      ...embla,
      on(event, callback) {
        if (!isPointerEvent(event)) embla.on(event, callback);
        return embla.internalEngine().eventHandler;
      },
      off(event, callback) {
        if (!isPointerEvent(event)) embla.off(event, callback);
        return embla.internalEngine().eventHandler;
      },
    };
    initialize(pluginApi, optionsHandler);
  };
  return autoplay;
}

/** The progress animation follows Embla's timer, never a separate slide timer. */
export function useStoryAutoplay(embla: EmblaCarouselType | undefined) {
  const root = useRef<HTMLElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const toggle = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(2);

  useEffect(() => {
    if (!embla) return;
    const autoplay = embla.plugins().autoplay;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let manuallyPaused = false;
    let animation: Animation | undefined;

    const freezeProgress = () => animation?.pause();
    const startProgress = () => {
      animation?.cancel();
      const index = embla.selectedScrollSnap();
      bars.current.forEach(bar => { if (bar) bar.style.transform = 'scaleX(0)'; });
      const remaining = autoplay.timeUntilNext();
      const bar = bars.current[index];
      if (bar && remaining !== null) {
        animation = bar.animate([
          { transform: `scaleX(${Math.max(0, 1 - remaining / STORY_DELAY)})` },
          { transform: 'scaleX(1)' },
        ], { duration: Math.max(0, remaining), easing: 'linear', fill: 'forwards' });
      }
    };
    const updatePlayback = () => {
      if (manuallyPaused || document.hidden || motion.matches) autoplay.stop();
      else if (!autoplay.isPlaying()) autoplay.play();
    };
    const select = () => {
      setActive(embla.selectedScrollSnap());
      // Manual navigation transfers the remaining time to the selected line.
      // It does not reset or stop the running autoplay clock.
      startProgress();
    };
    toggle.current = () => {
      manuallyPaused = !manuallyPaused;
      setPaused(manuallyPaused);
      updatePlayback();
    };
    const reInit = () => { select(); updatePlayback(); };
    embla.on('select', select).on('reInit', reInit)
      .on('autoplay:timerset', startProgress).on('autoplay:timerstopped', freezeProgress);
    document.addEventListener('visibilitychange', updatePlayback);
    motion.addEventListener('change', updatePlayback);
    updatePlayback();
    return () => {
      autoplay.stop();
      animation?.cancel();
      embla.off('select', select).off('reInit', reInit)
        .off('autoplay:timerset', startProgress).off('autoplay:timerstopped', freezeProgress);
      document.removeEventListener('visibilitychange', updatePlayback);
      motion.removeEventListener('change', updatePlayback);
      toggle.current = () => {};
    };
  }, [embla]);

  return { root, bars, active, paused, togglePlayback: () => toggle.current() };
}
