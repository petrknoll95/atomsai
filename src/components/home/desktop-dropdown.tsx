'use client';

import { useRef, type ReactNode } from 'react';
import { NavLinkMarker } from './nav-link-marker';

/** Triggers share one viewport, so switching never replaces its background. */
export function DesktopDropdown({ label, className, open, panelId, onToggle, onOpen, trigger }: {
  label: string;
  className: string;
  open: boolean;
  panelId: string;
  onToggle: () => void;
  onOpen: () => void;
  trigger: ReactNode;
}) {
  const openedByHover = useRef(false);
  return <details className={className} data-menu={label} data-expanded={open} open={open}
    onPointerEnter={event => {
      if (event.pointerType === 'touch') return;
      if (!open) { openedByHover.current = true; onOpen(); }
    }}
  >
    <summary
      aria-expanded={open}
      aria-controls={panelId}
      onKeyDown={event => {
        if (!open || event.shiftKey || event.ctrlKey || event.metaKey || (event.key !== 'Tab' && event.key !== 'ArrowDown')) return;
        const firstLink = document.getElementById(panelId)?.querySelector<HTMLAnchorElement>('a[href]');
        if (firstLink) { event.preventDefault(); firstLink.focus(); }
      }}
      onClick={event => {
        event.preventDefault();
        if (event.detail > 0 && open && openedByHover.current) { openedByHover.current = false; return; }
        openedByHover.current = false;
        onToggle();
      }}
    ><NavLinkMarker active={open}>{trigger}</NavLinkMarker></summary>
  </details>;
}
