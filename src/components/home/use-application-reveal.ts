'use client';

import { useLayoutEffect, type RefObject } from 'react';
import justCall from './justcall-scene.module.css';
import helpwise from './helpwise-scene.module.css';
import serviceAgent from './serviceagent-scene.module.css';
import callPage from './callpage-scene.module.css';

type Entrance = {
  selector: string;
  x?: number;
  y?: number;
  scale?: number;
  delay?: number;
  stagger?: number;
  duration?: number;
};
const part = (className: string) => `.${className}`;
const sequences: Entrance[][] = [
  [
    { selector: part(justCall.dashboard), y: 24, scale: .985, duration: 1100 },
    { selector: part(justCall.analytics), x: -28, y: 56, scale: .94, delay: 90 },
    { selector: part(justCall.conversation), x: 34, y: 72, scale: .96, delay: 210, duration: 1100 },
    { selector: part(justCall.metricValue), y: 16, delay: 340, duration: 700 },
    { selector: `${part(justCall.transcript)} > div`, x: 18, y: 12, delay: 420, stagger: 100, duration: 700 },
    { selector: part(justCall.callBar), y: 16, delay: 650, duration: 750 },
  ],
  [
    { selector: part(helpwise.system), x: 60, y: 24, scale: .985, duration: 1050 },
    { selector: part(helpwise.header), y: 10, delay: 100, duration: 700 },
    { selector: part(helpwise.sidebar), x: -16, delay: 120, duration: 750 },
    { selector: part(helpwise.inbox), x: 46, delay: 180 },
    { selector: part(helpwise.message), x: 26, y: 8, delay: 340, stagger: 55, duration: 700 },
  ],
  [
    { selector: part(serviceAgent.card), y: 90, scale: .965, stagger: 130, duration: 1100 },
    { selector: part(serviceAgent.content), y: 12, delay: 220, stagger: 130, duration: 750 },
  ],
  [
    { selector: part(callPage.device), y: 65, scale: .94, duration: 1150 },
    { selector: part(callPage.system), y: 48, scale: .95, delay: 160 },
    { selector: part(callPage.tab), y: 10, delay: 300, stagger: 70, duration: 650 },
    { selector: part(callPage.heading), y: 14, delay: 360, duration: 750 },
    { selector: `${part(callPage.form)} > div`, y: 20, scale: .98, delay: 480, stagger: 90, duration: 800 },
  ],
];

/** Motion belongs to this workflow host; shared header figures remain unchanged. */
export function useApplicationReveal(root: RefObject<HTMLElement | null>, active: number) {
  useLayoutEffect(() => {
    const scene = root.current?.querySelector<HTMLElement>(`[data-application-scene="${active}"]`);
    if (!scene) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    let animations: Animation[] = [];
    const reset = () => {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations = [];
    };
    const reveal = () => {
      reset();
      if (reduced.matches) return;
      sequences[active].forEach(({ selector, x = 0, y = 0, scale = 1, delay = 0, stagger = 0, duration = 1000 }, group) => {
        scene.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
          // Individual transform properties preserve each figure's authored
          // centering transforms and its responsive coordinate system.
          const animation = element.animate([
            { opacity: 0, translate: `${x}px ${y}px`, scale },
            { opacity: 1, translate: '0px 0px', scale: 1 },
          ], { duration, delay: delay + index * stagger, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'both' });
          animation.id = `application-${active}-${group}-${index}`;
          animation.pause();
          animation.currentTime = 0;
          // Release compositor layers once settled; cancellation is expected
          // when changing tabs or switching system reduced-motion on.
          void animation.finished.then(() => animation.cancel()).catch(() => {});
          animations.push(animation);
        });
      });
      observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer?.disconnect();
        animations.forEach(animation => animation.play());
      }, { threshold: .15 });
      observer.observe(scene);
    };
    reveal();
    reduced.addEventListener('change', reveal);
    return () => { reset(); reduced.removeEventListener('change', reveal); };
  }, [root, active]);
}
