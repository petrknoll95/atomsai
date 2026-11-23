'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Announcement, ButtonLink } from '@/components/ui';
import styles from '../prototype-hero/hero.module.css';
import stars from '../starfield-hero/hero.module.css';
import { MenuHeroBackdrop } from './backdrop';
import menuHero from './hero.module.css';
import { mountHeroScroll } from './transition';
import { mountHeroEntrance } from './entrance';

export function MenuPatternHero({ children, productFamily }: { children: ReactNode; productFamily: ReactNode }) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<ReturnType<typeof mountHeroEntrance> | null>(null);
  const availableRef = useRef<boolean | null>(null);
  const onAvailabilityChange = useCallback((available: boolean) => {
    availableRef.current = available;
    entranceRef.current?.availabilityChanged(available);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const entrance = mountHeroEntrance({ stage, copy: stage.querySelector<HTMLElement>('[data-hero-copy-entrance]')!, pattern: stage.querySelector<HTMLElement>('[data-hero-pattern-entrance]')!, available: availableRef.current });
    entranceRef.current = entrance;
    return () => { entrance.destroy(); entranceRef.current = null; };
  }, []);

  useEffect(() => {
    const track = trackRef.current!, stage = stageRef.current!;
    const copy = contentRef.current!;
    const scroll = mountHeroScroll({ stage, field: fieldRef.current!, content: copy });
    track.dataset.enhanced = 'true';
    return () => {
      scroll.destroy();
      delete track.dataset.enhanced;
    };
  }, []);

  return <section ref={trackRef} className={`theme-dark ${menuHero.hero}`} data-variant='menu' data-section='hero' aria-labelledby='hero-heading'>
    <div ref={stageRef} className={menuHero.stage} data-hero-stage data-hero-entry="pending" data-theme='dark' data-header-light-at='0.6'>
      <div ref={fieldRef} className={`${styles.field} ${menuHero.field}`} aria-hidden='true' data-menu-hero-field><MenuHeroBackdrop onAvailabilityChange={onAvailabilityChange} /></div>
      <div ref={contentRef} className={`${styles.content} ${stars.content} ${menuHero.maskedCopy}`} data-hero-copy>
        <div className={`${stars.group} ${menuHero.copyEntrance}`} data-hero-copy-entrance>
          <Announcement href="#company-story" className={menuHero.announcement}>SaaS Labs is now AtomsAI</Announcement>
          <h1 id='hero-heading' tabIndex={-1} className={`display ${stars.title}`} data-text-reveal='manual'>AI that works today.<br/>Built to get better tomorrow.</h1>
          <p className={`${stars.lead} ${menuHero.lead}`}>At AtomsAI, models power products. Products inform better technology. And solving new business problems gives both more to build on. Together, they make possible what no single product could.</p>
          <ButtonLink href='/company/contact' variant='primary' size='large'>Talk to AtomsAI</ButtonLink>
        </div>
      </div>
      <div className={`theme-light ${menuHero.productFooter}`} data-theme="light" data-hero-products>
        <div aria-hidden="true" className={`${menuHero.productFade} bg-ease-in-out-to-b from-transparent to-(--palette-paper)`} />
        <div className="page-container">{productFamily}</div>
      </div>
    </div>
    <div className={`theme-light ${menuHero.sectionReveal}`} data-hero-reveal data-theme="light">
      <div className={`${styles.nextContent} ${stars.nextContent} ${menuHero.nextContent}`}>{children}</div>
    </div>
  </section>;
}
