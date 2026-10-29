'use client';

import { useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';
import { createStoryAutoplay, useStoryAutoplay } from './use-story-autoplay';
import { useStoryReveal } from './use-story-reveal';
import { StoryPortraits } from './story-portraits';
import carousel from './stories-carousel.module.css';
import { Eyebrow } from '@/components/ui';
import styles from './proof.module.css';

import { customerStories, storyPortraits, storySlots } from './story-data';

export function Stories() {
  const autoplay = useMemo(() => createStoryAutoplay(), []);
  const fade = useMemo(() => Fade(), []);
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, startIndex: 0, duration: 32, breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } }, [autoplay, fade]);
  const { root, bars, active, paused, togglePlayback } = useStoryAutoplay(embla);
  useStoryReveal(embla);
  const [dialogStory, setDialogStory] = useState(customerStories[0]);
  const storyDialog = useRef<HTMLDialogElement>(null);

  return (
    <section ref={root} aria-roledescription="carousel" className={`page-container ${styles.stories}`} id="customer-stories" aria-labelledby="customer-stories-title">
      <h2 id="customer-stories-title" className="sr-only">Customer stories</h2>
      <div className={carousel.stage}>
      <StoryPortraits master={embla} slots={storySlots} images={storyPortraits} paused={paused} onTogglePlayback={togglePlayback} />
      <div id="customer-story-content" className={`${carousel.viewport} ${carousel.contentViewport}`} ref={emblaRef} onDragStart={event => event.preventDefault()}>
        <div className={carousel.track}>
          {customerStories.map((story, index) => (
            <div key={story.id} className={carousel.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${storySlots.length}`} aria-hidden={active !== index} inert={active !== index}>
              <div className={styles.storyGrid}>
                <div className={styles.portrait} data-portrait-slot aria-hidden="true" />
                <div className={styles.storyContent}>
                  <div className={styles.quoteBlock}>
                    <Eyebrow href="https://atomsai.com/resources/case-studies">Customer Stories</Eyebrow>
                    <figure className={styles.testimonial}>
                      <blockquote data-story-reveal className={`display ${styles.quote}`}>{story.quote}</blockquote>
                      <figcaption data-story-reveal className={styles.person}>
                        <span>{story.name}</span>
                        <span>{story.role}</span>
                      </figcaption>
                    </figure>
                  </div>
                  <div className={styles.companyRow}>
                    <div data-story-reveal>{story.logo ? <img draggable={false} className={styles.companyLogo} src={story.logo} alt={story.company} width="184" height="32" loading="lazy" /> : <span className={carousel.companyName}>{story.company}</span>}</div>
                    <button data-story-reveal type="button" className="button button-medium button-outline" onClick={(event) => { event.currentTarget.focus(); setDialogStory(story); storyDialog.current?.showModal(); }}>Read Story</button>
                  </div>
                </div>
        
                {/* Use the surrounding light theme so results remain readable on paper. */}
                <div className={styles.metrics} aria-label="Customer results">
                  {story.metrics.map(metric => <div key={metric.description} data-story-reveal className={styles.metric}>
                    <div className={styles.metricValues}>
                      {metric.before ? <>
                        <span className={`display ${styles.previousValue}`}>{metric.before}</span>
                        <div className={styles.metricResult}><span className={styles.metricArrow} role="img" aria-label="to" /><span className="display">{metric.value}</span></div>
                      </> : <span className="display">{metric.value}</span>}
                    </div>
                    <p style={{ whiteSpace: 'pre-line' }}>{metric.description}</p>
                  </div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
      <div className={carousel.pagination} role="group" aria-label="Choose customer story">
        {storySlots.map((slot, index) => (
          <button key={slot} type="button" className={carousel.dot} aria-label={`Go to story ${index + 1}`} aria-current={active === index ? 'true' : undefined} onClick={() => { embla?.scrollTo(index); }}>
            <span className={carousel.line} aria-hidden="true"><span className={carousel.fill} ref={element => { bars.current[index] = element; }} /></span>
          </button>
        ))}
      </div>

      <dialog className={styles.storyDialog} ref={storyDialog} aria-labelledby="story-dialog-title" onClose={() => root.current?.querySelector<HTMLButtonElement>('[aria-roledescription="slide"][aria-hidden="false"] button')?.focus()}>
        <div className={styles.dialogHeader}>
          <h2 className="display" id="story-dialog-title">{dialogStory.company}</h2>
          <button type="button" className="button button-small button-secondary" onClick={() => storyDialog.current?.close()}>Close</button>
        </div>
        <blockquote>{dialogStory.quote}</blockquote>
        <p>{dialogStory.name} · {dialogStory.role}</p>
        <dl>
          {dialogStory.metrics.map(metric => <div key={metric.description}><dt>{metric.description}</dt><dd>{metric.before ? `${metric.before} → ` : ''}{metric.value}</dd></div>)}
        </dl>
      </dialog>
    </section>
  );
}
