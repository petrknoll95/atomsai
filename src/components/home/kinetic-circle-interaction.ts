import { gsap } from 'gsap';
import type { EmblaCarouselType } from 'embla-carousel';

type CircleInteraction = {
  surfaceSelector: string;
  artSelector: string;
  insetProperty: string;
};

export function attachKineticCircleInteraction(emblaApi: EmblaCarouselType, {
  surfaceSelector, artSelector, insetProperty,
}: CircleInteraction) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(any-hover: hover)');
  const context = gsap.context(() => {
    let pressed = false;
    const updates: (() => void)[] = [];
    const cleanups = emblaApi.slideNodes().map(slide => {
      const circle = slide.querySelector<HTMLElement>(surfaceSelector);
      const artwork = circle?.querySelector<HTMLElement>(artSelector);
      if (!circle || !artwork) return () => {};
      let inside = hover.matches && slide.matches(':hover');
      const inset = gsap.quickTo(circle, insetProperty, { duration: 1.2, ease: 'power2.out' });
      const zoom = ['scaleX', 'scaleY'].map(axis =>
        gsap.quickTo(artwork, axis, { duration: 1.2, ease: 'power2.out' }));
      const update = () => {
        // Clip the painted surface; Embla's measured slides and hit areas stay fixed.
        const pressInset = Math.max(18, Math.min(36, circle.clientWidth * .065));
        inset.tween.duration(pressed ? .45 : 1.2);
        inset(pressed ? pressInset : inside ? 12 : 0);
        if (reduced.matches) inset.tween.progress(1).pause();
        zoom.forEach(setScale => {
          setScale(inside && !reduced.matches ? 1.06 : 1);
          if (reduced.matches) setScale.tween.progress(1).pause();
        });
      };
      updates.push(update);
      const enter = (event: PointerEvent) => {
        if (!hover.matches || event.pointerType === 'touch') return;
        inside = true;
        update();
      };
      const leave = () => { inside = false; update(); };
      const hoverChange = () => { if (!hover.matches) inside = false; update(); };
      // The outer slide keeps a stable hit area while its surface shrinks.
      // Embla continues to own the slide transform and its side-slit mask.
      slide.addEventListener('pointerenter', enter);
      slide.addEventListener('pointerleave', leave);
      slide.addEventListener('pointercancel', leave);
      reduced.addEventListener('change', update);
      hover.addEventListener('change', hoverChange);
      update();
      return () => {
        slide.removeEventListener('pointerenter', enter);
        slide.removeEventListener('pointerleave', leave);
        slide.removeEventListener('pointercancel', leave);
        reduced.removeEventListener('change', update);
        hover.removeEventListener('change', hoverChange);
      };
    });
    const setPressed = (value: boolean) => {
      if (pressed === value) return;
      pressed = value;
      emblaApi.rootNode().dataset.pressed = String(value);
      updates.forEach(update => update());
    };
    const press = () => setPressed(true);
    const release = () => setPressed(false);
    const visibility = () => { if (document.hidden) release(); };
    emblaApi.on('pointerDown', press).on('pointerUp', release).on('reInit', release);
    // A drag can end outside the gallery or be cancelled by native scrolling.
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      emblaApi.off('pointerDown', press).off('pointerUp', release).off('reInit', release);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', visibility);
      delete emblaApi.rootNode().dataset.pressed;
      cleanups.forEach(cleanup => cleanup());
    };
  }, emblaApi.rootNode());
  return () => context.revert();
}
