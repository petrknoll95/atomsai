import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/** The shared recipe for headline reveals. Keep timing and movement out of sections. */
export const textReveal = {
  /** Each line rises out of its own mask. */
  duration: 1.05,
  stagger: .11,
  ease: 'power4.out',
  fromYPercent: 105,
  /** Lines also fade, so the start of a line never reads as a hard cut. */
  fadeDuration: .6,
  /** ScrollTrigger start: headline top passes 88% of the viewport. */
  start: 'top 88%',
  /** Show plain text instead of waiting longer for the display font. */
  fontWaitLimit: 1500,
  /** Mask clip, in em, beyond the line box: accents above, descenders below. */
  maskBleed: { top: .3, side: .3, bottom: .16 },
} as const;

export const headlineSelector = 'h1.display, h2.display, [data-text-reveal]';
const excludedSelector = 'dialog, [aria-roledescription="carousel"], [data-text-reveal="off"]';

type State = 'pending' | 'revealing' | 'visible';

/** One headline: owns its split, its scroll trigger and its timeline. */
class HeadlineReveal {
  state: State = 'pending';
  private split?: SplitText;
  private timeline?: gsap.core.Timeline;
  private trigger?: ScrollTrigger;
  private entered = false;
  private locks = new Map<HTMLElement, string>();

  constructor(readonly heading: HTMLElement) {}

  /** Hide until the display font has loaded and the lines can be measured. */
  hold() {
    this.set('pending');
    gsap.set(this.heading, { opacity: 0 });
    this.trigger = ScrollTrigger.create({
      trigger: this.heading,
      start: textReveal.start,
      once: true,
      onEnter: () => { this.entered = true; this.play(); },
    });
  }

  /** Split into masked lines. Safe to call again after a width change. */
  prepare() {
    if (this.state === 'visible') return;
    this.unsplit();
    const heading = this.heading;
    // Keep authored block spans (FAQ colours, CTA flex spacing) intact.
    const children = [...heading.children] as HTMLElement[];
    const targets = children.length && children.every(child => child.tagName === 'SPAN' && getComputedStyle(child).display !== 'inline')
      ? children : [heading];
    // Lines are nowrap blocks, so lock the authored widths: shrink-to-fit and
    // flex headings would otherwise collapse to their widest line.
    const headingWidth = heading.getBoundingClientRect().width;
    const widths = targets.map(target => target.getBoundingClientRect().width);
    this.lock(heading, headingWidth);
    // Temporary word wrappers can round fractional glyph advances up. Allow one
    // pixel while SplitText measures, then restore the exact box.
    targets.forEach((target, index) => this.lock(target, widths[index] + 1));
    this.split = SplitText.create(targets, {
      type: 'lines', mask: 'lines', linesClass: 'text-reveal-line', aria: 'none',
    });
    targets.forEach((target, index) => { target.style.width = `${widths[index]}px`; });
    const { top, side, bottom } = textReveal.maskBleed;
    this.split.masks.forEach(mask => Object.assign((mask as HTMLElement).style, {
      // One inline formatting context: Safari otherwise applies the heading's
      // text-box trim to every intermediate block. Clip with clip-path rather
      // than overflow, which would trim the glyphs that the line box omits.
      display: 'inline-block', width: '100%', verticalAlign: 'baseline', overflow: 'visible',
      clipPath: `inset(-${top}em -${side}em -${bottom}em -${side}em)`,
    }));
    this.split.lines.forEach(line => Object.assign((line as HTMLElement).style, { display: 'block', whiteSpace: 'nowrap' }));
    gsap.set(heading, { opacity: 1 });
    this.timeline = gsap.timeline({ paused: true, onComplete: () => this.finish() })
      .fromTo(this.split.lines, { yPercent: textReveal.fromYPercent }, {
        yPercent: 0, duration: textReveal.duration, ease: textReveal.ease, stagger: textReveal.stagger,
      }, 0)
      .fromTo(this.split.lines, { opacity: 0 }, {
        opacity: 1, duration: textReveal.fadeDuration, ease: 'power1.out', stagger: textReveal.stagger,
      }, 0);
    if (this.entered) this.play();
  }

