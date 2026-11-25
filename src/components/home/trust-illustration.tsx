'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { assetPath } from '@/lib/base-path';
import { drawModel, models, type TrustTopic } from './trust-model';
import styles from './trust-summary.module.css';

export function TrustIllustration({ topic }: { topic: TrustTopic }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ ...models.integrations });
  const previous = useRef<TrustTopic>('integrations');
  const render = useRef(() => {});

  useLayoutEffect(() => {
    const node = canvas.current!;
    if (!node.getContext('2d')) return;
    const ink = getComputedStyle(node).color;
    render.current = () => drawModel(node, live.current, ink);
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
    const pose = live.current, target = models[topic];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const topics = Object.keys(models);
    const delta = (topics.indexOf(topic)-topics.indexOf(previous.current)+topics.length)%topics.length;
    previous.current = topic;
    let tween: gsap.core.Tween | undefined;
    function settle() {
      tween?.kill();
      Object.assign(pose,target);
      render.current();
    }
    if (!delta || motion.matches) settle();
    else {
      const start = { ...pose }, clock = { t: 0 };
      const keys = Object.keys(target) as (keyof typeof target)[];
      const orbit = delta === topics.length-1 ? -.22 : .22;
      tween = gsap.to(clock, { t: 1, duration: .88, ease: 'power2.inOut', onUpdate() {
        for (const key of keys) pose[key] = start[key]+(target[key]-start[key])*clock.t;
        pose.yaw += orbit*Math.sin(Math.PI*clock.t)**2;
        render.current();
      } });
    }
    const preference = () => { if (motion.matches) settle(); };
    motion.addEventListener('change', preference);
    return () => { tween?.kill(); motion.removeEventListener('change', preference); };
  }, [topic]);

  return <span className={styles.illustration} aria-hidden="true">
    <canvas ref={canvas} />
    <span style={{ maskImage: `url("${assetPath(`/assets/illustrations/trust-${topic}-line.svg`)}")` }} />
  </span>;
}
