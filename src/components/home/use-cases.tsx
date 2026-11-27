'use client';

import { assetPath } from '@/lib/base-path';
import { scrollToTarget } from '@/lib/page-scroll';

import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ButtonLink } from '@/components/ui';
import { attachKineticCircles, initialKineticCircleStyle, kineticCircleOptions } from './kinetic-circles';
import { attachKineticCircleInteraction } from './kinetic-circle-interaction';
import { homepageUseCases as useCases } from './navigation-data';
import styles from './proof.module.css';

// Two cycles provide the five visible circles plus offscreen space for seamless
// looping. Each Embla slide contains exactly one circle, never a whole gallery.
const circleSlides = [...useCases, ...useCases];
const initialIndex = 0;

export function UseCases() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: initialIndex,
    watchFocus: false,
    ...kineticCircleOptions,
  });
  const [selectedSnap, setSelectedSnap] = useState(initialIndex);
  const details = useRef<HTMLDivElement>(null);
  const active = selectedSnap % useCases.length;

  useEffect(() => {
    if (!emblaApi) return;
    return attachKineticCircleInteraction(emblaApi, {
      surfaceSelector: '[data-industry-image]',
      artSelector: 'picture',
      insetProperty: '--industry-inset',
    });
  }, [emblaApi]);

  useLayoutEffect(() => {
    if (!emblaApi) return;
    const detachCircles = attachKineticCircles(emblaApi);
    const updateSelection = () => setSelectedSnap(emblaApi.selectedScrollSnap());
    emblaApi.on('select', updateSelection).on('reInit', updateSelection);
    return () => {
      emblaApi.off('select', updateSelection).off('reInit', updateSelection);
      detachCircles();
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const selectLinkedUseCase = () => {
      const index = useCases.findIndex(useCase => `#industry-${useCase.slug}` === window.location.hash);
      if (index >= 0) emblaApi.scrollTo(index, true);
    };
    selectLinkedUseCase();
    window.addEventListener('hashchange', selectLinkedUseCase);
    return () => window.removeEventListener('hashchange', selectLinkedUseCase);
  }, [emblaApi]);

  function selectAtom(index: number) {
    const panel = details.current;
    const alreadySelected = index === selectedSnap;
    if (!alreadySelected) emblaApi?.scrollTo(index);
    if (!panel) return;

    // Bring the result into view when a click lands below the fold.
    const bounds = panel.getBoundingClientRect();
    if (bounds.top > window.innerHeight - 100 || (alreadySelected && bounds.bottom > window.innerHeight)) {
      scrollToTarget(panel);
    }
    if (alreadySelected) panel.focus({ preventScroll: true });
  }

  function moveAtomFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!emblaApi || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    const next = (index + direction + circleSlides.length) % circleSlides.length;
    emblaApi.scrollTo(next, true);
    emblaApi.slideNodes()[next]?.querySelector('button')?.focus({ preventScroll: true });
  }

  const current = useCases[active];

  return (
    <section className={`page-container ${styles.industries}`} id="industries" aria-labelledby="industries-title">
      {useCases.map(useCase => <span key={useCase.slug} id={`industry-${useCase.slug}`} className={styles.industryAnchor} aria-hidden="true" />)}
      <header className={styles.industryHeader}>
        <h2 className={`display ${styles.heading}`} id="industries-title">How teams put AI to work</h2>
      </header>

      <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label="Use cases">
        <div className={styles.carouselStage}>
          <div id="industry-gallery" className={styles.carouselViewport} ref={emblaRef}>
            <div className={styles.carouselTrack}>
              {circleSlides.map((useCase, index) => (
                <div key={`${useCase.slug}-${index}`} className={styles.carouselSlide} data-industry-circle={useCase.name} style={initialKineticCircleStyle(index, initialIndex, circleSlides.length)}>
                  <div className={styles.circle} data-industry-image>
                    <picture>
                      <source
                        media="(max-width: 1199px)"
                        srcSet={assetPath(`/assets/figma/industries-${useCase.image}-512.webp 512w, /assets/figma/industries-${useCase.image}-1024.webp 1024w`)}
                        sizes="(max-width: 767px) 80vw, 50vw"
                      />
                      <img src={assetPath(`/assets/figma/industries-${useCase.image}.webp`)} alt="" width="2048" height="2048" loading="lazy" draggable="false" />
                    </picture>
                    <div className={styles.imageWash} />
                  </div>
                  <button
                    type="button"
                    className={styles.atomButton}
                    aria-label={useCase.name}
                    aria-controls="use-case-details"
                    aria-pressed={index === selectedSnap}
                    tabIndex={index === selectedSnap ? 0 : -1}
                    onClick={() => selectAtom(index)}
                    onKeyDown={event => moveAtomFocus(event, index)}
                  />
                </div>
              ))}
            </div>
          </div>
          <button type="button" className={`${styles.arrowButton} ${styles.previous}`} aria-label="Previous use case" aria-controls="industry-gallery" onClick={() => emblaApi?.scrollPrev()}>
            <ArrowIcon direction="left" size={24} />
          </button>
          <button type="button" className={`${styles.arrowButton} ${styles.next}`} aria-label="Next use case" aria-controls="industry-gallery" onClick={() => emblaApi?.scrollNext()}>
            <ArrowIcon direction="right" size={24} />
          </button>
        </div>
        <div ref={details} id="use-case-details" role="region" aria-labelledby="use-case-title" tabIndex={-1} className={styles.industryDescription}>
          <div className={styles.descriptionCopy} aria-live="polite" aria-atomic="true">
            <span className="sr-only">{active + 1} of {useCases.length}</span>
            <h3 id="use-case-title">{current.name}</h3>
            <p>{current.description}</p>
          </div>
          <ButtonLink href="/company/contact?topic=services" variant="outline">Discuss your workflow</ButtonLink>
        </div>
      </div>
    </section>
  );
}
