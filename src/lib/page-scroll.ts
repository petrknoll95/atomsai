import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Keep section destinations clear of the persistent header. */
export function scrollToTarget(target: HTMLElement, animate = true) {
  const smoother = ScrollSmoother.get();
  const offset = window.innerWidth < 768 ? 96 : 112;
  const smooth = animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveal = target.closest<HTMLElement>('[data-hero-reveal]');
  const heroPin = reveal && ScrollTrigger.getById('hero-prototype');
  if (reveal && heroPin) {
    // The section is visually pinned over the hero before it reaches its
    // normal flow position. Section links must finish the reveal first.
    const localTop = target.getBoundingClientRect().top - reveal.getBoundingClientRect().top;
    const top = heroPin.end + Math.max(0, localTop - offset);
    if (smoother?.smooth()) smoother.scrollTo(top, smooth);
    else window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' });
    return;
  }
  if (smoother && !smoother.smooth()) {
    // Touch mode uses native geometry. Avoid the proxy's cached position during
    // a browser-initiated hash change before its scroll event has been handled.
    window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset), behavior: smooth ? 'smooth' : 'instant' });
  } else if (smoother) smoother.scrollTo(Math.max(0, smoother.offset(target, 'top top') - offset), smooth);
  else target.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'start' });
}
