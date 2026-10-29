import { gsap } from 'gsap';

type Mount = { stage: HTMLElement; field: HTMLElement; content: HTMLElement };

/** Read the displayed scroll position; never pin the page or change its scroll. */
export function mountHeroScroll({ stage, field, content }: Mount) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const moveField = gsap.quickSetter(field, 'y', 'px');
  const moveCopy = gsap.quickSetter(content, 'y', 'px');
  let previousOffset = -1;
  const update = () => {
    if (document.hidden) return;
    // getBoundingClientRect also follows the site's existing smooth-scroll layer.
    const bounds = stage.getBoundingClientRect();
    const offset = reduced.matches ? 0 : Math.max(0, Math.min(bounds.height, -bounds.top));
    if (offset !== previousOffset) {
      // Both layers still move upward on screen: text at 80% of scroll speed,
      // pattern at 55%. The incoming section moves at the normal 100% speed.
      moveCopy(offset * .2);
      moveField(offset * .45);
      field.style.setProperty('--hero-field-offset', `${offset * .45}px`);
      field.style.setProperty('--hero-fade-scroll', `${offset}px`);
      previousOffset = offset;
    }
  };
  update();
  gsap.ticker.add(update);
  reduced.addEventListener('change', update);
  return {
    destroy: () => {
      gsap.ticker.remove(update);
      reduced.removeEventListener('change', update);
      gsap.set([field, content], { clearProps: 'transform' });
      field.style.removeProperty('--hero-field-offset');
      field.style.removeProperty('--hero-fade-scroll');
    },
  };
}
