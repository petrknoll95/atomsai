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
  const steps = lastSnap - firstSnap;
  const storyHeight = steps * viewportsPerStep;
  // The backdrop opens during the lead-in and closes during the tail.
  const lead = tail;
  const pinHeight = lead + storyHeight + tail;
  const tailShare = tail / pinHeight;
  let pin: ScrollTrigger | undefined;
  let scrollSnap = start;
  let activeStop = start;
  let renderedPosition = start;
  let aligningPage = false;
  let closing: { origin: number; span: number } | undefined;

  const slides = api.slideNodes();
  const paths = slides.map(slide => slide.querySelector<SVGPathElement>('[data-model-profile]')!);
  const apertures = slides.map(slide => slide.querySelector<SVGRectElement>('[data-model-aperture]')!);
  let morphing = true;

  function renderMorph({ position, width, diameter, origins, compact }: KineticCircleFrame) {
    renderedPosition = position;
    const lap = position % lastSnap;
    let distance = Math.min(lap, lastSnap - lap, 1);
    let centered = lap < 1 ? Math.floor(position) + 1 : Math.floor(position);
    if (closing) {
      // Collapse the currently centered plate when a jump skips earlier tabs.
      const traveled = ((position - closing.origin + snapCount * 1.5) % snapCount) - snapCount / 2;
      distance = Math.max(0, Math.min(1, 1 - traveled / closing.span));
      centered = closing.origin;
      if (distance < .00001) closing = undefined;
    }
    const opening = distance * distance * (3 - 2 * distance);
    viewport.style.setProperty('--plate-opening', String(opening));
    viewport.toggleAttribute('data-model-morph', distance < 1);
    if (distance >= 1) {
      if (morphing) {
        paths.forEach(path => path.setAttribute('d', carouselCirclePath));
        slides.forEach(slide => slide.removeAttribute('data-model-reveal-plate'));
        morphing = false;
      }
      return false;
    }

    // Keep the plate in place and match its mask to the gap between the slits.
    morphing = true;
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
    const progress = (lead + (snap - firstSnap) * viewportsPerStep) / pinHeight;
    const top = pin.start + (pin.end - pin.start) * progress;
    const smoother = ScrollSmoother.get();
    aligningPage = true;
    try {
      smoother?.scrollTo(top, false);
      // A native smooth scroll would select intervening tabs on the way.
      window.scrollTo({ top, behavior: 'instant' });
    } finally {
      aligningPage = false;
    }
  }

  function showStop(stop: number) {
    if (stop === activeStop) return;
    const origin = api.selectedScrollSnap();
    const lapStart = origin - activeStop;
    const span = stop - activeStop;
    closing = stop === lastSnap && span > 1 && Math.abs(origin - renderedPosition) < .02
      ? { origin, span }
      : undefined;
    api.scrollTo((lapStart + stop + snapCount) % snapCount);
  }

  function syncTabs() {
    const slide = api.selectedScrollSnap() % lastSnap;
    activeStop = slide || lastSnap;
    if (pin?.isActive && activeStop !== scrollSnap) alignPage(activeStop);
    options.onHighlight?.(activeStop - firstSnap);
  }

  api.on('select', syncTabs).on('pointerDown', () => { closing = undefined; });

  if (scrollLinked) {
    gsap.registerPlugin(ScrollTrigger);
    const syncCarousel = (trigger: ScrollTrigger) => {
      const progress = (trigger.progress * pinHeight - lead) / viewportsPerStep;
      const snap = Math.min(lastSnap, firstSnap + Math.max(0, Math.round(progress)));
      if (aligningPage || snap === scrollSnap || api.internalEngine().dragHandler.pointerDown()) return;
      scrollSnap = snap;
      showStop(snap);
    };
    pin = ScrollTrigger.create({
      trigger: options.trigger,
      start: options.start,
      end: () => '+=' + Math.round(innerHeight * pinHeight),
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
      const snap = index + firstSnap;
      scrollSnap = snap;
      showStop(snap);
      alignPage(snap);
    },
    pin,
    tailShare,
    destroy() {
      delete element.dataset.ready;
      pin?.kill();
      detachInteraction();
      detachCircles();
      api.destroy();
      viewport.style.removeProperty('--plate-opening');
      viewport.removeAttribute('data-model-morph');
    },
  };
};
