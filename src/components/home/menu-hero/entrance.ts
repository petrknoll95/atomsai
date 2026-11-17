import { gsap } from 'gsap';

type Mount = { stage: HTMLElement; copy: HTMLElement; pattern: HTMLElement; available: boolean | null };

/** Entry owns its own wrappers; scroll parallax keeps ownership of the outer layers. */
export function mountHeroEntrance({ stage, copy, pattern, available }: Mount) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const alreadyVisible = getComputedStyle(copy).visibility !== 'hidden';
  let disposed = false, started = false, fontsReady = false;
  let queuedFrame = 0;
  let entry: gsap.core.Timeline | undefined;
  let recovery: gsap.core.Tween | undefined;
  let patternAvailable = available;

  const setAvailability = () => {
    stage.dataset.heroPatternState = patternAvailable === null ? 'pending' : patternAvailable ? 'ready' : 'unavailable';
  };
  const finishCopy = () => {
    stage.dataset.heroEntry = 'ready';
    gsap.set(copy, { clearProps: 'opacity,visibility,transform,willChange' });
  };
  const finishPattern = () => {
    // The ready CSS supplies the endpoint after the temporary compositor layer is released.
    gsap.set(pattern, { clearProps: 'opacity,transform,willChange' });
  };
  const settle = () => {
    if (disposed) return;
    started = true;
    clearTimeout(deadline);
    cancelAnimationFrame(queuedFrame);
    entry?.kill(); recovery?.kill();
    finishCopy(); finishPattern();
  };
  const enter = () => {
    queuedFrame = 0;
    if (disposed || started || !fontsReady || patternAvailable === null) return;
    started = true;
    clearTimeout(deadline);
    // Restoring a scrolled page must not replay an entrance above the reader.
    if (reduced.matches || stage.getBoundingClientRect().top < -64) { settle(); return; }
    stage.dataset.heroEntry = 'revealing';
    entry = gsap.timeline({ onComplete: () => { finishCopy(); if (!recovery) finishPattern(); } });
    if (patternAvailable) {
      entry.fromTo(pattern, { opacity: 0, y: -48, willChange: 'opacity,transform' }, {
        opacity: 1, y: 0, duration: 1.45, ease: 'power3.out',
      }, 0);
    }
    entry.fromTo(copy, { autoAlpha: 0, y: -10, willChange: 'opacity,transform' }, {
      autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out',
    }, patternAvailable ? .24 : 0);
  };
  const tryEnter = () => {
    if (disposed || started || queuedFrame || !fontsReady || patternAvailable === null) return;
    // Let the completed shader frame reach the compositor before exposing it.
    queuedFrame = requestAnimationFrame(() => { queuedFrame = requestAnimationFrame(enter); });
  };
  const availabilityChanged = (next: boolean) => {
    if (disposed || next === patternAvailable) return;
    patternAvailable = next;
    setAvailability();
    if (!started) { tryEnter(); return; }
    // A lost/recovered context affects only the decorative layer, never the copy.
    entry?.killTweensOf(pattern); recovery?.kill(); recovery = undefined;
    if (!next || reduced.matches) { finishPattern(); return; }
    recovery = gsap.fromTo(pattern, { opacity: 0, y: -24, willChange: 'opacity,transform' }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
      onComplete: () => { recovery = undefined; finishPattern(); },
    });
  };

  stage.dataset.heroEntry = 'pending';
  stage.dataset.heroControlled = 'true';
  setAvailability();
  // A missing chunk, font, or WebGL context must never leave the hero blank.
  const deadline = window.setTimeout(() => {
    if (disposed || started) return;
    fontsReady = true;
    if (patternAvailable === null) { patternAvailable = false; setAvailability(); }
    tryEnter();
  }, 3000);
  void document.fonts.ready.then(() => { if (!disposed) { fontsReady = true; tryEnter(); } });
  const motionChanged = () => { if (reduced.matches && started) settle(); };
  const focus = () => settle();
  const pageShow = (event: PageTransitionEvent) => { if (event.persisted) settle(); };
  reduced.addEventListener('change', motionChanged);
  stage.addEventListener('focusin', focus);
  window.addEventListener('pageshow', pageShow);
  // If hydration arrives after the CSS fail-open, keep the readable fallback in place.
  if (alreadyVisible) settle();

  return {
    availabilityChanged,
    destroy: () => {
      disposed = true;
      clearTimeout(deadline); cancelAnimationFrame(queuedFrame);
      reduced.removeEventListener('change', motionChanged);
      stage.removeEventListener('focusin', focus);
      window.removeEventListener('pageshow', pageShow);
      entry?.kill(); recovery?.kill();
      gsap.set([copy, pattern], { clearProps: 'opacity,visibility,transform,willChange' });
      stage.dataset.heroEntry = 'pending';
      delete stage.dataset.heroControlled;
      delete stage.dataset.heroPatternState;
    },
  };
}
