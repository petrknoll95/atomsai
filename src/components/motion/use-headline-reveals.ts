'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { headlineSelector, revealTextLines, textReveal } from './text-reveal';

/** Enhance server-rendered headlines once, without animating their containers. */
export function useHeadlineReveals(rootRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(SplitText);
    const headings = [...root.querySelectorAll<HTMLElement>(headlineSelector)]
      .filter(heading => !heading.closest('dialog, [aria-roledescription="carousel"], [data-text-reveal="off"]'));
    const played = new Set<HTMLElement>();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup = () => {};

    const configure = () => {
      cleanup();
      if (reduced.matches || !('IntersectionObserver' in window)) return;
      let disposed = false;
      let observer: IntersectionObserver | undefined;
      let resizeFrame = 0;
      const splits: SplitText[] = [];
      const animations = new Map<HTMLElement, gsap.core.Tween>();
      const originalOpacity = new Map(headings.map(heading => [heading, heading.style.opacity]));
      const originalWidth = new Map(headings.map(heading => [heading, heading.style.width]));
      const ready = new Set<HTMLElement>();
      const restoreOpacity = (heading: HTMLElement) => { heading.style.opacity = originalOpacity.get(heading) ?? ''; };
      const complete = (heading: HTMLElement) => {
        played.add(heading);
        heading.dataset.textRevealState = 'visible';
      };
      const show = (heading: HTMLElement, instantly = false) => {
        ready.add(heading);
        observer?.unobserve(heading);
        const animation = animations.get(heading);
        if (instantly) {
          complete(heading);
          restoreOpacity(heading);
          animation?.progress(1).pause();
        } else if (animation) {
          played.add(heading);
          heading.dataset.textRevealState = 'revealing';
          animation.play();
        }
      };
      headings.forEach(heading => {
        const bounds = heading.getBoundingClientRect();
        if (played.has(heading) || bounds.bottom <= 0) { complete(heading); return; }
        heading.dataset.textRevealState = 'pending';
        heading.style.opacity = '0';
        if (bounds.top < innerHeight * textReveal.viewportEntry && !heading.closest('[data-hero-reveal]')) ready.add(heading);
      });

      const revealTarget = (target: Element | null) => {
        if (!target || target === document.body) return;
        headings.filter(heading => heading === target || target.contains(heading))
          .forEach(heading => show(heading, true));
      };
      const focus = (event: FocusEvent) => { if (event.target instanceof Element) revealTarget(event.target); };
      const hash = () => {
        try { if (location.hash) revealTarget(document.getElementById(decodeURIComponent(location.hash.slice(1)))); }
        catch { /* Ignore invalid URL fragments. */ }
      };
      const observe = () => {
        observer?.disconnect();
        observer = new IntersectionObserver(entries => {
          entries.forEach(entry => { if (entry.isIntersecting) show(entry.target as HTMLElement); });
        }, { rootMargin: `0px 0px -${Math.round(innerHeight * (1 - textReveal.viewportEntry))}px 0px` });
        headings.forEach(heading => { if (!played.has(heading) && !ready.has(heading)) observer?.observe(heading); });
      };
      // Re-measure from the authored DOM before splitting at a new width. This
      // also preserves shrink-to-fit headings, whose intrinsic width would
      // otherwise change when their text is replaced with block line wrappers.
      const resize = () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(configure); };
      let rootWidth = root.getBoundingClientRect().width;
      const layoutObserver = new ResizeObserver(() => {
        const width = root.getBoundingClientRect().width;
        if (width !== rootWidth) { rootWidth = width; resize(); }
      });
      layoutObserver.observe(root);
      root.addEventListener('focusin', focus);
      window.addEventListener('hashchange', hash);
      window.addEventListener('resize', resize);
      hash();

      // Never leave text hidden because a font request stalled. Slow-font users
      // receive normal readable text; everyone else splits the loaded typeface.
      const timeout = window.setTimeout(() => {
        if (!disposed) headings.forEach(heading => show(heading, true));
      }, textReveal.fontWaitLimit);
      void document.fonts.ready.then(() => {
        if (disposed) return;
        clearTimeout(timeout);
        headings.forEach(heading => {
          restoreOpacity(heading);
          if (played.has(heading)) return;
          // Keep authored block spans (FAQ colors / CTA flex spacing) intact.
          const children = [...heading.children] as HTMLElement[];
          const targets = children.length && children.every(child => child.tagName === 'SPAN' && getComputedStyle(child).display !== 'inline')
            ? children : [heading];
          const headingWidth = heading.getBoundingClientRect().width;
          const widths = targets.map(target => target.getBoundingClientRect().width);
          heading.style.width = `${headingWidth}px`;
          targets.forEach((target, index) => {
            if (!originalWidth.has(target)) originalWidth.set(target, target.style.width);
            // Temporary word wrappers can round fractional glyph advances up.
            // Allow one pixel during measurement, then restore the exact box.
            target.style.width = `${widths[index] + 1}px`;
          });
          splits.push(SplitText.create(targets, {
            type: 'lines', linesClass: 'text-reveal-line', aria: 'none',
            onSplit(self) {
              self.lines.forEach(line => {
                // Keep a single inline formatting context: Safari otherwise
                // applies the heading's text-box trim to intermediate blocks.
                Object.assign((line as HTMLElement).style, {
                  whiteSpace: 'nowrap', display: 'inline-block', width: '100%', verticalAlign: 'top',
                });
              });
              targets.forEach((target, index) => { target.style.width = `${widths[index]}px`; });
              heading.style.width = `${headingWidth}px`;
              const animation = revealTextLines(self.lines, () => complete(heading));
              animations.set(heading, animation);
              if (played.has(heading)) animation.progress(1).pause();
              else if (ready.has(heading)) { played.add(heading); heading.dataset.textRevealState = 'revealing'; animation.play(); }
              return animation;
            },
          }));
        });
        observe();
      });
      cleanup = () => {
        disposed = true;
        clearTimeout(timeout);
        cancelAnimationFrame(resizeFrame);
        observer?.disconnect();
        layoutObserver.disconnect();
        splits.forEach(split => split.revert());
        animations.clear();
        originalWidth.forEach((width, target) => { target.style.width = width; });
        headings.forEach(heading => { restoreOpacity(heading); delete heading.dataset.textRevealState; });
        root.removeEventListener('focusin', focus);
        window.removeEventListener('hashchange', hash);
        window.removeEventListener('resize', resize);
      };
    };
    configure();
    reduced.addEventListener('change', configure);
    return () => { reduced.removeEventListener('change', configure); cleanup(); };
  }, [rootRef]);
}
