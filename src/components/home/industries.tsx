'use client';

import { assetPath, withBasePath } from '@/lib/base-path';

import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useLayoutEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ButtonLink } from '@/components/ui';
import { attachKineticCircles, initialKineticCircleStyle, kineticCircleOptions } from './kinetic-circles';
import { attachKineticCircleInteraction } from './kinetic-circle-interaction';
import { homepageIndustries as industries } from './navigation-data';
import styles from './proof.module.css';

// Two cycles provide the five visible circles plus offscreen space for seamless
// looping. Each Embla slide contains exactly one circle, never a whole gallery.
const circleSlides = [...industries, ...industries];

export function Industries() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: 2,
    ...kineticCircleOptions,
  });
  const [selectedSnap, setSelectedSnap] = useState(2);
  const active = selectedSnap % industries.length;

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
    const selectLinkedIndustry = () => {
      const index = industries.findIndex(industry => `#industry-${industry.slug}` === window.location.hash);
      if (index >= 0) emblaApi.scrollTo(index, true);
    };
    selectLinkedIndustry();
    window.addEventListener('hashchange', selectLinkedIndustry);
    return () => window.removeEventListener('hashchange', selectLinkedIndustry);
  }, [emblaApi]);

  const current = industries[active];

  return (
    <section className={`page-container ${styles.industries}`} id="industries" aria-labelledby="industries-title">
      {industries.map(industry => <span key={industry.slug} id={`industry-${industry.slug}`} className={styles.industryAnchor} aria-hidden="true" />)}
      <header className={styles.industryHeader}>
        <p className={styles.industryLabel}>Industries</p>
        <h2 className={`display ${styles.heading}`} id="industries-title">Every industry has its own version of success</h2>
      </header>

      <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label="Industries">
        <div id="industry-gallery" className={styles.carouselViewport} ref={emblaRef}>
          <div className={styles.carouselTrack}>
            {circleSlides.map((industry, index) => (
              <div key={`${industry.name}-${index}`} className={styles.carouselSlide} data-industry-circle={industry.name} style={initialKineticCircleStyle(index, 2, circleSlides.length)}>
                <div className={styles.circle} data-industry-image>
                  <picture>
                    <source
                      media="(max-width: 1199px)"
                      srcSet={assetPath(`/assets/figma/industries-${industry.image}-512.webp 512w, /assets/figma/industries-${industry.image}-1024.webp 1024w`)}
                      sizes="(max-width: 767px) 80vw, 50vw"
                    />
                    <img src={assetPath(`/assets/figma/industries-${industry.image}.webp`)} alt="" width="2048" height="2048" loading="lazy" draggable="false" />
                  </picture>
                  <div className={styles.imageWash} />
                  <a
                    className={styles.industryBadge}
                    href={withBasePath(industry.href)}
                    aria-label={industry.action === 'Discuss your workflow' ? `Discuss ${industry.name.toLowerCase()} workflows` : industry.action}
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
              <ArrowIcon direction="left" size={24} />
            </button>
          </div>
          <div className={styles.industryDescription}>
            <div className={styles.descriptionCopy} aria-live="polite" aria-atomic="true">
              <span className="sr-only">{active + 1} of {industries.length}</span>
              <h3>{current.name}</h3>
              <p>{current.description}</p>
            </div>
            <ButtonLink href={current.href} size="small" variant="outline">{current.action}</ButtonLink>
          </div>
          <div className={styles.next}>
            <button type="button" className={styles.arrowButton} aria-label="Next industry" aria-controls="industry-gallery" onClick={() => emblaApi?.scrollNext()}>
              <ArrowIcon direction="right" size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
