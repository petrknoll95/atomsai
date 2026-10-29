'use client';

import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { gsap } from 'gsap';
import { ButtonLink, Eyebrow } from '@/components/ui';
import { attachKineticCircles } from './kinetic-circles';
import styles from './proof.module.css';

// Descriptions and destinations from atomsai.com's industry cards, checked
// against the corresponding industry pages on 26 October 2026.
const industries = [
  {
    name: 'Manufacturing',
    image: 'BackgroundImage',
    description: 'Connect the supplier, the shop floor and the office.',
    href: 'https://atomsai.com/industries/manufacturing',
  },
  {
    name: 'Healthcare',
    image: 'BackgroundImage1',
    description: 'More time for people. Less time finding answers.',
    href: '/industries/healthcare',
  },
  {
    name: 'Insurance',
    image: 'BackgroundImage2',
    description: 'Less chasing. More informed underwriting.',
    href: 'https://atomsai.com/industries/insurance',
  },
  {
    name: 'Logistics',
    image: 'BackgroundImage3',
    description: 'Keep freight, documents and exceptions moving.',
    href: 'https://atomsai.com/industries/logistics',
  },
];

// Two cycles provide the five visible circles plus offscreen space for seamless
// looping. Each Embla slide contains exactly one circle, never a whole gallery.
const circleSlides = [...industries, ...industries];

function initialCircleStyle(index: number): CSSProperties {
  const distance = ((index - 2 + circleSlides.length * 1.5) % circleSlides.length) - circleSlides.length / 2;
  const side = Math.sign(distance);
  const depth = Math.abs(distance);
  const travel = depth === 0 ? '0' : depth === 1 ? String(side) : `calc(${side} * (1 + var(--near-circle)))`;
  const mask = depth === 0 ? '0' : depth === 1 ? 'calc(1 - var(--near-circle))' : 'calc(1 - var(--far-circle))';
  return {
    '--slide-index': index,
    '--circle-travel': travel,
    '--circle-gap': distance * 8,
    '--mask-left': side < 0 ? mask : '0',
    '--mask-right': side > 0 ? mask : '0',
    '--image-wash': Math.min(1, depth),
    visibility: depth > 2 ? 'hidden' : 'visible',
  } as CSSProperties;
}

