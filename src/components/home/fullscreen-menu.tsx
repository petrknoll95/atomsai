'use client';

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { scrollToTarget } from '@/lib/page-scroll';
import { ButtonLink } from '@/components/ui';
import styles from './fullscreen-menu.module.css';

type MenuLink = { label: string; href: string };
type ProductLink = { name: string; href: string; description: string };

export function FullscreenMenu({ links, products, onOpen }: {
  links: readonly MenuLink[];
  products: readonly ProductLink[];
  onOpen: () => void;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const requestClose = useRef<(afterClose?: () => void) => void>(() => {});
  const [open, setOpen] = useState(false);

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

    dialog.showModal();
    dialog.scrollTop = 0;
    closeRef.current?.focus({ preventScroll: true });
    const context = gsap.context(() => {
      const reveal = gsap.timeline({ paused: true,
        onComplete: () => { dialog.dataset.menuState = 'open'; },
        onReverseComplete: finish,
      })
        .fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' }, 0)
        .fromTo(contentRef.current, { y: 12 }, { y: 0, duration: 0.36, ease: 'power2.out' }, 0);
      const update = () => {
        dialog.dataset.menuState = closing ? 'closing' : 'opening';
        if (motion.matches) {
          if (closing) finish();
          else { reveal.progress(1).pause(); dialog.dataset.menuState = 'open'; }
        } else if (closing) {
          if (reveal.progress() === 0) finish();
          else reveal.timeScale(2).reverse();
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

  const keepFocusInside = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab' || event.metaKey || event.ctrlKey) return;
    // Native modality makes the page inert; wrap the boundaries explicitly so
    // Tab stays in the menu instead of moving into the browser's toolbar.
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      .filter(control => control.tabIndex >= 0 && control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    const destination = event.shiftKey && document.activeElement === first ? last
      : !event.shiftKey && document.activeElement === last ? first : null;
    if (destination) {
      event.preventDefault();
      destination.focus();
    }
  };

  return <>
    <button ref={triggerRef} type="button" className={styles.trigger} data-menu="site"
      aria-label="Open site menu" aria-haspopup="dialog" aria-expanded={open} aria-controls={id}
      onClick={() => { onOpen(); setOpen(true); }}>
      <img src="/assets/figma/hero-Vector1.svg" width="14" height="8" alt="" />
    </button>
    <dialog ref={dialogRef} id={id} className={styles.dialog} aria-label="Site menu"
      onCancel={event => { event.preventDefault(); requestClose.current(); }}
      onClose={event => { if (!event.currentTarget.open) setOpen(false); }} onClick={navigate} onKeyDown={keepFocusInside}>
      <div className={`page-container ${styles.topbar}`}>
        <Link href="/" aria-label="AtomsAI home" className={styles.logo} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          requestClose.current(() => {
            window.history.pushState(null, '', '/');
            document.getElementById('hero-heading')?.focus({ preventScroll: true });
            const smoother = ScrollSmoother.get();
            if (smoother) smoother.scrollTo(0, false);
            else window.scrollTo({ top: 0, behavior: 'instant' });
          });
        }}><img src="/assets/figma/hero-Logo.svg" width="136" height="24" alt="AtomsAI" /></Link>
        <button ref={closeRef} type="button" className={styles.close} aria-label="Close site menu" onClick={() => requestClose.current()}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div ref={contentRef} className={`page-container ${styles.content}`}>
        <nav aria-label="Site menu" className={styles.navigation}>
          <ul className={styles.primaryLinks}>
            {links.map(link => <li key={link.label}><a className={`display ${styles.primaryLink}`} href={link.href}><span>{link.label}</span><img src="/assets/figma/header-base-IconArtwork.svg" width="24" height="24" alt="" /></a></li>)}
          </ul>
          <div className={styles.supporting}>
            <div>
              <h2 className={styles.label}>Our applications</h2>
              <ul className={styles.productLinks}>{products.map(product => <li key={product.name}><a href={product.href}><span>{product.name}</span><span>{product.description}</span></a></li>)}</ul>
            </div>
            <ButtonLink href="https://atomsai.com/company/contact" size="large">Contact AtomsAI</ButtonLink>
          </div>
        </nav>
      </div>
    </dialog>
  </>;
}
