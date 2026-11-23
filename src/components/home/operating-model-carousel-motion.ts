import EmblaCarousel from 'embla-carousel';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { attachKineticCircles, circleGeometry, kineticCircleOptions, type KineticCircleFrame } from './kinetic-circles';
import { attachKineticCircleInteraction } from './kinetic-circle-interaction';
import { carouselLogoCenter, carouselLogoProfiles, carouselLogoTransform, maskedCirclePath } from './operating-model-diagram/carousel-profile';
import { logoMarkPath } from './operating-model-diagram/logo-mark';
import type { OperatingModelMount } from './operating-model-scene';

const firstSnap = 1;
const viewportsPerStep = .88;
const outlineInset = .75;

type PlateShape =
  | 'mark'
  | { diameter: number; left: number; right: number; fadeAtSeam?: boolean }
  | { diameter: number; profile: NonNullable<(typeof carouselLogoProfiles)[number]>; crop: number; opening: number };

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
  const insets = slides.map(() => 0);
  const shapes: (PlateShape | undefined)[] = [];

  function paint(index: number) {
    const shape = shapes[index];
    if (!shape) return;

    const path = paths[index];
    if (shape === 'mark') {
      path.setAttribute('d', logoMarkPath);
      path.setAttribute('transform', carouselLogoTransform);
      path.style.strokeOpacity = '0';
      return;
    }

    path.removeAttribute('transform');
    const radius = Math.max(.01, .5 - insets[index] / shape.diameter);
    if ('profile' in shape) {
      path.setAttribute('d', shape.profile.morph(shape.opening, shape.crop, radius));
      path.style.strokeOpacity = String(shape.opening);
      return;
    }

    const span = (Math.min(shape.right, .5 + radius) - Math.max(shape.left, .5 - radius)) * shape.diameter;
    path.setAttribute('d', span > .5 ? maskedCirclePath(radius, shape.left, shape.right) : '');
    path.style.strokeOpacity = String(Math.min(1, Math.max(0, (span - 1) / 14)));
    if (shape.fadeAtSeam) slides[index].style.opacity = String(Math.min(1, Math.max(0, (span - .5) / 22)));
  }

  function render({ position, width, diameter, origins, compact, loop }: KineticCircleFrame) {
    if (!diameter) return false;
    renderedPosition = position;
    const lap = position % lastSnap;
    let distance = Math.min(lap, lastSnap - lap, 1);
    let centered = lap < 1 ? Math.floor(position) + 1 : Math.floor(position);
    if (closing) {
      // Collapse the currently centered plate when a jump skips earlier tabs.
      const traveled = ((position - closing.origin + snapCount * 1.5) % snapCount) - snapCount / 2;
      distance = Math.max(0, Math.min(1, 1 - traveled / closing.span));
      centered = closing.origin;
      if (distance < .00001 || traveled / closing.span < 0) closing = undefined;
    }
    const opening = distance * distance * (3 - 2 * distance);
    const morphing = distance < 1;
    // Switch to the continuous brand silhouette once slit motion is subpixel.
    const collapsed = opening * diameter < .15;
    viewport.style.setProperty('--plate-opening', String(collapsed ? 0 : opening));
    viewport.toggleAttribute('data-model-geometry', true);
    viewport.toggleAttribute('data-model-morph', morphing);
    viewport.toggleAttribute('data-model-collapsed', collapsed);

    const left = (width - diameter) / 2;
    const nearEdge = circleGeometry(1, diameter, compact).x - diameter / 2;
    const aperture = Math.min(1, 2 * nearEdge * opening / diameter);
    slides.forEach((slide, index) => {
      const offset = index - (morphing ? centered : position);
      const slot = loop ? ((offset + snapCount * 1.5) % snapCount) - snapCount / 2 : offset;
      const profile = morphing ? carouselLogoProfiles[slot + carouselLogoCenter] : null;
      const centeredPlate = morphing && slot === 0;
      const geometry = circleGeometry(slot, diameter, compact);
      const visible = collapsed ? centeredPlate : morphing ? Boolean(profile || centeredPlate) : geometry.visible;
      slide.toggleAttribute('data-model-reveal-plate', centeredPlate && !collapsed);
      if (!centeredPlate || collapsed) slide.style.removeProperty('opacity');
      slide.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) {
        shapes[index] = undefined;
        return;
      }

      const openX = left + geometry.x;
      let x = openX;
      if (collapsed) {
        shapes[index] = 'mark';
      } else if (profile) {
        const closedX = left + profile.offset * diameter;
        x = closedX + (openX - closedX) * opening;
        const viewportCut = slot < 0 ? outlineInset - openX : openX + diameter + outlineInset - width;
        const crop = Math.max(geometry.left, geometry.right, viewportCut) / diameter;
        shapes[index] = { diameter, profile, crop, opening };
      } else {
        const inset = centeredPlate ? (1 - aperture) / 2 : 0;
        shapes[index] = {
          diameter,
          left: Math.max(inset, geometry.left / diameter, (outlineInset - x) / diameter),
          right: Math.min(1 - inset, 1 - geometry.right / diameter, (width - outlineInset - x) / diameter),
          fadeAtSeam: centeredPlate,
        };
      }
      slide.style.transform = `translate3d(${x - origins[index]}px, 0, 0)`;
      // Keep the carousel's hit area stable while the outlined SVG shrinks.
      slide.style.clipPath = morphing ? 'none'
        : `inset(-1px ${geometry.right - outlineInset}px -1px ${geometry.left - outlineInset}px)`;
      slide.style.setProperty('--image-wash', String(geometry.wash));
      paint(index);
    });
    return true;
  }

  const detachCircles = attachKineticCircles(api, render);
  const detachInteraction = attachKineticCircleInteraction(api, {
    surfaceSelector: '[data-model-plate-surface]',
    artSelector: '[data-model-plate-art]',
    insetProperty: '--model-plate-inset',
    onInsetChange(index, inset) {
      insets[index] = inset;
      paint(index);
    },
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
    let target = origin - activeStop + stop;
    closing = undefined;
    if (stop === lastSnap) {
      // In-flight tab changes should close at the nearest seam on screen.
      target = Math.round(renderedPosition / lastSnap) * lastSnap;
      const paintedStop = Math.round(renderedPosition);
      const span = target - paintedStop;
      if (Math.abs(span) > 1 && Math.abs(paintedStop - renderedPosition) < .02) {
        closing = { origin: paintedStop % snapCount, span };
      }
    } else if (activeStop === lastSnap && stop === firstSnap) {
      target = origin + 1;
    }
    api.scrollTo((target + snapCount) % snapCount);
  }

  function syncTabs() {
    const slide = api.selectedScrollSnap() % lastSnap;
    activeStop = slide || lastSnap;
    if (activeStop !== lastSnap) closing = undefined;
    if (pin?.isActive && activeStop !== scrollSnap) alignPage(activeStop);
    options.onHighlight?.(activeStop - firstSnap);
  }

  api.on('select', syncTabs);

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
      viewport.removeAttribute('data-model-collapsed');
      viewport.removeAttribute('data-model-morph');
      viewport.removeAttribute('data-model-geometry');
      slides.forEach((slide, index) => {
        slide.style.removeProperty('clip-path');
        slide.style.removeProperty('opacity');
        slide.removeAttribute('data-model-reveal-plate');
        paths[index].removeAttribute('transform');
        paths[index].style.removeProperty('stroke-opacity');
      });
    },
  };
};
