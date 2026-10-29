'use client';

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { scrollToTarget } from '@/lib/page-scroll';
import dynamic from 'next/dynamic';
import styles from './fullscreen-menu.module.css';

const MotionPattern = dynamic(() => import('@/components/patterns/motion-pattern').then(module => module.MotionPattern), { ssr: false });

type MenuLink = { label: string; href: string; overviewLabel?: string; children?: readonly (readonly string[])[] };

type HoverIntent = (event: PointerEvent<HTMLLIElement>, link: MenuLink, activate: () => void) => void;

function MenuGroup({ link, expanded, onSelect, onHover }: { link: MenuLink; expanded: boolean; onSelect: (label: string | null) => void; onHover: HoverIntent }) {
  const id = useId();
  const slotRef = useRef<HTMLDivElement>(null);
  const openedByHover = useRef(false);
  const children = link.children;
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const items = slot.querySelectorAll('li');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      gsap.killTweensOf([slot, ...items]);
      gsap.to(slot, { autoAlpha: expanded ? 1 : 0,
        duration: motion.matches ? 0 : .3, ease: 'power2.inOut', overwrite: true });
      gsap.to(items, { opacity: expanded ? 1 : 0, y: expanded ? 0 : 6,
        duration: motion.matches ? 0 : expanded ? .35 : .18,
        delay: motion.matches || !expanded ? 0 : .1,
        stagger: motion.matches || !expanded ? 0 : .035, ease: 'power2.out', overwrite: true });
    };
    update();
    motion.addEventListener('change', update);
    return () => { motion.removeEventListener('change', update); gsap.killTweensOf([slot, ...items]); };
  }, [expanded]);

  const hover = (event: PointerEvent<HTMLLIElement>) => {
    if (event.pointerType === 'touch' || !matchMedia('(hover: hover)').matches) return;
    onHover(event, link, () => {
      if (children && !expanded) openedByHover.current = true;
      onSelect(link.label);
    });
  };
  return <li className={styles.menuGroup} data-menu-group={link.label} data-expanded={expanded} onPointerMove={hover}>
    {children ? <button className={`display ${styles.primaryLink}`} type="button" aria-expanded={expanded} aria-controls={id}
      onClick={event => {
        // A first mouse click confirms the group just opened by hover.
        const confirmHover = event.detail > 0 && openedByHover.current;
        openedByHover.current = false;
        onSelect(confirmHover || !expanded ? link.label : null);
      }}><span>{link.label}</span></button>
      : <a className={`display ${styles.primaryLink}`} href={link.href}><span>{link.label}</span></a>}
    {children && <div ref={slotRef} className={styles.submenu} data-menu-panel id={id} inert={!expanded} aria-hidden={!expanded}>
      <ul className={styles.subLinks}>
        {children.map(([label, href]) => <li key={label}><a className="link-underline" href={href}><span>{label}</span></a></li>)}
        {!children.some(([, href]) => href === link.href) && <li><a className={`link-underline ${styles.allLink}`} href={link.href}><span>{link.overviewLabel ?? `All ${link.label}`}</span></a></li>}
      </ul>
    </div>}
  </li>;
}

