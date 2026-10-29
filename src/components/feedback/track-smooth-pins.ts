import { gsap } from 'gsap';
import type { Comment } from 'pindrop.js';

// Native scroll events stop before ScrollSmoother's transform finishes settling.
// Run after GSAP renders, updating only pin coordinates (not entire threads).
export function trackSmoothPins(getComments: () => Comment[]) {
  const update = () => {
    if (!document.documentElement.hasAttribute('data-smooth-scroll') && !document.querySelector('dialog[open]')) return;
    const root = document.getElementById('pindrop-web-root');
    const pins = document.getElementById('pindrop-web-pins');
    if (!root || root.style.display === 'none' || !pins || pins.style.display === 'none') return;
    const comments = new Map(getComments().map(comment => [comment.id, comment]));
    const positions: { pin: HTMLElement; x: number; y: number }[] = [];
    for (const pin of pins.querySelectorAll<HTMLElement>('[data-comment-id]')) {
      // Leave the dragged pin under Pindrop's pointer control.
      if (pin.dataset.dragStarted) continue;
      const anchor = comments.get(pin.dataset.commentId!)?.anchor;
      if (!anchor) continue;
      let candidates: Element[];
      try { candidates = [...document.querySelectorAll(anchor.selector)]; }
      catch { continue; }
      const target = candidates.find(element => element.getClientRects().length > 0) ?? candidates[0];
      if (!target) continue; // Keep Pindrop's fallback for deleted anchors.
      const rect = target.getBoundingClientRect();
      positions.push({pin, x: rect.left + scrollX + rect.width * anchor.offsetX,
        y: rect.top + scrollY + rect.height * anchor.offsetY});
    }
    // Batch reads before writes to avoid repeated layout calculation.
    for (const {pin, x, y} of positions) {
      pin.style.setProperty('left', `${x}px`, 'important');
      pin.style.setProperty('top', `${y}px`, 'important');
    }
  };
  gsap.ticker.add(update);
  return () => gsap.ticker.remove(update);
}
