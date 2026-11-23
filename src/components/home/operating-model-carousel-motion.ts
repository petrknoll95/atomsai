import EmblaCarousel from 'embla-carousel';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { attachKineticCircles, circleGeometry, kineticCircleOptions, type KineticCircleFrame } from './kinetic-circles';
import { attachKineticCircleInteraction } from './kinetic-circle-interaction';
import { carouselCirclePath, carouselLogoCenter, carouselLogoProfiles } from './operating-model-diagram/carousel-profile';
import type { OperatingModelMount } from './operating-model-scene';

const firstSnap = 1;
const viewportsPerStep = .88;

export const mountOperatingModelCarousel: OperatingModelMount = (element, options) => {
  const viewport = element.querySelector<HTMLElement>('[data-model-viewport]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollLinked = options.scroll && !reduced;
  const start = options.initialIndex + firstSnap;
  const tail = options.tail ?? 0;
  const api = EmblaCarousel(viewport, {
    ...kineticCircleOptions,
    loop: true,
    containScroll: false,
    startIndex: start,
  });
  // Two laps give every plate two neighboring slices on either side.
  // The scroll sequence runs from the first plate to the closing mark.
  const snapCount = api.scrollSnapList().length;
  const lastSnap = snapCount / 2;
  const lastPlate = lastSnap - 1;
  const steps = lastSnap - firstSnap;
  const storyHeight = steps * viewportsPerStep;
  const tailShare = tail / (storyHeight + tail);
  let pin: ScrollTrigger | undefined;
  let finale: ReturnType<typeof setTimeout> | undefined;
  let scrollSnap = start;
  let activeStop = start;
  let requestedStop: number | undefined;

  const slides = api.slideNodes();
  const paths = slides.map(slide => slide.querySelector<SVGPathElement>('[data-model-profile]')!);
  const apertures = slides.map(slide => slide.querySelector<SVGRectElement>('[data-model-aperture]')!);
  let morphing = true;

  function renderMorph({ position, width, diameter, origins, compact }: KineticCircleFrame) {
    const lap = position % lastSnap;
    const distance = Math.min(lap, lastSnap - lap, 1);
    const opening = distance * distance * (3 - 2 * distance);
    viewport.style.setProperty('--plate-opening', String(opening));
    if (distance >= 1) {
      if (morphing) {
        paths.forEach(path => path.setAttribute('d', carouselCirclePath));
        slides.forEach(slide => slide.removeAttribute('data-model-reveal-plate'));
        morphing = false;
      }
      return false;
    }

    // Keep the plate in place. Its mask opens at the same rate as the gap
    // between the two slits that move into the nearest carousel positions.
    morphing = true;
    const centered = lap < 1 ? Math.floor(position) + 1 : Math.floor(position);
    const left = (width - diameter) / 2;
    const nearEdge = circleGeometry(1, diameter, compact).x - diameter / 2;
    const aperture = diameter ? Math.min(1, 2 * nearEdge * opening / diameter) : 0;
    slides.forEach((slide, index) => {
      const slot = (index - centered + snapCount * 1.5) % snapCount - snapCount / 2;
      const profile = carouselLogoProfiles[slot + carouselLogoCenter];
      slide.toggleAttribute('data-model-reveal-plate', slot === 0);
      if (slot === 0) {
        slide.style.visibility = 'visible';
        slide.style.transform = `translate3d(${left - origins[index]}px, 0, 0)`;
        slide.style.clipPath = 'none';
        slide.style.setProperty('--image-wash', '0');
        paths[index].setAttribute('d', carouselCirclePath);
        apertures[index].setAttribute('x', String((1 - aperture) / 2));
        apertures[index].setAttribute('width', String(aperture));
        return;
      }
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
    const top = pin.start + (pin.end - pin.start) * (1 - tailShare) * (snap - firstSnap) / steps;
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
    activeStop = requestedStop ?? (slide || lastSnap);
    if (pin?.isActive && activeStop !== scrollSnap) alignPage(activeStop);
    options.onHighlight?.(Math.max(0, Math.min(activeStop, lastPlate) - 1));
    scheduleFinale();
  }

  function cancelFinale() {
    clearTimeout(finale);
  }

  api.on('select', syncTabs).on('settle', scheduleFinale).on('pointerDown', cancelFinale).on('pointerUp', scheduleFinale);

  if (scrollLinked) {
    gsap.registerPlugin(ScrollTrigger);
    const syncCarousel = (trigger: ScrollTrigger) => {
      const snap = Math.min(lastSnap, firstSnap + Math.round(trigger.progress * steps / (1 - tailShare)));
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
  }

  element.dataset.ready = 'true';

  return {
    select(index) {
      cancelFinale();
      const snap = index + firstSnap;
      alignPage(snap);
      showStop(snap);
      scheduleFinale();
    },
    pin,
    tailShare,
    destroy() {
      delete element.dataset.ready;
      cancelFinale();
      pin?.kill();
      detachInteraction();
      detachCircles();
      api.destroy();
      viewport.style.removeProperty('--plate-opening');
    },
  };
};
