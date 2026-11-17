'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ButtonLink } from '@/components/ui';
import styles from '../prototype-hero/hero.module.css';
import stars from '../starfield-hero/hero.module.css';
import { MenuHeroBackdrop } from './backdrop';
import menuHero from './hero.module.css';
import { mountHeroScroll } from './transition';

export function MenuPatternHero({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current!, stage = stageRef.current!;
    let disposed = false;
    const copy = contentRef.current!;
    // Mark the copy ready once its fonts have settled. The background enters
    // through its slit masks; the copy itself is not masked.
    void document.fonts.ready.then(() => {
      if (!disposed) copy.dataset.copyReady = 'true';
    });
    const scroll = mountHeroScroll({ stage, field: fieldRef.current!, content: copy });
    track.dataset.enhanced = 'true';
    return () => {
      disposed = true;
      scroll.destroy();
      delete track.dataset.enhanced;
    };
  }, []);

  return <section ref={trackRef} className={`theme-dark ${menuHero.hero}`} data-variant='menu' data-section='hero' aria-labelledby='hero-heading'>
    <div ref={stageRef} className={menuHero.stage} data-hero-stage data-theme='dark' data-header-light-at='0.6'>
      <div ref={fieldRef} className={`${styles.field} ${menuHero.field}`} aria-hidden='true' data-menu-hero-field><MenuHeroBackdrop /></div>
      <div ref={contentRef} className={`${styles.content} ${stars.content} ${menuHero.maskedCopy}`} data-hero-copy>
        <div className={stars.group}>
          <a href="#company-story" className={menuHero.announcement}>SaaS Labs is now AtomsAI <span aria-hidden="true">↗</span></a>
          <h1 id='hero-heading' tabIndex={-1} className={`display ${stars.title}`}>AI that works today.<br/>Built to get better tomorrow.</h1>
          <p className={stars.lead}>At AtomsAI, models power products. Products inform better technology. And solving new business problems gives both more to build on. Together, they make possible what no single product could.</p>
          <ButtonLink href='/company/contact' variant='primary' size='large'>Talk to AtomsAI</ButtonLink>
        </div>
      </div>
    </div>
    <div className={`theme-light ${menuHero.sectionReveal}`} data-hero-reveal data-theme="light">
      <div className={`${styles.nextContent} ${stars.nextContent} ${menuHero.nextContent}`}>{children}</div>
    </div>
  </section>;
}
