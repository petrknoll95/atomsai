'use client';

import { useMemo, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { createStoryAutoplay, useStoryAutoplay } from './use-story-autoplay';
import carousel from './stories-carousel.module.css';
import { Eyebrow } from '@/components/ui';
import styles from './proof.module.css';

const quote = '“The evals are what sold my board. I can show a number for accuracy and a number for cost, per workflow, per month.”';

// Four slots are shown in Figma, but only this story has supplied content.
// The user approved repeating Northwind until the other stories are available.
const storySlots = ['northwind-1', 'northwind-2', 'northwind-3', 'northwind-4'];

export function Stories() {
  const autoplay = useMemo(() => createStoryAutoplay(), []);
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, startIndex: 2, duration: 32, breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } }, [autoplay]);
  const { root, bars, active, paused, togglePlayback } = useStoryAutoplay(embla);
  const storyDialog = useRef<HTMLDialogElement>(null);

  return (
    <section ref={root} aria-roledescription="carousel" className={`page-container ${styles.stories}`} id="customer-stories" aria-labelledby="customer-stories-title">
      <h2 id="customer-stories-title" className="sr-only">Customer stories</h2>
      <div className={carousel.viewport} ref={emblaRef}>
        <div className={carousel.track}>
          {storySlots.map((slot, index) => (
            <div key={slot} className={carousel.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${storySlots.length}`} aria-hidden={active !== index} inert={active !== index}>
              <div className={styles.storyGrid}>
                <div className={styles.portrait}>
                  <picture>
                    <source media="(max-width: 1199px)" srcSet="/assets/figma/stories-Media-512.webp 512w, /assets/figma/stories-Media-1024.webp 1024w" sizes="(max-width: 767px) 100vw, 40vw" />
                    <img src="/assets/figma/stories-Media.webp" alt="Portrait accompanying the customer story" width="480" height="640" loading="lazy" />
                  </picture>
                </div>
                <div className={styles.storyContent}>
                  <div className={styles.quoteBlock}>
                    <Eyebrow>Customer Stories</Eyebrow>
                    <figure className={styles.testimonial}>
                      <blockquote className={`display ${styles.quote}`}>{quote}</blockquote>
                      <figcaption className={styles.person}>
                        <span>Aaron Vasquez</span>
                        <span>Global Operations Manager</span>
                      </figcaption>
                    </figure>
                  </div>
                  <div className={styles.companyRow}>
                    <img className={styles.companyLogo} src="/assets/figma/stories-Company.svg" alt="Northwind Logistics" width="184" height="32" loading="lazy" />
                    <button type="button" className="button button-medium button-outline" onClick={(event) => { event.currentTarget.focus(); storyDialog.current?.showModal(); }}>Read Story</button>
                  </div>
                </div>
        
                {/* Use the surrounding light theme so results remain readable on paper. */}
                <div className={styles.metrics} aria-label="Customer results">
                  <div className={styles.metric}>
                    <div className={styles.metricValues}>
                      <span className={`display ${styles.previousValue}`}>78%</span>
                      <span className={styles.metricArrow} role="img" aria-label="to" />
                      <span className="display">94%</span>
                    </div>
                    <p>Invoice auto-match rate on 40k invoices/quarter</p>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricValues}>
                      <span className={`display ${styles.previousValue}`}>5 days</span>
                      <span className={styles.metricResult}>
                        <span className={styles.metricArrow} role="img" aria-label="to" />
                        <span className="display">4 hours</span>
                      </span>
                    </div>
                    <p>Month-end audit prep<br />first two quarters</p>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricValues}><span className="display">−81%</span></div>
                    <p>Cost per processed document vs. prior BPO rate</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={carousel.pagination} role="group" aria-label="Choose customer story">
        {storySlots.map((slot, index) => (
          <button key={slot} type="button" className={carousel.dot} aria-label={`Go to story ${index + 1}`} aria-current={active === index ? 'true' : undefined} onClick={() => { embla?.scrollTo(index); }}>
            <span className={carousel.line} aria-hidden="true"><span className={carousel.fill} ref={element => { bars.current[index] = element; }} /></span>
          </button>
        ))}
        <button data-story-playback className={carousel.playback} type="button" aria-label={paused ? 'Play customer stories' : 'Pause customer stories'} onClick={togglePlayback}>
          <svg viewBox="0 0 16 16" aria-hidden="true">{paused ? <path d="M4 2 14 8 4 14Z" /> : <path d="M4 2h3v12H4zM9 2h3v12H9z" />}</svg>
        </button>
      </div>

      <dialog className={styles.storyDialog} ref={storyDialog} aria-labelledby="story-dialog-title" onClose={() => root.current?.querySelector<HTMLButtonElement>('[aria-roledescription="slide"][aria-hidden="false"] button')?.focus()}>
        <div className={styles.dialogHeader}>
          <h2 className="display" id="story-dialog-title">Northwind Logistics</h2>
          <button type="button" className="button button-small button-secondary" onClick={() => storyDialog.current?.close()}>Close</button>
        </div>
        <blockquote>{quote}</blockquote>
        <p>Aaron Vasquez · Global Operations Manager</p>
        <dl>
          <div><dt>Invoice auto-match rate</dt><dd>78% → 94% on 40k invoices/quarter</dd></div>
          <div><dt>Month-end audit preparation</dt><dd>5 days → 4 hours in the first two quarters</dd></div>
          <div><dt>Cost per processed document</dt><dd>81% lower than the prior BPO rate</dd></div>
        </dl>
      </dialog>
    </section>
  );
}
