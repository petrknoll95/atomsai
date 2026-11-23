import EmblaCarousel from 'embla-carousel';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { attachKineticCircles, kineticCircleOptions } from './kinetic-circles';
import { attachKineticCircleInteraction } from './kinetic-circle-interaction';
import type { OperatingModelMount } from './operating-model-scene';

const storyHeight = 4.4;

export const mountOperatingModelCarousel: OperatingModelMount = (element, options) => {
  const viewport = element.querySelector<HTMLElement>('[data-model-viewport]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollLinked = options.scroll && !reduced;
  const start = reduced || options.initialIndex > 0 ? options.initialIndex + 1 : 0;
  const tail = options.tail ?? 0;
  const tailShare = tail / (storyHeight + tail);
  const api = EmblaCarousel(viewport, {
    ...kineticCircleOptions,
    loop: true,
    containScroll: false,
    startIndex: start,
  });
  // Two laps give every plate two neighboring slices on either side.
  // The scroll sequence runs from the first mark to the next.
  const snapCount = api.scrollSnapList().length;
  const lastSnap = snapCount / 2;
  const lastPlate = lastSnap - 1;
  let pin: ScrollTrigger | undefined;
  let enter: IntersectionObserver | undefined;
  let finale: ReturnType<typeof setTimeout> | undefined;
  let scrollSnap = start;
  let activeStop = start;
  let requestedStop: number | undefined;

  const detachCircles = attachKineticCircles(api, position => {
    const lap = position % lastSnap;
    const opening = Math.min(lap, lastSnap - lap, 1);
    viewport.style.setProperty('--plate-opening', String(opening));
  });
  const detachInteraction = attachKineticCircleInteraction(api, {
    surfaceSelector: '[data-model-plate-surface]',
    artSelector: '[data-model-plate-art]',
    insetProperty: '--model-plate-inset',
  });

  function alignPage(snap: number) {
    if (!pin) return;
    scrollSnap = snap;
    const top = pin.start + (pin.end - pin.start) * (1 - tailShare) * snap / lastSnap;
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(top, false);
    else window.scrollTo({ top, behavior: 'instant' });
  }

  function scheduleFinale() {
    clearTimeout(finale);
    const { dragHandler, scrollBody } = api.internalEngine();
    if (!scrollLinked && activeStop === lastPlate && !dragHandler.pointerDown() && scrollBody.settled()) {
      finale = setTimeout(() => showStop(lastSnap), 1400);
    }
  }

  function showStop(stop: number) {
    const lapStart = api.selectedScrollSnap() - activeStop;
    requestedStop = stop;
    api.scrollTo((lapStart + stop + snapCount) % snapCount);
    requestedStop = undefined;
  }

  function syncTabs() {
    const slide = api.selectedScrollSnap() % lastSnap;
    activeStop = requestedStop ?? (slide || (activeStop >= lastPlate ? lastSnap : 0));
    if (pin?.isActive && activeStop !== scrollSnap) alignPage(activeStop);
    options.onHighlight?.(Math.max(0, Math.min(activeStop, lastPlate) - 1));
    scheduleFinale();
  }

  function stopIntro() {
    enter?.disconnect();
    clearTimeout(finale);
  }

  api.on('select', syncTabs).on('settle', scheduleFinale).on('pointerDown', stopIntro).on('pointerUp', scheduleFinale);

  if (scrollLinked) {
    gsap.registerPlugin(ScrollTrigger);
    const syncCarousel = (trigger: ScrollTrigger) => {
      const snap = Math.min(lastSnap, Math.round(trigger.progress * lastSnap / (1 - tailShare)));
      if (snap === scrollSnap || api.internalEngine().dragHandler.pointerDown()) return;
      scrollSnap = snap;
      showStop(snap);
    };
    pin = ScrollTrigger.create({
      trigger: options.trigger,
      start: options.start,
      end: () => '+=' + Math.round(innerHeight * (storyHeight + tail)),
      pin: options.pin,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: syncCarousel,
    });
    syncCarousel(pin);
    ScrollTrigger.refresh();
  } else if (api.selectedScrollSnap() === 0) {
    enter = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      enter?.disconnect();
      showStop(1);
    }, { threshold: .35 });
    enter.observe(viewport);
  }

  element.dataset.ready = 'true';

  return {
    select(index) {
      stopIntro();
      const snap = index + 1;
      alignPage(snap);
      showStop(snap);
      scheduleFinale();
    },
    pin,
    tailShare,
    destroy() {
      delete element.dataset.ready;
      stopIntro();
      pin?.kill();
      detachInteraction();
      detachCircles();
      api.destroy();
      viewport.style.removeProperty('--plate-opening');
    },
  };
};
