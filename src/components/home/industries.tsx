'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
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
    href: 'https://atomsai.com/industries/healthcare',
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
  const [active, setActive] = useState(2);
  const [chooserOpen, setChooserOpen] = useState(false);
  const chooserRef = useRef<HTMLDivElement>(null);
  const chooserButtonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!emblaApi) return;
    const detachCircles = attachKineticCircles(emblaApi);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateSelection = () => setActive(emblaApi.selectedScrollSnap() % industries.length);
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

  useEffect(() => {
    if (!chooserOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!chooserRef.current?.contains(event.target as Node)) setChooserOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [chooserOpen]);
  const current = industries[active];

  const chooseIndustry = (index: number) => {
    if (!emblaApi) return;
    const selected = emblaApi.selectedScrollSnap();
    const candidates = [index, index + industries.length];
    const distance = (target: number) => Math.min(Math.abs(target - selected), circleSlides.length - Math.abs(target - selected));
    const nearest = candidates.reduce((best, candidate) => distance(candidate) < distance(best) ? candidate : best);
    emblaApi.scrollTo(nearest);
  };

  return (
    <section className={`page-container ${styles.industries}`} id="industries" aria-labelledby="industries-title">
      <header className={styles.industryHeader}>
        <Eyebrow>Industries</Eyebrow>
        <div className={styles.headingRow}>
          <h2 className={`display ${styles.heading}`} id="industries-title">Built for every team and use case</h2>
          <div className={styles.industryChooser} ref={chooserRef} onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setChooserOpen(false);
              chooserButtonRef.current?.focus();
            }
          }}>
            <button
              type="button"
              className="button button-medium button-secondary"
              aria-expanded={chooserOpen}
              aria-controls="industry-options"
              ref={chooserButtonRef}
              onClick={() => setChooserOpen(!chooserOpen)}
            >View All Industries</button>
            {chooserOpen && (
              <div id="industry-options" className={styles.industryOptions}>
                {industries.map((industry, index) => (
                  <button type="button" key={industry.name} aria-pressed={index === active} onClick={() => { chooseIndustry(index); setChooserOpen(false); chooserButtonRef.current?.focus(); }}>
                    {industry.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label="Industries">
        <div id="industry-gallery" className={styles.carouselViewport} ref={emblaRef} aria-hidden="true">
          <div className={styles.carouselTrack}>
            {circleSlides.map((industry, index) => (
              <div key={`${industry.name}-${index}`} className={styles.carouselSlide} data-industry-circle={industry.name} style={initialCircleStyle(index)}>
                <div className={styles.circle}>
                  <picture>
                    <source
                      media="(max-width: 1199px)"
                      srcSet={`/assets/figma/industries-${industry.image}-512.webp 512w, /assets/figma/industries-${industry.image}-1024.webp 1024w`}
                      sizes="(max-width: 767px) 80vw, 50vw"
                    />
                    <img src={`/assets/figma/industries-${industry.image}.webp`} alt="" width="2048" height="2048" loading="lazy" draggable="false" />
                  </picture>
                  <div className={styles.imageWash} />
                  <span className={styles.industryBadge}>{industry.name}</span>
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