export function FullscreenMenu({ links, onOpen }: {
  links: readonly MenuLink[];
  onOpen: () => void;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestClose = useRef<(afterClose?: () => void) => void>(() => {});
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState(3);
  const [expanded, setExpanded] = useState<string | null>(null);

  const pointerOrigin = useRef<{ x: number; y: number } | null>(null);
  const previousPointer = useRef<{ x: number; y: number } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelHover = () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  const resetHover = () => {
    cancelHover();
    pointerOrigin.current = null;
    previousPointer.current = null;
  };
  const selectGroup = (label: string | null) => {
    resetHover();
    setExpanded(label);
  };
  const hoverGroup: HoverIntent = (event, link, activate) => {
    const point = { x: event.clientX, y: event.clientY };
    const previous = previousPointer.current;
    previousPointer.current = point;
    cancelHover();
    if ((event.target as HTMLElement).closest('[data-menu-panel]')) {
      pointerOrigin.current = null;
      return;
    }
    if (expanded === link.label) {
      pointerOrigin.current = point;
      return;
    }
    const panel = contentRef.current?.querySelector<HTMLElement>('[data-expanded="true"] [data-menu-panel]');
    const bounds = panel?.getBoundingClientRect();
    const origin = pointerOrigin.current;
    // Protect the triangle from the last point on the active row to the
    // submenu's near corners. Only rightward travel earns this grace period.
    // No hit-area overlay: every link stays directly clickable.
    if (origin && previous && bounds && bounds.left > origin.x && point.x > previous.x && point.x < bounds.left) {
      const progress = (point.x - origin.x) / (bounds.left - origin.x);
      const top = origin.y + (bounds.top - 20 - origin.y) * progress;
      const bottom = origin.y + (bounds.bottom + 20 - origin.y) * progress;
      if (progress >= 0 && point.y >= top - 8 && point.y <= bottom + 8) {
        hoverTimer.current = setTimeout(() => {
          activate();
          pointerOrigin.current = point;
        }, 350);
        return;
      }
    }
    activate();
    pointerOrigin.current = point;
    previousPointer.current = point;
  };

  useLayoutEffect(() => {
    return () => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
      pointerOrigin.current = null;
      previousPointer.current = null;
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const narrow = window.matchMedia('(max-width: 767px)');
    const update = () => setColumns(narrow.matches ? 2 : 3);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  }, [open]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const body = document.body;
    const smoother = ScrollSmoother.get();
    const scroll = { x: window.scrollX, y: smoother?.scrollTop() ?? window.scrollY };
    smoother?.paused(true);
    const previous = {
      overflow: root.style.overflow, position: body.style.position,
      top: body.style.top, left: body.style.left, width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    if (scrollbarWidth) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth}px`;
    root.style.overflow = 'hidden';
    if (!smoother) Object.assign(body.style, { position: 'fixed', top: `${-scroll.y}px`, left: `${-scroll.x}px`, width: '100%' });
    let locked = true;
    let closing = false;
    let finished = false;
    let afterClose: (() => void) | undefined;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      root.style.overflow = previous.overflow;
      Object.assign(body.style, {
        position: previous.position, top: previous.top, left: previous.left,
        width: previous.width, paddingRight: previous.paddingRight,
      });
      if (ScrollSmoother.get() === smoother && smoother) smoother.paused(false);
      else window.scrollTo({ left: scroll.x, top: scroll.y, behavior: 'instant' });
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      unlock();
      dialog.close();
      setOpen(false);
      if (afterClose) afterClose();
      else triggerRef.current?.focus({ preventScroll: true });
    };

    // Keep the real header above the overlay, with its exact scroll position.
    const header = triggerRef.current?.closest('header');
    if (!header) return;
    header.dataset.siteMenuOpen = 'true';
    const nav = header.querySelector<HTMLElement>('nav');
    if (nav) nav.inert = true;
    const inertElements: { element: HTMLElement; previous: boolean }[] = [];
    let branch: HTMLElement = header;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          inertElements.push({ element: sibling, previous: sibling.inert });
          sibling.inert = true;
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); requestClose.current(); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(header.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
        .filter(el => !el.closest('[inert]') && el.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      const next = event.shiftKey && document.activeElement === first ? last
        : !event.shiftKey && document.activeElement === last ? first : null;
      if (next) { event.preventDefault(); next.focus(); }
    };
    document.addEventListener('keydown', onKey);
    dialog.show();
    dialog.scrollTop = 0;
    triggerRef.current?.focus({ preventScroll: true });
    const context = gsap.context(() => {
      const reveal = gsap.timeline({ paused: true,
        onComplete: () => { dialog.dataset.menuState = 'open'; },
        onReverseComplete: finish,
      })
        // All slit masks open together from their own centers, like the story portraits.
        .fromTo(dialog, { '--menu-reveal': '0%' }, { '--menu-reveal': '50%', duration: 0.8, ease: 'power3.inOut' }, 0)
        .fromTo(contentRef.current, { y: 12 }, { y: 0, duration: 0.8, ease: 'power3.out' }, 0);
      const update = () => {
        dialog.dataset.menuState = closing ? 'closing' : 'opening';
        if (motion.matches) {
          if (closing) finish();
          else { reveal.progress(1).pause(); dialog.dataset.menuState = 'open'; }
        } else if (closing) {
          if (reveal.progress() === 0) finish();
          else reveal.timeScale(1.35).reverse();
        } else reveal.timeScale(1).play();
      };
      requestClose.current = callback => {
        if (closing) return;
        afterClose = callback;
        closing = true;
        update();
      };
      motion.addEventListener('change', update);
      update();
      return () => motion.removeEventListener('change', update);
    }, dialog);

    return () => {
      context.revert();
      delete header.dataset.siteMenuOpen;
      if (nav) nav.inert = false;
      inertElements.forEach(({ element, previous }) => { element.inert = previous; });
      document.removeEventListener('keydown', onKey);
      requestClose.current = () => {};
      unlock();
      if (dialog.open) dialog.close();
      delete dialog.dataset.menuState;
    };
  }, [open]);

  const navigate = (event: MouseEvent<HTMLDialogElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (event.defaultPrevented || !link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute('href') ?? '';
    const target = href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
    if (!target) { requestClose.current(); return; }
    event.preventDefault();
    requestClose.current(() => {
      window.history.pushState(null, '', href);
      const heading = target.querySelector<HTMLElement>('h1, h2') ?? target;
      const previousTabIndex = heading.getAttribute('tabindex');
      heading.setAttribute('tabindex', '-1');
      heading.addEventListener('blur', () => {
        if (previousTabIndex === null) heading.removeAttribute('tabindex');
        else heading.setAttribute('tabindex', previousTabIndex);
      }, { once: true });
      heading.focus({ preventScroll: true });
      scrollToTarget(target);
    });
  };

  return <>
    <button ref={triggerRef} type="button" className={styles.trigger} data-menu="site"
      aria-label={open ? "Close site menu" : "Open site menu"} aria-haspopup="dialog" aria-expanded={open} aria-controls={id}
      onClick={() => { if (open) { requestClose.current(); return; } onOpen(); setExpanded(links.find(link => link.children)?.label ?? null); setOpen(true); }}>
      {open ? <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> : <span className={styles.menuIcon} aria-hidden="true" />}
    </button>
    <dialog data-feedback-screen="site-menu" ref={dialogRef} id={id} className={`theme-dark ${styles.dialog}`} aria-label="Site menu"
      style={{ '--menu-columns': columns, '--menu-pattern-count': columns + 2 } as CSSProperties}
      onCancel={event => { event.preventDefault(); requestClose.current(); }}
      onClose={event => { if (!event.currentTarget.open) setOpen(false); }} onClick={navigate}>
      {open && <div className={styles.patternBackdrop} aria-hidden="true" data-menu-pattern>
        <div className={styles.patternField}>
          <MotionPattern kind="drift" count={columns + 2} mode="dark" fit="stretch" motion="tide" duration={12} intensity={0.7} resolution="display" />
        </div>
      </div>}
      <div ref={contentRef} className={`page-container ${styles.content}`}>
        <nav aria-label="Site menu" className={styles.navigation}
          onPointerLeave={resetHover} onPointerDownCapture={resetHover} onKeyDownCapture={resetHover}
          onPointerMoveCapture={event => {
            if (!(event.target as HTMLElement).closest('[data-menu-group]')) cancelHover();
          }}>
          <ul className={styles.primaryLinks}>
            {links.map(link => <MenuGroup key={link.label} link={link} expanded={open && expanded === link.label} onSelect={selectGroup} onHover={hoverGroup} />)}
          </ul>
        </nav>
        <nav aria-label="Legal" className={styles.legal}>
          <a href="https://atomsai.com/legal/terms"><span className="link-underline">Terms of Service</span></a>
          <a href="https://atomsai.com/legal/privacy"><span className="link-underline">Privacy Policy</span></a>
        </nav>
      </div>
    </dialog>
  </>;
}
