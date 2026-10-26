'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { scrollToTarget } from '@/lib/page-scroll';

export function SmoothScroll({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
    const previousScrollBehavior = {
      root: document.documentElement.style.scrollBehavior,
      body: document.body.style.scrollBehavior,
    };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let smoother: ScrollSmoother | undefined;
    let disposed = false;
    const configure = () => {
      const position = smoother?.scrollTop() ?? window.scrollY;
      smoother?.kill();
      smoother = undefined;
      delete document.documentElement.dataset.smoothScroll;
      if (!motion.matches && !document.querySelector('dialog[open]')) {
        document.documentElement.dataset.smoothScroll = 'true';
        smoother = ScrollSmoother.create({
          wrapper: wrapper.current!, content: content.current!,
          smooth: 0.8, smoothTouch: false, effects: false,
          onFocusIn: (_self, event) => {
            if (!(event.target instanceof Element) || !content.current?.contains(event.target) || event.target.closest('dialog')) return false;
            // Section-link handlers own heading scrolling; avoid an immediate
            // focus jump before their animated navigation starts.
            if (event.target.matches('h1,h2,[tabindex="-1"]')) return false;
            const bounds = event.target.getBoundingClientRect();
            if (bounds.top < (innerWidth < 768 ? 96 : 112) || bounds.bottom > innerHeight) {
              scrollToTarget(event.target as HTMLElement, false);
            }
            return false;
          },
        });
        smoother.scrollTop(position);
        if (document.querySelector('dialog[open]')) smoother.paused(true);
      } else window.scrollTo({ top: position, behavior: 'instant' });
    };
    const syncDialogs = () => {
      const modalOpen = !!document.querySelector('dialog[open]');
      if (!modalOpen && !smoother && !motion.matches) configure();
      else smoother?.paused(modalOpen);
    };
    const dialogs = new MutationObserver(syncDialogs);
    document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
    const hashTarget = () => {
      try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
      catch { return null; }
    };
    const followHash = () => { const target = hashTarget(); if (target) scrollToTarget(target, false); };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!link || link.hasAttribute('download') || link.target) return;
      let target: HTMLElement | null;
      try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      history.pushState(null, '', link.hash);
      const heading = target.querySelector<HTMLElement>('h1,h2') ?? target;
      const previous = heading.getAttribute('tabindex');
      heading.setAttribute('tabindex', '-1');
      heading.addEventListener('blur', () => {
        if (previous === null) heading.removeAttribute('tabindex');
        else heading.setAttribute('tabindex', previous);
      }, { once: true });
      heading.focus({ preventScroll: true });
      scrollToTarget(target);
    };
    configure();
    void document.fonts.ready.then(() => {
      if (disposed) return;
      ScrollTrigger.refresh();
      followHash();
    });
    motion.addEventListener('change', configure);
    document.addEventListener('click', navigate);
    window.addEventListener('hashchange', followHash);
    return () => {
      disposed = true;
      dialogs.disconnect();
      motion.removeEventListener('change', configure);
      document.removeEventListener('click', navigate);
      window.removeEventListener('hashchange', followHash);
      smoother?.kill();
      delete document.documentElement.dataset.smoothScroll;
      document.documentElement.style.scrollBehavior = previousScrollBehavior.root;
      document.body.style.scrollBehavior = previousScrollBehavior.body;
    };
  }, []);

  return <div id="smooth-wrapper" ref={wrapper}><div id="smooth-content" ref={content}>{children}</div></div>;
}
