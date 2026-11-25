'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import poses from './trust-poses.json';
import styles from './trust-summary.module.css';

gsap.registerPlugin(MorphSVGPlugin);

type Topic = keyof typeof poses;
type MotionState =
  | { phase: 'settled'; topic: Topic }
  | { phase: 'morphing'; topic: Topic; tween: gsap.core.Tween };

export function TrustIllustration({ topic }: { topic: Topic }) {
  const path = useRef<SVGPathElement>(null);
  const state = useRef<MotionState>({ phase: 'settled', topic: 'integrations' });

  useLayoutEffect(() => {
    const node = path.current!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const pose = poses[topic];
    function settle() {
      node.setAttribute('d', pose.d);
      node.setAttribute('stroke-width', String(pose.strokeWidth));
      state.current = { phase: 'settled', topic };
    }
    function stop() {
      if (state.current.phase === 'morphing') state.current.tween.kill();
    }
    function onPreferenceChange() {
      if (motion.matches) {
        stop();
        settle();
      }
    }

    if (motion.matches) settle();
    else if (state.current.phase !== 'settled' || state.current.topic !== topic) {
      // On interruption, the previous tween leaves its current outline on the node.
      const tween = gsap.to(node, {
        morphSVG: { shape: pose.d, map: 'position', shapeIndex: 0 },
        attr: { 'stroke-width': pose.strokeWidth },
        duration: 0.65,
        ease: 'power2.inOut',
        onComplete: settle,
      });
      state.current = { phase: 'morphing', topic, tween };
    }
    motion.addEventListener('change', onPreferenceChange);
    return () => {
      stop();
      motion.removeEventListener('change', onPreferenceChange);
    };
  }, [topic]);

  return <svg className={styles.illustration} viewBox="0 0 300 200" aria-hidden="true" fill="none" stroke="currentColor">
    <path ref={path} d={poses.integrations.d} strokeWidth={poses.integrations.strokeWidth} />
  </svg>;
}
