import { gsap } from 'gsap';

type Mount = { stage: HTMLElement; field: HTMLElement; content: HTMLElement };

/** Read the displayed scroll position; never pin the page or change its scroll. */
export function mountHeroScroll({ stage, field, content }: Mount) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compactHeight = matchMedia('(max-height: 740px)');
  const moveField = gsap.quickSetter(field, 'y', 'px');
  const moveCopy = gsap.quickSetter(content, 'y', 'px');
  let previousOffset = -1;
  let previousCopyOffset = -1;
  const update = () => {
    if (document.hidden) return;
    // getBoundingClientRect also follows the site's existing smooth-scroll layer.
    const bounds = stage.getBoundingClientRect();
    const offset = reduced.matches ? 0 : Math.max(0, Math.min(bounds.height, -bounds.top));
    // On short screens the copy stays closer to normal scroll speed so the
    // product row below it doesn't catch up while the text is still visible.
    const copyOffset = offset * (compactHeight.matches ? .1 : .2);
    if (offset !== previousOffset || copyOffset !== previousCopyOffset) {
      moveCopy(copyOffset);
      moveField(offset * .45);
      field.style.setProperty('--hero-field-offset', `${offset * .45}px`);
      // Shorten the fades by the same amount so their top follows the copy.
      stage.style.setProperty('--hero-copy-offset', `${copyOffset}px`);
      previousOffset = offset;
      previousCopyOffset = copyOffset;
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
      stage.style.removeProperty('--hero-copy-offset');
    },
  };
}
