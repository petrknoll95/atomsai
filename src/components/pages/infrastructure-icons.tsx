import type { ReactNode } from 'react';

/* Line icons and illustrations from the client prototype's Infrastructure page.
   Strokes use currentColor; parts marked data-accent take --icon-accent. */

const icons = {
  followUp: <><path d="M4 5h12v9H9l-4 4V5z" /><path data-accent d="M14 10h6v7h-2v3l-3-3h-1" /><path d="M8 9.5h4" /></>,
  correct: <><path d="M4 18h16M5 14h10" /><path data-accent d="M14 4l4 4-8 8H6v-4z" /></>,
  interrupt: <><path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7.5c0 3.5-2.5 6-6 6-2.5 0-4-1-5.5-3.5L5 13.5" /><path data-accent d="M3 4l3 3M6 4L3 7" /></>,
  telephony: <><path d="M5 4H9L11 9L8.5 10.5C9.6 12.9 11.1 14.4 13.5 15.5L15 13L20 15V19C20 19.6 19.6 20 19 20C11 20 4 13 4 5C4 4.4 4.4 4 5 4Z" /><path data-accent d="M15 5a4 4 0 0 1 4 4M15 2a7 7 0 0 1 7 7" /></>,
  hear: <><path d="M3 12h2l2-5 3 10 3-8 2 5 2-2h4" /><path data-accent d="M19 8v8" /></>,
  omni: <><circle cx="12" cy="12" r="8" /><circle data-accent cx="12" cy="12" r="3" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4" /></>,
  speak: <><path d="M4 9v6h4l5 4V5L8 9z" /><path data-accent d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
  recap: <><path d="M5 4h11l3 3v13H5z" /><path d="M8 10h8M8 13h8M8 16h5" /><path data-accent d="M16 4v3h3" /></>,
  trace: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path data-accent d="M8.5 12l2.5 2.5 4.5-5" /></>,
  phoneAudio: <><path d="M3 12h2l2-5 3 10 3-8 2 5 2-2h4" /><path data-accent d="M15 4v16" strokeDasharray="2 2" /></>,
  turnTaking: <><path d="M3 6h10v7H7l-3 3V6z" /><path data-accent d="M11 11h10v7h-2v3l-3-3h-5z" /></>,
  oneSystem: <><rect x="3" y="4" width="18" height="16" rx="1" /><path data-accent d="M7 9h4v6H7zM13 9h4v6h-4z" /><path d="M11 12h2" /></>,
  servers: <><path d="M4 20V9l8-5 8 5v11z" /><path data-accent d="M9 20v-6h6v6" /></>,
  keys: <><rect x="6" y="11" width="12" height="9" /><path d="M9 11V8a3 3 0 0 1 6 0v3" /><circle data-accent cx="12" cy="15.5" r="1.3" /></>,
  recording: <><rect x="3" y="9" width="18" height="6" rx="3" /><circle data-fill cx="8" cy="12" r="2" /><path data-accent d="M14 12h4" /></>,
  evidence: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path data-accent d="M9 10.5h6M9 13.5h6M10.5 8.5v7M13.5 8.5v7" /></>,
} satisfies Record<string, ReactNode>;

export type LineIconName = keyof typeof icons;

export function LineIcon({ name, className }: { name: LineIconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">{icons[name]}</svg>;
}

const art = {
  applications: <><path d="M30 44h70v32H30zM38 54h30M38 62h46M38 70h22" /><path d="M120 30h70v60h-70zM128 42h54M128 52h40M128 62h54M128 72h30" /><circle data-node cx="92" cy="52" r="2.2" /><path data-accent d="M100 60h20M114 54l6 6-6 6" /></>,
  api: <><path d="M30 20c-10 0-14 6-14 16v12c0 6-4 10-10 12 6 2 10 6 10 12v12c0 10 4 16 14 16M90 20c10 0 14 6 14 16v12c0 6 4 10 10 12-6 2-10 6-10 12v12c0 10-4 16-14 16" /><path data-accent d="M44 60h32M70 52l8 8-8 8" /><path d="M130 44h70v32h-70zM138 54h30M138 62h46M138 70h22" /><circle data-node cx="192" cy="52" r="2.2" /></>,
  services: <><path d="M60 50l50-20 50 20-50 20zM60 50v12l50 20 50-20V50M60 74v12l50 20 50-20V74" /><path data-accent d="M150 10l30 12-30 12-30-12z" /><path data-accent d="M120 22v18l10 4M180 22v18l-10 4" strokeDasharray="2 4" /><circle data-node cx="110" cy="70" r="2.5" /></>,
} satisfies Record<string, ReactNode>;

export type LineArtName = keyof typeof art;

export function LineArt({ name, className }: { name: LineArtName; className?: string }) {
  return <svg className={className} viewBox="0 0 220 120" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">{art[name]}</svg>;
}
