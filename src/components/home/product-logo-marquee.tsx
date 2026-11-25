'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './menu-hero/hero.module.css';

export function ProductLogoMarquee({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = viewport.current!;
    const mobile = matchMedia('(max-width: 767px)');
    let version = 0;
    let teardown: (() => void) | undefined;

    async function configure() {
      const current = ++version;
      teardown?.();
      teardown = undefined;
      if (!mobile.matches) return;
      const [{ default: Embla }, { default: AutoScroll }] = await Promise.all([
        import('embla-carousel'), import('embla-carousel-auto-scroll'),
      ]);
      if (current !== version) return;
      const motion = AutoScroll({
        speed: .6, startDelay: 350, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: true,
        breakpoints: { '(prefers-reduced-motion: reduce)': { active: false } },
      });
      node.scrollLeft = 0;
      node.dataset.enhanced = 'true';
      const carousel = Embla(node, { loop: true, align: 'start', dragFree: true }, [motion]);
      let visible = false;
      const updatePlayback = () => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (visible && !document.hidden && !node.contains(document.activeElement)) motion.play();
        else motion.stop();
      };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        updatePlayback();
      });
      observer.observe(node);
      carousel.on('reInit', updatePlayback);
      document.addEventListener('visibilitychange', updatePlayback);
      teardown = () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', updatePlayback);
        carousel.off('reInit', updatePlayback);
        carousel.destroy();
        delete node.dataset.enhanced;
      };
    }

    void configure();
    mobile.addEventListener('change', configure);
    return () => { version++; mobile.removeEventListener('change', configure); teardown?.(); };
  }, []);

  return <div ref={viewport} className={styles.logoViewport}><div className={styles.logoTrack}>{children}</div></div>;
}
