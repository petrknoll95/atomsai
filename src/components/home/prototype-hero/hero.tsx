'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ButtonLink } from '@/components/ui';
import { scrollToTarget } from '@/lib/page-scroll';
import styles from './hero.module.css';

export function PrototypeHero({ children }: { children: ReactNode }) {
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
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
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
    const refreshMotion = () => { measure(); ScrollTrigger.refresh(); field?.redraw(); };
    motion.addEventListener('change', refreshMotion);
    const load = async () => {
      try {
        const { mountHeroField } = await import('./field');
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        field = mountHeroField({
          track, stage: fieldRef.current!, content: contentRef.current!, next: revealRef.current!,
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
              onUpdate: () => field?.redraw(),
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
      resize.disconnect();
      cancelAnimationFrame(resizeFrame);
      motion.removeEventListener('change', refreshMotion);
      pin?.kill(); field?.destroy();
      delete track.dataset.enhanced;
    };
  }, []);

  return <section ref={trackRef} className={styles.hero} data-section='hero' aria-labelledby='hero-heading'>
    <div ref={stageRef} className={styles.stage}>
      <div ref={fieldRef} className={styles.field} aria-hidden='true' data-prototype-field />
      <div ref={contentRef} className={styles.content}>
        <div className={styles.row}>
          <h1 id='hero-heading' tabIndex={-1} className={`display ${styles.title}`}>Powerful AI. Built for real use.</h1>
          <ButtonLink href='#applications' variant='secondary'>Explore applications</ButtonLink>
        </div>
        <p className={styles.lead}>Applications for everyday work. Models and infrastructure to build on. Custom engineering for the problems that need more.</p>
      </div>
      <div ref={revealRef} className={styles.reveal} data-hero-reveal>
        <div ref={nextRef} className={styles.nextContent} data-text-reveal='off'>{children}</div>
      </div>
    </div>
  </section>;
}
