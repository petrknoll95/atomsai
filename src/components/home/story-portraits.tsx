'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';
import carousel from './stories-carousel.module.css';
import styles from './proof.module.css';
import type { StoryPortrait } from './story-data';

const slits = Array.from({ length: 8 }, (_, index) => index);

const portraitSizes = '(max-width: 767px) 100vw, (max-width: 1199px) 40vw, 33vw';
function PortraitImage({ image }: { image: StoryPortrait }) {
  return <picture>
    <img draggable={false} src={image.src} srcSet={image.srcSet} sizes={portraitSizes} alt="" width="480" height="640" loading="lazy" />
  </picture>;
}

/** Embla keeps gesture/navigation ownership; GSAP composites eight masked strips. */
export function StoryPortraits({ master, slots, images, paused, onTogglePlayback }: {
  master: EmblaCarouselType | undefined;
  slots: readonly string[];
  images: readonly StoryPortrait[];
  paused: boolean;
  onTogglePlayback: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [ref, portraits] = useEmblaCarousel({
    loop: true, startIndex: 0, duration: 32,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });

  useEffect(() => {
    if (!master || !portraits) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const followStory = () => {
      const index = master.selectedScrollSnap();
      if (portraits.selectedScrollSnap() !== index) portraits.scrollTo(index, motion.matches);
    };
    const followPortrait = () => {
      const index = portraits.selectedScrollSnap();
      if (master.selectedScrollSnap() !== index) master.scrollTo(index, motion.matches);
    };
    const align = () => portraits.scrollTo(master.selectedScrollSnap(), true);
    align();
    master.on('select', followStory).on('reInit', align);
    portraits.on('select', followPortrait).on('reInit', align);
    return () => {
      master.off('select', followStory).off('reInit', align);
      portraits.off('select', followPortrait).off('reInit', align);
    };
  }, [master, portraits]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!master || !frame) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const layers = Array.from(frame.querySelectorAll<HTMLElement>('[data-slit-layer]'));
    const outgoing = layers[0].querySelectorAll<HTMLElement>('[data-portrait-slit]');
    const incoming = layers[1].querySelectorAll<HTMLElement>('[data-portrait-slit]');
    const outgoingImages = layers[0].querySelectorAll('picture');
    const incomingImages = layers[1].querySelectorAll('picture');
    const animated = [...outgoing, ...incoming, ...outgoingImages, ...incomingImages];
    let shown = master.selectedScrollSnap();
    let requested = shown;
    let timeline: gsap.core.Timeline | null = null;
    let disposed = false;
    let requestVersion = 0;
    const ready = new Map<number, Promise<void>>();
    const load = (index: number) => {
      if (!ready.has(index)) {
        const image = new Image();
        image.sizes = portraitSizes;
        image.srcset = images[index].srcSet;
        image.src = images[index].src;
        ready.set(index, image.decode());
      }
      return ready.get(index)!;
    };
    const applyImage = (container: HTMLElement, index: number) => {
      container.querySelectorAll('img').forEach(image => {
        image.srcset = images[index].srcSet;
        image.src = images[index].src;
        image.loading = 'eager';
      });
    };
    // Warm the local responsive assets near the carousel, not at page startup.
    const preload = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      images.forEach((_, index) => { void load(index).catch(() => {}); });
      preload.disconnect();
    }, { rootMargin: '600px' });
    preload.observe(frame);
    const commit = (index: number) => {
      applyImage(frame.querySelector<HTMLElement>('[data-portrait-still]')!, index);
      frame.querySelector('[role="img"]')?.setAttribute('aria-label', images[index].alt);
      shown = index;
      frame.dataset.portraitIndex = String(index);
      frame.dataset.slitTransition = 'idle';
      // One unsliced image at rest avoids seams at fractional column widths.
      gsap.set(layers, { visibility: 'hidden' });
      gsap.set(animated, { clearProps: 'transform,clipPath,willChange' });
    };
    const reveal = () => {
      if (requested === shown || motion.matches) { commit(requested); return; }
      const target = requested;
      applyImage(layers[0], shown);
      applyImage(layers[1], target);
      frame.dataset.slitTransition = 'running';
      layers[0].dataset.portraitIndex = String(shown);
      layers[1].dataset.portraitIndex = String(target);
      gsap.set(layers, { visibility: 'visible' });
      gsap.set(outgoing, { clipPath: 'inset(0% 0% 0% 0%)' });
      // Every slit starts together, opening away from the portrait's center.
      const radialOffset = (index: number) => (index - 3.5) / 3.5;
      gsap.set(incoming, { clipPath: index => index < 4 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' });
      gsap.set(incomingImages, {
        xPercent: index => -radialOffset(index) * 8,
        scale: 1.1,
      });
      gsap.set([...outgoingImages, ...incomingImages], { willChange: 'transform' });
      timeline = gsap.timeline({
        onComplete: () => {
          timeline = null;
          commit(target);
          // Rapid input coalesces to the latest selection, with no hard reset
          // of a partially visible image or queue of obsolete transitions.
          if (requested !== shown) void prepareReveal();
        },
      })
        .to(outgoingImages, { xPercent: index => radialOffset(index) * 5,
          scale: 1.08, duration: .8, ease: 'power2.inOut' }, 0)
        .to(incoming, { clipPath: 'inset(0% 0% 0% 0%)', duration: .8, ease: 'power3.inOut' }, 0)
        .to(incomingImages, { xPercent: 0, scale: 1, duration: .8, ease: 'power3.out' }, 0);
    };
    const prepareReveal = async () => {
      const target = requested;
      const version = ++requestVersion;
      try { await load(target); } catch { return; }
      if (disposed || version !== requestVersion) return;
      if (target !== requested) { void prepareReveal(); return; }
      reveal();
    };
    const select = () => {
      requested = master.selectedScrollSnap();
      if (timeline && !motion.matches) { timeline.timeScale(1.8); return; }
      timeline?.kill(); timeline = null;
      void prepareReveal();
    };
    const reset = () => {
      requestVersion++;
      timeline?.kill(); timeline = null;
      requested = master.selectedScrollSnap(); commit(requested);
    };
    reset();
    master.on('select', select).on('reInit', reset);
    motion.addEventListener('change', reset);
    return () => {
      disposed = true; requestVersion++; preload.disconnect();
      master.off('select', select).off('reInit', reset);
      motion.removeEventListener('change', reset);
      timeline?.kill();
      gsap.set(animated, { clearProps: 'transform,clipPath,willChange' });
    };
  }, [master, images]);

  return (
    <div ref={frameRef} data-story-portraits
      className={`${carousel.viewport} ${styles.portrait} ${styles.portraitCarousel}`} onDragStart={event => event.preventDefault()}>
      <div ref={ref} className={carousel.portraitViewport} role="img" aria-label="Portrait accompanying the customer story">
      <div className={carousel.portraitTrack} aria-hidden="true">
        {slots.map((slot, index) => <div key={slot} className={carousel.portraitSlide} data-portrait-slide={index} />)}
      </div>
      </div>
      <div className={carousel.portraitStill} data-portrait-still aria-hidden="true"><PortraitImage image={images[0]} /></div>
      {['outgoing', 'incoming'].map(layer => <div key={layer} className={carousel.slitLayer} data-slit-layer={layer} aria-hidden="true">
        {slits.map(index => <div key={index} className={carousel.portraitSlit} data-portrait-slit={index}
          style={{ '--slit-index': index } as CSSProperties}><PortraitImage image={images[0]} /></div>)}
      </div>)}
      <button data-story-playback className={`${carousel.imageControl} ${carousel.playback}`} type="button"
        aria-label={paused ? 'Play customer stories' : 'Pause customer stories'} aria-controls="customer-story-content" onClick={onTogglePlayback}>
        <svg viewBox="0 0 16 16" aria-hidden="true">{paused ? <path d="M4 2 14 8 4 14Z" /> : <path d="M4 2h3v12H4zM9 2h3v12H9z" />}</svg>
      </button>
      <button className={`${carousel.imageControl} ${carousel.previous}`} type="button" aria-label="Previous customer story" aria-controls="customer-story-content" onClick={() => master?.scrollPrev()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
      </button>
      <button className={`${carousel.imageControl} ${carousel.next}`} type="button" aria-label="Next customer story" aria-controls="customer-story-content" onClick={() => master?.scrollNext()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
      </button>
    </div>
  );
}
