import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Scroll distance, in viewport heights, spent opening and closing the panel. */
const TRANSITION = .35;
/** Gap kept between the expanded panel and the header, the viewport's sides and its bottom. */
const MARGIN = 16;

/**
 * While the diagram row is pinned, grow its backdrop from the content width to the
 * visible viewport, inset by MARGIN from the site header, the sides and the bottom,
 * then shrink it back before the pin ends. The panel keeps its rounded corners.
 * Only the backdrop moves: the canvas and accordion keep their size, so nothing reflows.
 */
export function expandPinnedRow({ row, backdrop, pin, pinnedTop }: {
  row: HTMLElement;
  backdrop: HTMLElement;
  pin: ScrollTrigger;
  /** Viewport top of the row while pinned. */
  pinnedTop: () => number;
}) {
  gsap.registerPlugin(ScrollTrigger);
  const header = document.querySelector<HTMLElement>('header');
  const edges = () => {
    const bounds = row.getBoundingClientRect();
    const top = pinnedTop();
    return {
      // Clear the header's backdrop blur so the rounded top edge stays visible.
      top: -Math.max(0, top - (header?.getBoundingClientRect().bottom ?? 0) - MARGIN),
      left: -Math.max(0, bounds.left - MARGIN),
      right: -Math.max(0, document.documentElement.clientWidth - bounds.right - MARGIN),
      bottom: -Math.max(0, window.innerHeight - MARGIN - top - row.offsetHeight),
    };
  };
  let current = edges();
  // Pin length scales with the viewport height, so this share stays constant on resize.
  const share = Math.min(.45, TRANSITION * window.innerHeight / Math.max(1, pin.end - pin.start));
  const resting = { top: 0, left: 0, right: 0, bottom: 0 };
  const ease = 'power2.inOut';

  const timeline = gsap.timeline({
    scrollTrigger: {
      start: () => pin.start,
      end: () => pin.end,
      scrub: .6,
      invalidateOnRefresh: true,
      onRefreshInit: () => { current = edges(); },
    },
  })
    .fromTo(backdrop, resting, {
      top: () => current.top, left: () => current.left, right: () => current.right, bottom: () => current.bottom,
      duration: share, ease, immediateRender: false,
    })
    .to(backdrop, { ...resting, duration: share, ease }, 1 - share);

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set(backdrop, { clearProps: 'top,left,right,bottom' });
  };
}