  play() {
    if (this.state === 'visible' || !this.timeline) return;
    this.set('revealing');
    this.timeline.play();
  }

  /** Skip the motion: focus, deep links, headlines already scrolled past, slow fonts. */
  finish() {
    this.trigger?.kill();
    this.trigger = undefined;
    this.timeline?.kill();
    this.timeline = undefined;
    this.unsplit();
    gsap.set(this.heading, { clearProps: 'opacity' });
    this.set('visible');
  }

  destroy() {
    this.trigger?.kill();
    this.timeline?.kill();
    this.unsplit();
    gsap.set(this.heading, { clearProps: 'opacity' });
    delete this.heading.dataset.textRevealState;
  }

  /** Restore the authored DOM, so finished headlines reflow like plain text. */
  private unsplit() {
    this.timeline?.kill();
    this.timeline = undefined;
    this.split?.revert();
    this.split = undefined;
    this.locks.forEach((width, element) => { element.style.width = width; });
    this.locks.clear();
  }

  private lock(element: HTMLElement, width: number) {
    if (!this.locks.has(element)) this.locks.set(element, element.style.width);
    element.style.width = `${width}px`;
  }

  private set(state: State) {
    this.state = state;
    this.heading.dataset.textRevealState = state;
  }
}

/**
 * Line-by-line headline reveals for everything inside `root`.
 * Server HTML stays readable; motion is an enhancement that never hides text
 * for reduced motion, slow fonts, keyboard focus or deep links.
 */
export function mountHeadlineReveals(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const headings = [...root.querySelectorAll<HTMLElement>(headlineSelector)]
    .filter(heading => !heading.closest(excludedSelector));
  // Survives reduced-motion toggles: a headline plays once per page view.
  const seen = new Set<HTMLElement>();
  const media = gsap.matchMedia();

  media.add('(prefers-reduced-motion: no-preference)', () => {
    let disposed = false;
    let fontsReady = false;
    let resizeFrame = 0;
    const reveals = headings.filter(heading => !seen.has(heading) && heading.getBoundingClientRect().bottom > 0)
      .map(heading => new HeadlineReveal(heading));
    headings.forEach(heading => { if (!reveals.some(reveal => reveal.heading === heading)) heading.dataset.textRevealState = 'visible'; });
    reveals.forEach(reveal => { seen.add(reveal.heading); reveal.hold(); });

    const finishWithin = (target: Element | null) => {
      if (!target || target === document.body) return;
      reveals.filter(reveal => reveal.heading === target || target.contains(reveal.heading)).forEach(reveal => reveal.finish());
    };
    const focus = (event: FocusEvent) => { if (event.target instanceof Element) finishWithin(event.target); };
    const hash = () => {
      try { if (location.hash) finishWithin(document.getElementById(decodeURIComponent(location.hash.slice(1)))); }
      catch { /* Ignore invalid URL fragments. */ }
    };
    // Lines depend on width. Re-split headlines that have not played yet.
    let rootWidth = root.getBoundingClientRect().width;
    const layout = new ResizeObserver(() => {
      const width = root.getBoundingClientRect().width;
      if (width === rootWidth || !fontsReady) return;
      rootWidth = width;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => reveals.forEach(reveal => { if (reveal.state === 'pending') reveal.prepare(); }));
    });
    layout.observe(root);
    root.addEventListener('focusin', focus);
    window.addEventListener('hashchange', hash);
    hash();

    // Never leave text hidden because a font request stalled.
    const timeout = window.setTimeout(() => { if (!disposed) reveals.forEach(reveal => reveal.finish()); }, textReveal.fontWaitLimit);
    void document.fonts.ready.then(() => {
      if (disposed) return;
      clearTimeout(timeout);
      fontsReady = true;
      reveals.forEach(reveal => reveal.prepare());
      ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      clearTimeout(timeout);
      cancelAnimationFrame(resizeFrame);
      layout.disconnect();
      root.removeEventListener('focusin', focus);
      window.removeEventListener('hashchange', hash);
      reveals.forEach(reveal => reveal.destroy());
    };
  });

  return () => media.revert();
}
