'use client';

import { withBasePath } from '@/lib/base-path';

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { scrollToTarget } from '@/lib/page-scroll';
import type { MenuLink } from './navigation-data';
import styles from './responsive-menu.module.css';

type Props = {
  links: readonly MenuLink[];
  items: readonly { label: string; content: ReactNode }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
};

/** The real header and this attached panel form one modal navigation surface. */
export function ResponsiveMenu({ links, items, open, onOpenChange, onOpen }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const header = triggerRef.current?.closest('header');
    const panel = panelRef.current;
    if (!header || !panel) return;
    header.dataset.theme = 'light';
    panel.scrollTop = 0;
    const root = document.documentElement;
    const body = document.body;
    const smoother = ScrollSmoother.get();
    const wasPaused = smoother?.paused();
    const scroll = { x: window.scrollX, y: smoother?.scrollTop() ?? window.scrollY };
    const previous = { overflow: root.style.overflow, position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width };
    smoother?.paused(true);
    root.style.overflow = 'hidden';
    if (!smoother) Object.assign(body.style, { position: 'fixed', top: `${-scroll.y}px`, left: `${-scroll.x}px`, width: '100%' });

    // Keep the page out of the focus order and accessibility tree while the
    // header's dialog is open. Preserve any pre-existing inert state.
    const inert: { element: HTMLElement; previous: boolean }[] = [];
    let branch: HTMLElement = header;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          inert.push({ element: sibling, previous: sibling.inert });
          sibling.inert = true;
        }
      }
      if (branch.parentElement === body) break;
      branch = branch.parentElement;
    }
    triggerRef.current?.focus({ preventScroll: true });
    const close = () => { onOpenChange(false); triggerRef.current?.focus({ preventScroll: true }); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...header.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary')]
        .filter(element => !element.closest('[inert], [hidden]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
      if (!controls.length) return;
      // Explicit traversal also contains focus in Safari when its default Tab
      // preference skips links and buttons (Option-Tab still works normally).
      const current = controls.indexOf(document.activeElement as HTMLElement);
      const next = current < 0 ? 0 : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      event.preventDefault();
      controls[next].focus();
    };
    const navigate = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const url = new URL(link.href, location.href);
      let target: HTMLElement | null = null;
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
        try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* Malformed hashes keep native navigation. */ }
      }
      // Unlock synchronously before native navigation or scrolling to an anchor.
      if (target) event.preventDefault();
      flushSync(() => onOpenChange(false));
      if (target) {
        history.pushState(null, '', url.hash);
        const heading = target.querySelector<HTMLElement>('h1, h2') ?? target;
        const tabIndex = heading.getAttribute('tabindex');
        heading.setAttribute('tabindex', '-1');
        heading.addEventListener('blur', () => {
          if (tabIndex === null) heading.removeAttribute('tabindex');
          else heading.setAttribute('tabindex', tabIndex);
        }, { once: true });
        heading.focus({ preventScroll: true });
        scrollToTarget(target);
      }
    };
    const desktop = matchMedia('(min-width: 1200px)');
    const onBreakpoint = () => {
      if (!desktop.matches) return;
      flushSync(() => onOpenChange(false));
      // A browser may blur the mobile control as soon as its media rule hides
      // it. Restore a visible destination after the new layout is committed.
      requestAnimationFrame(() => header.querySelector<HTMLElement>('[data-menu="Applications"] > summary')?.focus({ preventScroll: true }));
    };
    document.addEventListener('keydown', onKey);
    header.addEventListener('click', navigate);
    desktop.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKey);
      header.removeEventListener('click', navigate);
      desktop.removeEventListener('change', onBreakpoint);
      inert.forEach(({ element, previous: value }) => { element.inert = value; });
      root.style.overflow = previous.overflow;
      Object.assign(body.style, { position: previous.position, top: previous.top, left: previous.left, width: previous.width });
      if (smoother && smoother === ScrollSmoother.get()) smoother.paused(wasPaused ?? false);
      else window.scrollTo({ left: scroll.x, top: scroll.y, behavior: 'instant' });
    };
  }, [open, onOpenChange]);

  useLayoutEffect(() => {
    if (!expanded) return;
    const panel = panelRef.current;
    const row = panel?.querySelector<HTMLElement>('[data-section-trigger][aria-expanded="true"]');
    if (!panel || !row) return;
    const top = row.getBoundingClientRect().top - panel.getBoundingClientRect().top;
    if (top < 0 || top > panel.clientHeight - 64) panel.scrollTop += top;
  }, [expanded]);

  return <>
    <button ref={triggerRef} className={styles.trigger} type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls={id} aria-haspopup="dialog" data-responsive-trigger
      onClick={() => { if (!open) { onOpen(); setExpanded(null); } onOpenChange(!open); }}>
      {open && <span>Close</span>}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d={open ? 'm4 4 10 10M14 4 4 14' : 'M4 5h10M4 9h10M4 13h10'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </button>
    <div ref={panelRef} id={id} className={`theme-light ${styles.panel}`} data-responsive-panel data-open={open} inert={!open} aria-hidden={!open}>
      <nav aria-label="Responsive navigation" className={styles.navigation}>
        <ul className={styles.sections}>
          {links.map((link, index) => {
            const active = expanded === link.label;
            const sectionId = `${id}-${index}`;
            return <li key={link.label} className={styles.section}>
              {link.children ? <>
                <button type="button" id={`${sectionId}-trigger`} className={styles.sectionTrigger} data-section-trigger aria-expanded={active} aria-controls={sectionId}
                  onClick={() => setExpanded(active ? null : link.label)}>
                  {link.label}<svg className={styles.chevron} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.5" /></svg>
                </button>
                <div id={sectionId} role="region" aria-labelledby={`${sectionId}-trigger`} hidden={!active} className={styles.sectionContent}>
                  {open && active && items.find(item => item.label === link.label)?.content}
                </div>
              </> : <a className={styles.sectionTrigger} href={withBasePath(link.href)}>{link.label}</a>}
            </li>;
          })}
        </ul>
        <div className={styles.footer}>
          <ButtonLink href="/company/contact" className={styles.contact}>Talk to AtomsAI<ArrowIcon size={18} /></ButtonLink>
          <div className={styles.legal}><a href={withBasePath("https://atomsai.com/legal/terms")}>Terms of Service</a><a href={withBasePath("https://atomsai.com/legal/privacy")}>Privacy Policy</a></div>
        </div>
      </nav>
    </div>
  </>;
}
