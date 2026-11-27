'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { assetPath } from '@/lib/base-path';
import { drawModel, poseFor, type TrustTopic } from './trust-model';
import styles from './trust-summary.module.css';

export function TrustIllustration({ topic }: { topic: TrustTopic }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef(poseFor('integrations'));
  const detail = useRef({ topic: 'integrations' as TrustTopic, deployment: 1 });
  const render = useRef(() => {});

  useLayoutEffect(() => {
    const node = canvas.current!;
    if (!node.getContext('2d')) return;
    const ink = getComputedStyle(node).color;
    render.current = () => drawModel(node, live.current, detail.current.topic, detail.current.deployment, ink);
    function resize() {
      const bounds = node.getBoundingClientRect();
      node.width = Math.round(bounds.width * devicePixelRatio);
      node.height = Math.round(bounds.height * devicePixelRatio);
      render.current();
    }
    resize();
    node.dataset.ready = 'true';
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const pose = live.current, target = poseFor(topic), assembly = detail.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const timeline = gsap.timeline({ paused: true, onUpdate: () => render.current() });
    function settle() {
      timeline.kill();
      Object.assign(pose, target);
      Object.assign(assembly, { topic, deployment: 1 });
      render.current();
    }
    if (motion.matches || (assembly.topic === topic && assembly.deployment === 1)) settle();
    else {
      if (assembly.topic !== topic) {
        timeline.to(assembly, { deployment: 0, duration: .48 * assembly.deployment, ease: 'none' });
      }
      const deckMoving = (Object.keys(target) as (keyof typeof target)[]).some(key => pose[key] !== target[key]);
      if (deckMoving) timeline.to(pose, { ...target, duration: .32, ease: 'sine.inOut' });
      const remaining = assembly.topic === topic ? 1 - assembly.deployment : 1;
      timeline.call(() => { assembly.topic = topic; })
        .to(assembly, { deployment: 1, duration: .58 * remaining, ease: 'none' })
        .play();
    }
    const preference = () => { if (motion.matches) settle(); };
    motion.addEventListener('change', preference);
    return () => { timeline.kill(); motion.removeEventListener('change', preference); };
  }, [topic]);

  return <span className={styles.illustration} aria-hidden="true">
    <canvas ref={canvas} />
    <span style={{ maskImage: `url("${assetPath(`/assets/illustrations/trust-${topic}-line.svg`)}")` }} />
  </span>;
}
