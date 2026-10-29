'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ButtonLink } from '@/components/ui';
import { scrollToTarget } from '@/lib/page-scroll';
import styles from '../prototype-hero/hero.module.css';
import stars from './hero.module.css';

export function StarfieldHero({ children, interactive = true }: { children: ReactNode; interactive?: boolean }) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current!, stage = stageRef.current!;
    let disposed = false;
    const copy = contentRef.current!;
    // Reveal the authored layout only after its fonts have settled. The field
    // loads independently and continues to own copy opacity during the dive.
    void document.fonts.ready.then(() => {
      if (!disposed) copy.dataset.copyReady = 'true';
    });
    let field: ReturnType<typeof import('./field').mountHeroField> | undefined;
    let pin: ScrollTrigger | undefined;
    let flight: gsap.core.Tween | undefined;
    let launched = 0;
    let flightDirection = 0;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const cancelFlight = () => {
      flight?.kill(); flight = undefined;
      flightDirection = 0;
      delete track.dataset.autoFlight;
    };
    const reverseFlight = (event: WheelEvent) => { if (event.deltaY * flightDirection < 0) cancelFlight(); };
    const escapeFlight = (event: KeyboardEvent) => {
      const up = ['ArrowUp', 'PageUp', 'Home'].includes(event.key);
      const down = ['ArrowDown', 'PageDown', 'End'].includes(event.key);
      if (event.key === 'Escape' || (up && flightDirection > 0) || (down && flightDirection < 0)) cancelFlight();
    };
    window.addEventListener('wheel', reverseFlight, { passive: true });
    window.addEventListener('keydown', escapeFlight);
    const measure = () => {
      const height = Math.max(fieldRef.current!.offsetHeight, nextRef.current!.offsetHeight);
      if (track.style.getPropertyValue('--stage-height') !== `${height}px`) {
        track.style.setProperty('--stage-height', `${height}px`);
        pin?.refresh();
      }
    };
    let resizeFrame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      // Refreshing the pinned stage writes layout; defer until after the
      // observer delivery to avoid a resize-notification feedback loop.
      resizeFrame = requestAnimationFrame(measure);
    });
    resize.observe(nextRef.current!);
    resize.observe(fieldRef.current!);
    const refreshMotion = () => { cancelFlight(); measure(); ScrollTrigger.refresh(); field?.redraw(); };
    motion.addEventListener('change', refreshMotion);
    const load = async () => {
      try {
        const { mountHeroField } = await import('./field');
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        field = mountHeroField({
          track, stage: fieldRef.current!, content: contentRef.current!, next: revealRef.current!, interactive,
          onReady: () => {
            if (disposed) return;
            track.dataset.enhanced = 'true';
            measure();
            // ScrollSmoother transforms its content; native sticky cannot pin
            // within that transform, so use its existing ScrollTrigger engine.
            pin = ScrollTrigger.create({
              id: 'hero-prototype',
              trigger: track, pin: stage, start: 'top top',
              end: () => `+=${track.offsetHeight - stage.offsetHeight}`,
              pinSpacing: false, invalidateOnRefresh: true,
              onUpdate: self => {
                field?.redraw();
                if (!flight && (self.progress < .025 || self.progress > .975)) launched = 0;
                const direction = self.direction;
                const inTakeoverZone = direction > 0 ? self.progress >= .1 && self.progress <= .3 : self.progress >= .7 && self.progress <= .9;
                if (motion.matches || launched === direction || flight || !inTakeoverZone) return;
                launched = direction;
                flightDirection = direction;
                track.dataset.autoFlight = 'true';
                const smoother = ScrollSmoother.get();
                const position = { y: smoother ? smoother.scrollTop() : window.scrollY };
                flight = gsap.to(position, {
                  y: direction > 0 ? self.end : self.start, duration: 2.2, ease: 'power2.inOut',
                  onUpdate: () => {
                    if (smoother) smoother.scrollTop(position.y);
                    else window.scrollTo({ top: position.y, behavior: 'instant' });
                  },
                  onComplete: () => { flight = undefined; flightDirection = 0; launched = 0; delete track.dataset.autoFlight; },
                });
              },
            });
            ScrollTrigger.refresh();
            try {
              const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
              if (target?.closest('[data-hero-reveal]')) scrollToTarget(target, false);
            } catch { /* Ignore malformed URL fragments. */ }
          },
        });
      } catch (error) {
        pin?.kill(); field?.destroy();
        delete track.dataset.enhanced;
        track.dataset.fieldState = 'unavailable';
        console.warn('The optional hero field could not load.', error);
      }
    };
    void load();
    return () => {
      disposed = true;
      cancelFlight();
      window.removeEventListener('wheel', reverseFlight);
      window.removeEventListener('keydown', escapeFlight);
      resize.disconnect();
      cancelAnimationFrame(resizeFrame);
      motion.removeEventListener('change', refreshMotion);
      pin?.kill(); field?.destroy();
      delete track.dataset.enhanced;
    };
  }, [interactive]);

  return <section ref={trackRef} className={`${styles.hero} ${stars.hero}`} data-variant='stars' data-section='hero' aria-labelledby='hero-heading'>
    <div ref={stageRef} className={styles.stage} data-hero-stage>
      <div ref={fieldRef} className={styles.field} aria-hidden='true' data-prototype-field data-starfield />
      <div ref={contentRef} className={`${styles.content} ${stars.content}`}>
        <div className={stars.group}>
          <h1 id='hero-heading' tabIndex={-1} className={`display ${stars.title}`}>Powerful AI.<br/>Built for real use.</h1>
          <p className={stars.lead}>Applications for everyday work. Models and infrastructure to build on. Custom engineering for the problems that need more.</p>
          <ButtonLink href='#applications' variant='primary' size='large'>Explore applications</ButtonLink>
        </div>
      </div>
      <div ref={revealRef} className={`${styles.reveal} ${stars.reveal}`} data-hero-reveal>
        <div ref={nextRef} className={`${styles.nextContent} ${stars.nextContent}`}>{children}</div>
      </div>
    </div>
  </section>;
}
