import { ScrollSmoother } from 'gsap/ScrollSmoother';

/** Keep section destinations clear of the persistent header. */
export function scrollToTarget(target: HTMLElement, animate = true) {
  const smoother = ScrollSmoother.get();
  const offset = window.innerWidth < 768 ? 96 : 112;
  const smooth = animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (smoother && !smoother.smooth()) {
    // Touch mode uses native geometry. Avoid the proxy's cached position during
    // a browser-initiated hash change before its scroll event has been handled.
    window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset), behavior: smooth ? 'smooth' : 'instant' });
  } else if (smoother) smoother.scrollTo(Math.max(0, smoother.offset(target, 'top top') - offset), smooth);
  else target.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'start' });
}
