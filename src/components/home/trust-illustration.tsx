'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { assetPath } from '@/lib/base-path';
import { drawModel, poseFor, type TrustTopic } from './trust-model';
import styles from './trust-summary.module.css';

export function TrustIllustration({ topic }: { topic: TrustTopic }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef(poseFor('integrations'));
  const detail = useRef({ topic: 'integrations' as TrustTopic, opacity: 1 });
  const render = useRef(() => {});

  useLayoutEffect(() => {
    const node = canvas.current!;
    if (!node.getContext('2d')) return;
    const ink = getComputedStyle(node).color;
    const composite = node.getContext('2d')!;
    const detailed = document.createElement('canvas');
    render.current = () => {
      const { topic, opacity } = detail.current;
      if (opacity <= 0 || opacity >= 1) {
        drawModel(node, live.current, opacity >= 1 ? topic : null, ink);
        return;
      }
      // Blend two complete hidden-line renders. This fades an assembly as
      // one object, including the edges it occludes behind it.
      drawModel(node, live.current, null, ink);
      drawModel(detailed, live.current, topic, ink);
      composite.save();
      composite.resetTransform();
      composite.globalAlpha = opacity;
      composite.globalCompositeOperation = 'destination-out';
      composite.fillRect(0, 0, node.width, node.height);
      composite.globalCompositeOperation = 'lighter';
      composite.drawImage(detailed, 0, 0);
      composite.restore();
    };
    function resize() {
      const bounds = node.getBoundingClientRect();
      node.width = Math.round(bounds.width * devicePixelRatio);
      node.height = Math.round(bounds.height * devicePixelRatio);
      detailed.width = node.width;
      detailed.height = node.height;
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
      Object.assign(assembly, { topic, opacity: 1 });
      render.current();
    }
    if (motion.matches || (assembly.topic === topic && assembly.opacity === 1)) settle();
    else {
      // A new selection picks up the rendered deck and the current fade.
      // Finish the exit before reshaping the deck or attaching the next parts.
      if (assembly.topic !== topic && assembly.opacity > 0) {
        timeline.to(assembly, { opacity: 0, duration: .23 * assembly.opacity, ease: 'sine.inOut' });
      }
      timeline.to(pose, { ...target, duration: .4, ease: 'power2.inOut' })
        .call(() => { assembly.topic = topic; })
        .to(assembly, { opacity: 1, duration: .29, ease: 'sine.out' })
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
