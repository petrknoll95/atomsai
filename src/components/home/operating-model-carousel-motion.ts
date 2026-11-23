import EmblaCarousel from 'embla-carousel';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { attachKineticCircles, circleGeometry, kineticCircleOptions, type KineticCircleFrame } from './kinetic-circles';
import { attachKineticCircleInteraction } from './kinetic-circle-interaction';
import { carouselCirclePath, carouselLogoProfiles } from './operating-model-diagram/carousel-profile';
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

  const slides = api.slideNodes();
  const paths = slides.map(slide => slide.querySelector<SVGPathElement>('[data-model-profile]')!);
  let morphing = true;

  function renderMorph({ position, width, diameter, origins, compact }: KineticCircleFrame) {
    const lap = position % lastSnap;
    const distance = Math.min(lap, lastSnap - lap, 1);
    const opening = distance * distance * (3 - 2 * distance);
    viewport.style.setProperty('--plate-opening', String(opening));
    if (distance >= 1) {
      if (morphing) {
        paths.forEach(path => path.setAttribute('d', carouselCirclePath));
        viewport.removeAttribute('data-model-morph');
        morphing = false;
      }
      return false;
    }

    // The nearest plate becomes the body of the mark. Each neighboring plate
    // becomes one lobe and moves between that lobe and its carousel position.
    morphing = true;
    viewport.setAttribute('data-model-morph', '');
    const centered = lap < 1 ? Math.floor(position) + 1 : Math.floor(position);
    const left = (width - diameter) / 2;
    slides.forEach((slide, index) => {
      const slot = (index - centered + snapCount * 1.5) % snapCount - snapCount / 2;
      const profile = carouselLogoProfiles[slot + 2];
      slide.style.visibility = profile ? 'visible' : 'hidden';
      if (!profile) return;
      const geometry = circleGeometry(slot, diameter, compact);
      const crop = diameter ? Math.max(geometry.left, geometry.right) / diameter : 0;
      const closedX = profile.offset * diameter;
      const x = left - origins[index] + closedX + (geometry.x - closedX) * opening;
      slide.style.transform = `translate3d(${x}px, 0, 0)`;
      slide.style.clipPath = 'none';
      slide.style.setProperty('--image-wash', String(geometry.wash));
      paths[index].setAttribute('d', profile.morph(opening, crop));
    });
    return true;
  }

  const detachCircles = attachKineticCircles(api, renderMorph);
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
      viewport.setAttribute('data-model-morph', '');
    },
  };
};
