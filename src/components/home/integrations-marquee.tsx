'use client';

import { useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import styles from './integrations-marquee.module.css';
import { Eyebrow } from '@/components/ui';

const tools = [
  ['notion', 'Notion'], ['microsoft_teams', 'Microsoft Teams'], ['hubspot', 'HubSpot'],
  ['googledrive', 'Google Drive'], ['slack', 'Slack'], ['salesforce', 'Salesforce'],
  ['jira', 'Jira'], ['asana', 'Asana'], ['zendesk', 'Zendesk'], ['github', 'GitHub'],
  ['airtable', 'Airtable'], ['intercom', 'Intercom'], ['gmail', 'Gmail'],
  ['dropbox', 'Dropbox'], ['zoom', 'Zoom'], ['shopify', 'Shopify'],
];

export function IntegrationsMarquee() {
  const panel = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [viewport, carousel] = useEmblaCarousel({ loop: true, dragFree: true, align: 'start' }, [
    AutoScroll({ speed: .65, startDelay: 300, playOnInit: false, stopOnInteraction: true, stopOnFocusIn: false }),
  ]);

  useEffect(() => {
    const root = panel.current;
    const motion = carousel?.plugins().autoScroll;
    if (!root || !carousel || !motion) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const gallery = carousel.rootNode();
    let visible = false;
    let hovered = gallery.matches(':hover');
    let focused = gallery.contains(document.activeElement);
    let pressed = false;
    const update = () => {
      if (visible && !paused && !hovered && !focused && !pressed && !reduced.matches && !document.hidden) motion.play();
      else motion.stop();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .15 });
    observer.observe(root);
    const enter = (event: PointerEvent) => { if (event.pointerType === 'mouse') { hovered = true; update(); } };
    const leave = () => { hovered = false; update(); };
    const focus = () => { focused = gallery.contains(document.activeElement); update(); };
    const blur = (event: FocusEvent) => { focused = gallery.contains(event.relatedTarget as Node); update(); };
    const press = () => { pressed = true; update(); };
    const release = () => { pressed = false; update(); };
    gallery.addEventListener('pointerenter', enter);
    gallery.addEventListener('pointerleave', leave);
    root.addEventListener('focusin', focus);
    root.addEventListener('focusout', blur);
    window.addEventListener('pointercancel', release);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    carousel.on('pointerDown', press).on('pointerUp', release).on('reInit', update);
    return () => {
      motion.stop();
      observer.disconnect();
      gallery.removeEventListener('pointerenter', enter);
      gallery.removeEventListener('pointerleave', leave);
      root.removeEventListener('focusin', focus);
      root.removeEventListener('focusout', blur);
      window.removeEventListener('pointercancel', release);
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
      carousel.off('pointerDown', press).off('pointerUp', release).off('reInit', update);
    };
  }, [carousel, paused]);

  return <section id="integrations" className={`page-container ${styles.section}`} aria-labelledby="integrations-title">
    <div ref={panel} className={styles.panel} data-theme="dark">
      <div className={styles.copy}>
        <Eyebrow href="/company/contact">Integrations</Eyebrow>
        <h2 id="integrations-title" className={`display ${styles.title}`}>It connects to what you already run.</h2>
        <p>Bring AI to your CRM, productivity and communication tools.<br /> Keep your systems. Connect the work.</p>
      </div>
      <div ref={viewport} className={styles.viewport} role="group" aria-roledescription="carousel" aria-label="Integrations" data-integration-marquee>
        <div className={styles.track}>
          {tools.map(([slug, name]) => <div className={styles.slide} key={slug}>
            <div className={styles.tile} title={name}>
              <img src={`/assets/integrations/${slug}.svg`} alt={name} width="44" height="44" decoding="async" draggable="false" />
            </div>
          </div>)}
        </div>
      </div>
      <button className={styles.pause} type="button" aria-label={paused ? 'Play integrations marquee' : 'Pause integrations marquee'} aria-pressed={paused} onClick={() => setPaused(!paused)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{paused ? <path d="m9 6 9 6-9 6Z" fill="currentColor" stroke="none" /> : <path d="M9 6v12M15 6v12" />}</svg>
      </button>
    </div>
  </section>;
}
