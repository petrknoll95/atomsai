import EmblaCarousel from 'embla-carousel';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { attachKineticCircles, circleGeometry, kineticCircleOptions, type KineticCircleFrame } from './kinetic-circles';
import { attachKineticCircleInteraction } from './kinetic-circle-interaction';
import { carouselOutlineWidth, mountCarouselSketch, type PlateDrawing } from './operating-model-carousel-sketch';
import { carouselLogoCenter, carouselLogoProfiles, createCarouselLogoPath, maskedCirclePath } from './operating-model-diagram/carousel-profile';
import type { OperatingModelMount } from './operating-model-scene';

const firstSnap = 1;
const viewportsPerStep = .88;
// The visible stroke sits outside the fill. Allow for the whole stroke plus canvas rounding.
const canvasEdgeInset = carouselOutlineWidth + 1;
const hitAreaInset = carouselOutlineWidth / 2;

type PlateShape = { x: number; diameter: number; wash: number } & (
  | { mark: true }
  | { left: number; right: number; fadeAtSeam: boolean }
  | { profile: NonNullable<(typeof carouselLogoProfiles)[number]>; crop: number; opening: number; joinBow: number; openX: number; width: number }
);

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
    watchDrag: false,
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
  const sketch = mountCarouselSketch(viewport.querySelector<HTMLElement>('[data-model-canvas-host]')!, slides, reduced);
  const mark = createCarouselLogoPath();
  const insets = slides.map(() => 0);
  const shapes: (PlateShape | undefined)[] = [];
  const drawings: (PlateDrawing | undefined)[] = [];

  function paint(index: number) {
    const shape = shapes[index];
    if (!shape) {
      drawings[index] = undefined;
      return;
    }

    const { x, diameter, wash } = shape;
    if ('mark' in shape) {
      drawings[index] = { path: mark, x, opacity: 1, outline: 1, artwork: 0, zoom: 1 };
      return;
    }

    const radius = Math.max(.01, .5 - insets[index] / diameter);
    if ('profile' in shape) {
      // A slit that vanishes should fold down to the crop edge, even if its
      // fully open circle would end outside the canvas.
      const leftSide = shape.profile.offset < 0;
      const tipAtOpen = shape.openX + (.5 + (leftSide ? radius : -radius)) * diameter;
      const correction = leftSide ? Math.max(0, canvasEdgeInset - tipAtOpen)
        : Math.min(0, shape.width - canvasEdgeInset - tipAtOpen);
      drawings[index] = {
        path: shape.profile.morph(shape.opening, shape.crop, radius, shape.joinBow),
        x: x + correction * shape.opening,
        opacity: 1, outline: 1 - wash * .82 * Math.min(1, shape.opening * 4), artwork: 0, zoom: 1,
      };
      return;
    }

    const span = (Math.min(shape.right, .5 + radius) - Math.max(shape.left, .5 - radius)) * diameter;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    drawings[index] = span > .5 ? {
      path: new Path2D(maskedCirclePath(radius, shape.left, shape.right)),
      x,
      opacity: shape.fadeAtSeam ? clamp((span - .5) / 22) : 1,
      outline: clamp((span - 1) / 14) * (1 - wash * .82),
      artwork: Math.max(0, 1 - wash * 2),
      radius,
      zoom: reduced ? 1 : 1 + insets[index] * .005,
    } : undefined;
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
    const remaining = opening * diameter;
    const collapsed = remaining < .15;
    // Bow the mating edges toward each other before contact. The joined area
    // widens from the middle to the tips as the residual gap closes.
    const approach = Math.max(0, 1 - remaining / 14);
    const joinBow = Math.min(remaining, 6) * approach * approach * (3 - 2 * approach) / diameter;
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
      slide.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) {
        shapes[index] = undefined;
        drawings[index] = undefined;
        return;
      }

      const openX = left + geometry.x;
      let x = openX;
      if (collapsed) {
        shapes[index] = { x, diameter, wash: 0, mark: true };
      } else if (profile) {
        const closedX = left + profile.offset * diameter;
        x = closedX + (openX - closedX) * opening;
        const viewportCut = slot < 0 ? canvasEdgeInset - openX : openX + diameter + canvasEdgeInset - width;
        const crop = Math.max(geometry.left, geometry.right, viewportCut) / diameter;
        shapes[index] = { x, diameter, wash: geometry.wash, profile, crop, opening, joinBow, openX, width };
      } else {
        const inset = centeredPlate ? (1 - aperture) / 2 : 0;
        shapes[index] = {
          x, diameter, wash: geometry.wash,
          left: Math.max(inset, geometry.left / diameter, (canvasEdgeInset - x) / diameter),
          right: Math.min(1 - inset, 1 - geometry.right / diameter, (width - canvasEdgeInset - x) / diameter),
          fadeAtSeam: centeredPlate,
        };
      }
      slide.style.transform = `translate3d(${x - origins[index]}px, 0, 0)`;
      // Keep the carousel's hit area stable while the outlined SVG shrinks.
      slide.style.clipPath = morphing ? 'none'
        : `inset(-1px ${geometry.right - hitAreaInset}px -1px ${geometry.left - hitAreaInset}px)`;
      slide.style.setProperty('--image-wash', String(geometry.wash));
      paint(index);
    });
    sketch.render({ diameter, opening: collapsed ? 0 : opening, plates: drawings });
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
      sketch.redraw();
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
      if (aligningPage || snap === scrollSnap) return;
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
      sketch.destroy();
      viewport.removeAttribute('data-model-collapsed');
      viewport.removeAttribute('data-model-morph');
      slides.forEach(slide => { slide.style.removeProperty('clip-path'); });
    },
  };
};
