import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Coalesce native scroll, smooth-scroll frames and layout changes into one read. */
export function observeScrollLayout(update: () => void, elements: Element[]) {
  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
  };
  const sizes = new ResizeObserver(schedule);
  for (const element of elements) sizes.observe(element);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('atoms:smooth-scroll', schedule);
  ScrollTrigger.addEventListener('refresh', schedule);
  schedule();
  return () => {
    sizes.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('atoms:smooth-scroll', schedule);
    ScrollTrigger.removeEventListener('refresh', schedule);
    cancelAnimationFrame(frame);
  };
}
