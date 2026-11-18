'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Observe the hero, not the decorative canvas: links remain fully interactive. */
export function useGlassPointer(host: RefObject<HTMLDivElement | null>, reduced: boolean) {
  const [light, setLight] = useState({ x: 0.5, y: 0.3, presence: 0 });
  useEffect(() => {
    const element = host.current;
    const stage = element?.closest<HTMLElement>('[data-hero-stage]');
    if (!element || !stage || reduced) return;
    const target = { x: 0.5, y: 0.3, presence: 0 };
    const current = { ...target };
    let frame = 0, last = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, last ? now - last : 16);
      last = now;
      const follow = 1 - Math.exp(-dt / 150);
      const fade = 1 - Math.exp(-dt / (target.presence ? 240 : 650));
      current.x += (target.x - current.x) * follow;
      current.y += (target.y - current.y) * follow;
      current.presence += (target.presence - current.presence) * fade;
      setLight({ ...current });
      const moving = Math.abs(current.x - target.x) + Math.abs(current.y - target.y) + Math.abs(current.presence - target.presence) > 0.001;
      frame = moving ? requestAnimationFrame(tick) : 0;
      if (!moving) last = 0;
    };
    const wake = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const rect = element.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = (event.clientY - rect.top) / rect.height;
      target.presence = 1;
      wake();
    };
    const leave = () => { target.presence = 0; wake(); };
    const hide = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0; last = 0;
        current.presence = 0; target.presence = 0;
      } else wake();
    };
    // Reset old hover state when motion is re-enabled or the renderer recovers.
    wake();
    stage.addEventListener('pointermove', move, { passive: true });
    stage.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [host, reduced]);
  return reduced ? { x: 0.5, y: 0.3, presence: 0 } : light;
}
