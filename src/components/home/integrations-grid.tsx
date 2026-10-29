'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './integrations.module.css';

const tools = ['notion', 'microsoft_teams', 'hubspot', 'googledrive', 'shopify', 'jira', 'asana', 'zendesk', 'github', 'airtable', 'slack', 'salesforce', 'intercom'];
const initialPositions = [3, 7, 12, 17, 21, 26, 35, 46, 49, 51, 56, 66, 70];
type Mark = { tool: string; position: number; duration?: number; delay?: number };
const initialMarks: Mark[] = tools.map((tool, index) => ({ tool, position: initialPositions[index] }));
const isCenter = (index: number) => (Math.floor(index / 12) === 2 || Math.floor(index / 12) === 3) && index % 12 >= 3 && index % 12 <= 8;
const availablePositions = (mobile: boolean) => Array.from({ length: 72 }, (_, index) => index).filter(index => mobile
  ? index < 36 && (index < 12 || index >= 24)
  : !isCenter(index));

export function IntegrationsGrid() {
  const grid = useRef<HTMLDivElement>(null);
  const compact = useRef(false);
  const [marks, setMarks] = useState(initialMarks);

  useEffect(() => {
    const root = grid.current;
    if (!root) return;
    const mobile = matchMedia('(max-width: 767px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => {
      // CSS pauses each independent clock without resetting its progress.
      root.dataset.running = String(visible && !document.hidden && !reduced.matches);
    };
    const layout = () => {
      compact.current = mobile.matches;
      const count = mobile.matches ? 7 : 10;
      const preferred = mobile.matches ? [1, 4, 6, 10, 25, 28, 34] : [3, 7, 12, 17, 26, 35, 46, 49, 56, 70];
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
    const frame = requestAnimationFrame(layout);
    mobile.addEventListener('change', layout);
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mobile.removeEventListener('change', layout);
      reduced.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const relocate = useCallback((tool: string) => {
    const positionChoice = Math.random();
    const toolChoice = Math.random();
    const duration = 3600 + Math.random() * 2400;
    const delay = 60 + Math.random() * 240;
    setMarks(current => {
      if (!current.some(mark => mark.tool === tool)) return current;
      const positions = availablePositions(compact.current).filter(position => !current.some(mark => mark.position === position));
      const unusedTools = tools.filter(candidate => !current.some(mark => mark.tool === candidate));
      // Relocate only once the outgoing logo is fully transparent. Each logo
      // has its own lifetime, so fades overlap without sharing cells or marks.
      return current.map(mark => mark.tool === tool ? {
        tool: unusedTools[Math.floor(toolChoice * unusedTools.length)],
        position: positions[Math.floor(positionChoice * positions.length)],
        duration, delay,
      } : mark);
    });
  }, []);

  return <div ref={grid} className={styles.grid} aria-hidden="true">
    {Array.from({ length: 72 }, (_, index) => {
      const mark = marks.find(mark => mark.position === index);
      return <div className={`${styles.tile} ${isCenter(index) ? styles.empty : ''}`} key={index}>
        {mark && <img key={mark.tool} onAnimationEnd={() => relocate(mark.tool)} style={{ animationDuration: `${mark.duration ?? 4800}ms`, animationDelay: `${mark.delay ?? 0}ms` }} src={`/assets/integrations/${mark.tool}.svg`} alt="" width="48" height="48" loading="lazy" decoding="async" draggable="false" />}
      </div>;
    })}
  </div>;
}
