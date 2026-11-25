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
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const autoplay = embla.plugins().autoplay;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const content = embla.rootNode();
    const mobile = matchMedia('(max-width: 767px)');
    let visible = false;
    let browsingStats = false;
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
      if (!visible || browsingStats || manuallyPaused || document.hidden || motion.matches) autoplay.stop();
      else if (!autoplay.isPlaying()) autoplay.play();
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });
    visibility.observe(root.current ?? content);
    const startStatsGesture = (event: TouchEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-story-stats]') ||
        !mobile.matches) return;
      browsingStats = true;
      updatePlayback();
    };
    const endStatsGesture = (event: TouchEvent) => {
      if (!browsingStats || event.touches.length) return;
      browsingStats = false;
      updatePlayback();
    };
    const resetStatsLayout = () => {
      browsingStats = false;
      content.querySelectorAll('[data-story-stats]').forEach(row => {
        row.scrollTo({ left: 0, behavior: 'instant' });
      });
      updatePlayback();
    };
    const select = () => {
      setActive(embla.selectedScrollSnap());
      // Every new story gets a full interval, including arrows, pagination and
      // either swipe surface. Reset emits timerset to restart the matching bar.
      if (autoplay.isPlaying()) autoplay.reset();
      else startProgress(); // Clear the previous bar without resuming pause.
    };
    toggle.current = () => {
      manuallyPaused = !manuallyPaused;
      setPaused(manuallyPaused);
      updatePlayback();
    };
    const reInit = () => { select(); updatePlayback(); };
    embla.on('select', select).on('reInit', reInit)
      .on('autoplay:timerset', startProgress).on('autoplay:timerstopped', freezeProgress);
    content.addEventListener('touchstart', startStatsGesture, { passive: true });
    content.addEventListener('touchend', endStatsGesture);
    content.addEventListener('touchcancel', endStatsGesture);
    document.addEventListener('visibilitychange', updatePlayback);
    motion.addEventListener('change', updatePlayback);
    mobile.addEventListener('change', resetStatsLayout);
    updatePlayback();
    return () => {
      visibility.disconnect();
      autoplay.stop();
      animation?.cancel();
      embla.off('select', select).off('reInit', reInit)
        .off('autoplay:timerset', startProgress).off('autoplay:timerstopped', freezeProgress);
      content.removeEventListener('touchstart', startStatsGesture);
      content.removeEventListener('touchend', endStatsGesture);
      content.removeEventListener('touchcancel', endStatsGesture);
      document.removeEventListener('visibilitychange', updatePlayback);
      motion.removeEventListener('change', updatePlayback);
      mobile.removeEventListener('change', resetStatsLayout);
      toggle.current = () => {};
    };
  }, [embla]);

  return { root, bars, active, paused, togglePlayback: () => toggle.current() };
}
