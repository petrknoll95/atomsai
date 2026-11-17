'use client';

import { assetPath } from '@/lib/base-path';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './integrations.module.css';

const tools = ['notion', 'microsoft_teams', 'hubspot', 'googledrive', 'shopify', 'jira', 'asana', 'zendesk', 'github', 'airtable', 'slack', 'salesforce', 'intercom'];
const rings = [16, 22, 28, 34];
const initialPositions = [0, 4, 8, 12, 17, 24, 32, 40, 51, 62];
type Mark = { tool: string; position: number; duration?: number; delay?: number };
const initialMarks: Mark[] = tools.slice(0, 10).map((tool, index) => ({ tool, position: initialPositions[index] }));

// Choose currently visible circles, so small screens do not swap logos offstage.
function visiblePositions(root: HTMLDivElement) {
  const bounds = root.getBoundingClientRect();
  return Array.from(root.querySelectorAll<HTMLElement>('[data-orbit-slot]')).filter(slot => {
    const box = slot.getBoundingClientRect();
    return box.left >= bounds.left && box.right <= bounds.right
      && box.top >= bounds.top + 24 && box.bottom <= bounds.bottom - 24;
  }).map(slot => Number(slot.dataset.orbitSlot));
}

export function IntegrationsGrid() {
  const grid = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState(initialMarks);

  useEffect(() => {
    const root = grid.current;
    if (!root) return;
    const mobile = matchMedia('(max-width: 767px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    // Orbits move their slots with upright translations rather than rotating whole rings:
    // Chrome rasterises large rotating layers at reduced resolution, which blurred the logos
    // and the 1px circles. Each ring keeps its own clock and only advances while running.
    const orbits = Array.from(root.querySelectorAll<HTMLElement>('[data-orbit]')).map(orbit => {
      const ring = Number(orbit.dataset.orbit), count = rings[ring];
      return {
        orbit, ring, radius: 0, speed: (ring % 2 ? -1 : 1) * Math.PI * 2 / ((480 + ring * 90) * 1000),
        slots: Array.from(orbit.querySelectorAll<HTMLElement>('[data-orbit-slot]')).map((slot, index) => ({ slot, angle: (index / count * 360 - 90) * Math.PI / 180 })),
      };
    });
    let elapsed = 0, last = 0, tick = 0;
    const place = () => {
      const pixel = 1 / devicePixelRatio;
      for (const { radius, speed, slots } of orbits) for (const { slot, angle } of slots) {
        const turn = angle + elapsed * speed;
        const dx = Math.round(radius * (Math.cos(turn) - Math.cos(angle)) / pixel) * pixel;
        const dy = Math.round(radius * (Math.sin(turn) - Math.sin(angle)) / pixel) * pixel;
        slot.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
      }
    };
    const measure = () => { for (const item of orbits) item.radius = item.orbit.offsetWidth / 2; place(); };
    const loop = (now: number) => {
      if (last) elapsed += Math.min(now - last, 100);
      last = now;
      place();
      tick = requestAnimationFrame(loop);
    };
    const update = () => {
      const running = visible && !document.hidden && !reduced.matches;
      root.dataset.running = String(running);
      cancelAnimationFrame(tick);
      last = 0;
      if (running) tick = requestAnimationFrame(loop);
    };
    const layout = () => {
      measure();
      const positions = visiblePositions(root);
      const count = Math.min(mobile.matches ? 7 : 10, positions.length);
      const preferred = Array.from({ length: count }, (_, index) => positions[Math.floor(index * positions.length / count)]);
      setMarks(tools.slice(0, count).map((tool, index) => {
        const duration = 3600 + Math.random() * 2400;
        return {
          tool, position: preferred[index], duration,
          // Spread the clocks across their lifetimes from the first frame.
          // Several logos can arrive and depart together without pulsing in sync.
          delay: -(index / count) * duration,
        };
      }));
      update();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(root);
    let frame = requestAnimationFrame(layout);
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    });
    resize.observe(root);
    mobile.addEventListener('change', layout);
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(tick);
      observer.disconnect();
      resize.disconnect();
      mobile.removeEventListener('change', layout);
      reduced.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const relocate = useCallback((tool: string) => {
    const available = grid.current ? visiblePositions(grid.current) : [];
    const positionChoice = Math.random();
    const toolChoice = Math.random();
    const duration = 3600 + Math.random() * 2400;
    const delay = 60 + Math.random() * 240;
    setMarks(current => {
      if (!current.some(mark => mark.tool === tool)) return current;
      const positions = available.filter(position => !current.some(mark => mark.position === position));
      const unusedTools = tools.filter(candidate => !current.some(mark => mark.tool === candidate));
      // Relocate only once the outgoing logo is fully transparent. Each logo
      // has its own lifetime, so fades overlap without sharing cells or marks.
      return current.map(mark => mark.tool === tool ? {
        tool: unusedTools[Math.floor(toolChoice * unusedTools.length)] ?? mark.tool,
        position: positions[Math.floor(positionChoice * positions.length)] ?? mark.position,
        duration, delay,
      } : mark);
    });
  }, []);

  return <div ref={grid} className={styles.grid} aria-hidden="true" data-integration-orbits>
    {rings.map((count, ring) => {
      const start = rings.slice(0, ring).reduce((total, size) => total + size, 0);
      return <div className={styles.orbit} key={ring} data-orbit={ring} style={{ '--ring': ring } as CSSProperties}>
        {Array.from({ length: count }, (_, slot) => {
          const index = start + slot;
          const angle = (slot / count * 360 - 90) * Math.PI / 180;
          const mark = marks.find(mark => mark.position === index);
          return <div className={styles.slot} key={index} data-orbit-slot={index} style={{
            left: `${Number((50 + Math.cos(angle) * 50).toFixed(4))}%`, top: `${Number((50 + Math.sin(angle) * 50).toFixed(4))}%`,
          }}>
            <div className={styles.tile}>
              {mark && <img key={mark.tool} onAnimationEnd={() => relocate(mark.tool)} style={{ animationDuration: `${mark.duration ?? 4800}ms`, animationDelay: `${mark.delay ?? 0}ms` }} src={assetPath(`/assets/integrations/${mark.tool}.svg`)} alt="" width="48" height="48" loading="lazy" decoding="async" draggable="false" />}
            </div>
          </div>;
        })}
      </div>;
    })}
  </div>;
}