export function Industries() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: 2,
    duration: 32,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });
  const [selectedSnap, setSelectedSnap] = useState(2);
  const active = selectedSnap % industries.length;

  useEffect(() => {
    if (!emblaApi) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(any-hover: hover)');
    const context = gsap.context(() => {
      let pressed = false;
      const updates: (() => void)[] = [];
      const cleanups = emblaApi.slideNodes().map(slide => {
        const circle = slide.querySelector<HTMLElement>('[data-industry-image]');
        const picture = circle?.querySelector('picture');
        if (!circle || !picture) return () => {};
        let inside = hover.matches && slide.matches(':hover');
        const inset = gsap.quickTo(circle, '--industry-inset', { duration: 1.2, ease: 'power2.out' });
        const zoom = ['scaleX', 'scaleY'].map(axis =>
          gsap.quickTo(picture, axis, { duration: 1.2, ease: 'power2.out' }));
        const update = () => {
          // Clip the image only; Embla's measured slides and hit areas stay fixed.
          const pressInset = Math.max(18, Math.min(36, circle.clientWidth * .065));
          inset.tween.duration(pressed ? .45 : 1.2);
          inset(pressed ? pressInset : inside ? 12 : 0);
          if (reduced.matches) inset.tween.progress(1).pause();
          zoom.forEach(setScale => {
            setScale(inside && !reduced.matches ? 1.06 : 1);
            if (reduced.matches) setScale.tween.progress(1).pause();
          });
        };
        updates.push(update);
        const enter = (event: PointerEvent) => {
          if (!hover.matches || event.pointerType === 'touch') return;
          inside = true;
          update();
        };
        const leave = () => { inside = false; update(); };
        const hoverChange = () => { if (!hover.matches) inside = false; update(); };
        // The outer slide keeps a stable hit area while its image clip shrinks.
        // Embla continues to own the slide transform and its side-slit mask.
        slide.addEventListener('pointerenter', enter);
        slide.addEventListener('pointerleave', leave);
        slide.addEventListener('pointercancel', leave);
        reduced.addEventListener('change', update);
        hover.addEventListener('change', hoverChange);
        update();
        return () => {
          slide.removeEventListener('pointerenter', enter);
          slide.removeEventListener('pointerleave', leave);
          slide.removeEventListener('pointercancel', leave);
          reduced.removeEventListener('change', update);
          hover.removeEventListener('change', hoverChange);
        };
      });
      const setPressed = (value: boolean) => {
        if (pressed === value) return;
        pressed = value;
        emblaApi.rootNode().dataset.pressed = String(value);
        updates.forEach(update => update());
      };
      const press = () => setPressed(true);
      const release = () => setPressed(false);
      const visibility = () => { if (document.hidden) release(); };
      emblaApi.on('pointerDown', press).on('pointerUp', release).on('reInit', release);
      // A drag can end outside the gallery or be cancelled by native scrolling.
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
      window.addEventListener('blur', release);
      document.addEventListener('visibilitychange', visibility);
      return () => {
        emblaApi.off('pointerDown', press).off('pointerUp', release).off('reInit', release);
        window.removeEventListener('pointerup', release);
        window.removeEventListener('pointercancel', release);
        window.removeEventListener('blur', release);
        document.removeEventListener('visibilitychange', visibility);
        delete emblaApi.rootNode().dataset.pressed;
        cleanups.forEach(cleanup => cleanup());
      };
    }, emblaApi.rootNode());
    return () => context.revert();
  }, [emblaApi]);

  useLayoutEffect(() => {
    if (!emblaApi) return;
    const detachCircles = attachKineticCircles(emblaApi);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateSelection = () => setSelectedSnap(emblaApi.selectedScrollSnap());
    // Embla's drag release has its own momentum duration. Keep direct dragging,
    // but settle immediately when the user requests reduced motion.
    const settleDrag = () => {
      if (reducedMotion.matches) emblaApi.scrollTo(emblaApi.selectedScrollSnap(), true);
    };
    emblaApi.on('select', updateSelection).on('reInit', updateSelection).on('pointerUp', settleDrag);
    return () => {
      emblaApi.off('select', updateSelection).off('reInit', updateSelection).off('pointerUp', settleDrag);
      detachCircles();
    };
  }, [emblaApi]);

  const current = industries[active];

  return (
    <section className={`page-container ${styles.industries}`} id="industries" aria-labelledby="industries-title">
      <header className={styles.industryHeader}>
        <Eyebrow href="https://atomsai.com/industries">Industries</Eyebrow>
        <h2 className={`display ${styles.heading}`} id="industries-title">AI products and services for your industry.</h2>
      </header>

      <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label="Industries">
        <div id="industry-gallery" className={styles.carouselViewport} ref={emblaRef}>
          <div className={styles.carouselTrack}>
            {circleSlides.map((industry, index) => (
              <div key={`${industry.name}-${index}`} className={styles.carouselSlide} data-industry-circle={industry.name} style={initialCircleStyle(index)}>
                <div className={styles.circle} data-industry-image>
                  <picture>
                    <source
                      media="(max-width: 1199px)"
                      srcSet={`/assets/figma/industries-${industry.image}-512.webp 512w, /assets/figma/industries-${industry.image}-1024.webp 1024w`}
                      sizes="(max-width: 767px) 80vw, 50vw"
                    />
                    <img src={`/assets/figma/industries-${industry.image}.webp`} alt="" width="2048" height="2048" loading="lazy" draggable="false" />
                  </picture>
                  <div className={styles.imageWash} />
                  <a
                    className={styles.industryBadge}
                    href={industry.href}
                    aria-label={`Learn more about ${industry.name}`}
                    aria-hidden={index !== selectedSnap}
                    tabIndex={index === selectedSnap ? 0 : -1}
                    draggable={false}
                  ><span>{industry.name}</span></a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.carouselControls}>
          <div className={styles.previous}>
            <button type="button" className={styles.arrowButton} aria-label="Previous industry" aria-controls="industry-gallery" onClick={() => emblaApi?.scrollPrev()}>
              <img src="/assets/figma/industries-IconArtwork.svg" width="24" height="24" alt="" draggable={false} />
            </button>
          </div>
          <div className={styles.industryDescription}>
            <div className={styles.descriptionCopy} aria-live="polite" aria-atomic="true">
              <span className="sr-only">{active + 1} of {industries.length}</span>
              <h3>{current.name}</h3>
              <p>{current.description}</p>
            </div>
            <ButtonLink href={current.href} size="small" variant="outline">Learn More</ButtonLink>
          </div>
          <div className={styles.next}>
            <button type="button" className={styles.arrowButton} aria-label="Next industry" aria-controls="industry-gallery" onClick={() => emblaApi?.scrollNext()}>
              <img src="/assets/figma/industries-IconArtwork1.svg" width="24" height="24" alt="" draggable={false} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
