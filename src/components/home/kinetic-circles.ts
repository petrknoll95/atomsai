import type { EmblaCarouselType } from 'embla-carousel';

/** Figma 186:4407: fixed circles behind 1:2:5:2:1 clipping windows. */
export function circleGeometry(distance: number, diameter: number, compact: boolean) {
  const side = Math.sign(distance);
  const depth = Math.abs(distance);
  const near = compact ? 0.125 : 0.4;
  const far = compact ? 0 : 0.2;
  const widths = [1, near, far, 0];
  const centers = [0, 1, 1 + near, 1 + near + far];
  const slot = Math.min(2, Math.floor(depth));
  const fraction = Math.min(1, depth - slot);
  const width = (widths[slot] + (widths[slot + 1] - widths[slot]) * fraction) * diameter;
  const travel = (centers[slot] + (centers[slot + 1] - centers[slot]) * fraction) * diameter;
  return {
    x: side * (travel + Math.min(depth, 3) * 8),
    left: side < 0 ? diameter - width : 0,
    right: side > 0 ? diameter - width : 0,
    wash: Math.min(1, depth),
    visible: depth < (compact ? 2 : 3),
  };
}

/**
 * Embla owns dragging, snapping, looping and timing. Only its linear track
 * translation is replaced: each actual slide is one independently clipped circle.
 * Do not resize the slides during a drag; that changes Embla's measured snaps.
 */
export function attachKineticCircles(api: EmblaCarouselType) {
  const slides = api.slideNodes();
  let width = 0;
  let diameter = 0;
  let origins: number[] = [];
  let compact = false;

  const renderAt = (settledPosition?: number) => {
    const engine = api.internalEngine();
    const { scrollSnaps, limit, offsetLocation } = engine;
    const length = limit.length;
    const travel = ((scrollSnaps[0] - offsetLocation.get()) % length + length) % length;
    // Interpolate the actual snap coordinates, including fractional layout
    // rounding and the last-to-first interval, rather than rounding selection.
    let position = 0;
    for (let i = 0; i < slides.length; i++) {
      const start = scrollSnaps[0] - scrollSnaps[i];
      const end = i + 1 < slides.length ? scrollSnaps[0] - scrollSnaps[i + 1] : length;
      if (travel >= start && travel < end) {
        position = i + (travel - start) / (end - start);
        break;
      }
    }
    if (settledPosition !== undefined) position = settledPosition;
    slides.forEach((slide, index) => {
      const distance = ((index - position + slides.length * 1.5) % slides.length) - slides.length / 2;
      const geometry = circleGeometry(distance, diameter, compact);
      const x = (width - diameter) / 2 + geometry.x - origins[index];
      slide.style.transform = `translate3d(${x}px, 0, 0)`;
      slide.style.clipPath = `inset(0 ${geometry.right}px 0 ${geometry.left}px)`;
      slide.style.visibility = geometry.visible ? 'visible' : 'hidden';
      slide.style.setProperty('--image-wash', String(geometry.wash));
    });
  };

  const render = () => renderAt();
  const settle = () => renderAt(api.selectedScrollSnap());

  const measure = () => {
    const engine = api.internalEngine();
    engine.translate.clear();
    engine.translate.toggleActive(false);
    engine.slideLooper.loopPoints.forEach(({ translate }) => {
      translate.clear();
      translate.toggleActive(false);
    });
    slides.forEach(slide => { slide.style.transform = 'none'; });
    const viewport = api.rootNode().getBoundingClientRect();
    width = viewport.width;
    diameter = slides[0].getBoundingClientRect().width;
    origins = slides.map(slide => slide.getBoundingClientRect().left - viewport.left);
    compact = window.matchMedia('(max-width: 767px)').matches;
    render();
  };

  measure();
  api.on('scroll', render).on('settle', settle).on('reInit', measure);
  return () => {
    api.off('scroll', render).off('settle', settle).off('reInit', measure);
    const engine = api.internalEngine();
    engine.translate.toggleActive(true);
    engine.slideLooper.loopPoints.forEach(({ translate }) => translate.toggleActive(true));
  };
}
