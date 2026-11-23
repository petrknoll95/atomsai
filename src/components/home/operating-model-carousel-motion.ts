import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { circleGeometry } from './kinetic-circles';
import type { OperatingModelMount } from './operating-model-scene';

const layerTimes = [1, 2, 3, 4];
const storyHeight = 4.4;

export const mountOperatingModelCarousel: OperatingModelMount = (element, options) => {
  gsap.registerPlugin(ScrollTrigger);
  const svg = element.querySelector('svg')!;
  const logoHalves = svg.querySelectorAll<SVGGElement>('[data-model-logo-half]');
  const plates = svg.querySelector<SVGGElement>('[data-model-plates]')!;
  const reveal = svg.querySelector<SVGRectElement>('[data-model-reveal]')!;
  const slides = svg.querySelectorAll<SVGGElement>('[data-model-plate]');
  const clips = svg.querySelectorAll<SVGRectElement>('[data-model-plate-clip]');
  const { width, height } = svg.viewBox.baseVal;
  const diameter = clips[0].height.baseVal.value;
  const travel = (diameter + 28) / 2;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compact = matchMedia('(max-width: 767px)').matches;
  const tail = options.tail ?? 0;
  const scrollLinked = options.scroll && !reduced;
  const state = { opening: 0, position: scrollLinked ? 0 : options.initialIndex };
  let active = options.initialIndex;
  let pending: number | null = null;
  let selectionMotion: gsap.core.Tween | gsap.core.Timeline | undefined;
  let story: gsap.core.Timeline | undefined;
  let pin: ScrollTrigger | undefined;
  let observer: IntersectionObserver | undefined;

  function render() {
    const { opening, position } = state;
    const gap = travel * opening;
    reveal.setAttribute('x', String(width / 2 - gap));
    reveal.setAttribute('width', String(2 * gap));
    plates.setAttribute('opacity', String(Math.min(1, opening * 1.5)));
    logoHalves.forEach((half, index) => {
      half.setAttribute('transform', `translate(${index === 0 ? -gap : gap} 0)`);
      half.setAttribute('opacity', String(1 - .62 * opening));
    });
    slides.forEach((slide, index) => {
      const { x, left, right, wash, visible } = circleGeometry(index - position, diameter, compact);
      slide.setAttribute('transform', `translate(${(width - diameter) / 2 + x} ${(height - diameter) / 2})`);
      slide.setAttribute('opacity', String(1 - .45 * wash));
      slide.setAttribute('visibility', visible ? 'visible' : 'hidden');
      clips[index].setAttribute('x', String(left));
      clips[index].setAttribute('width', String(Math.max(0, diameter - left - right)));
    });

    const nearest = Math.round(position);
    if (pending === nearest) pending = null;
    if (pending === null && nearest !== active) {
      active = nearest;
      options.onHighlight?.(active);
    }
  }

  if (scrollLinked) {
    story = gsap.timeline({ paused: true, onUpdate: render })
      .to(state, { opening: 1, duration: .78, ease: 'power2.inOut' });
    for (let index = 1; index < layerTimes.length; index++) {
      story.to(state, { position: index, duration: .62, ease: 'power2.inOut' }, layerTimes[index - 1] + .36);
    }
    story.to(state, { opening: 0, duration: .72, ease: 'power2.inOut' }, 4.45)
      .to({}, { duration: .3 });
    if (tail) story.to({}, { duration: story.duration() * tail / storyHeight });
    pin = ScrollTrigger.create({
      trigger: options.trigger,
      start: options.start,
      end: () => `+=${Math.round(innerHeight * (storyHeight + tail))}`,
      animation: story,
      pin: options.pin,
      pinSpacing: true,
      scrub: .5,
      anticipatePin: 1,
    });
    ScrollTrigger.refresh();
  } else if (reduced || active !== 0) {
    state.opening = 1;
  } else {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer?.disconnect();
        selectionMotion = gsap.to(state, { opening: 1, duration: .78, ease: 'power2.inOut', onUpdate: render });
      }
    }, { threshold: .35 });
    observer.observe(element);
  }
  render();
  element.dataset.ready = 'true';

  function stopScrollSelection() {
    if (pending === null && !selectionMotion?.isActive()) return;
    selectionMotion?.kill();
    pending = null;
    render();
  }

  function select(index: number) {
    observer?.disconnect();
    selectionMotion?.kill();
    active = index;
    pending = index;
    options.onHighlight?.(index);
    if (pin && story) {
      const top = pin.start + (pin.end - pin.start) * layerTimes[index] / story.duration();
      const smoother = ScrollSmoother.get();
      if (smoother?.smooth()) {
        selectionMotion = gsap.to(smoother, { scrollTop: top, duration: .65, ease: 'power2.inOut' });
      } else {
        const scrollPosition = { top: window.scrollY };
        selectionMotion = gsap.to(scrollPosition, {
          top, duration: .65, ease: 'power2.inOut',
          onUpdate: () => window.scrollTo({ top: scrollPosition.top, behavior: 'instant' }),
        });
      }
      return;
    }

    selectionMotion = gsap.timeline({ onUpdate: render })
      .to(state, { opening: 1, position: index, duration: reduced ? 0 : .62, ease: 'power2.inOut' });
    if (index === layerTimes.length - 1) {
      selectionMotion.to(state, { opening: 0, duration: reduced ? 0 : .72, ease: 'power2.inOut' }, '+=1');
    }
  }

  let press: { x: number; y: number } | undefined;
  function pointerDown(event: PointerEvent) {
    if (event.isPrimary && event.button === 0) {
      press = { x: event.clientX, y: event.clientY };
      svg.setPointerCapture(event.pointerId);
    }
  }
  function pointerUp(event: PointerEvent) {
    if (!event.isPrimary || !press) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    press = undefined;
    if (Math.abs(dx) < 36 || Math.abs(dx) <= Math.abs(dy)) return;
    const index = active - Math.sign(dx);
    if (index >= 0 && index < layerTimes.length) select(index);
  }
  function pointerCancel() {
    press = undefined;
  }

  svg.addEventListener('pointerdown', pointerDown);
  svg.addEventListener('pointerup', pointerUp);
  svg.addEventListener('pointercancel', pointerCancel);
  if (pin) {
    window.addEventListener('wheel', stopScrollSelection, { passive: true });
    window.addEventListener('touchstart', stopScrollSelection, { passive: true });
  }
  return {
    select,
    pin,
    tailShare: tail / (storyHeight + tail),
    destroy() {
      delete element.dataset.ready;
      observer?.disconnect();
      selectionMotion?.kill();
      pin?.kill();
      story?.kill();
      window.removeEventListener('wheel', stopScrollSelection);
      window.removeEventListener('touchstart', stopScrollSelection);
      svg.removeEventListener('pointerdown', pointerDown);
      svg.removeEventListener('pointerup', pointerUp);
      svg.removeEventListener('pointercancel', pointerCancel);
    },
  };
};
