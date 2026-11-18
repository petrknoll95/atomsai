'use client';

import { useEffect, useRef, useState } from 'react';
import { Shader, RadialGradient, LinearGradient, Swirl, ChromaFlow, FlutedGlass } from 'shaders/react';
import { MotionPattern } from '@/components/patterns/motion-pattern';

export type FlutedPatternProps = {
  count: number;
  onAvailabilityChange: (available: boolean) => void;
};

/** The glass stays vertical; only the light behind it responds to the pointer. */
export function FlutedPattern({ count, onAvailabilityChange }: FlutedPatternProps) {
  const host = useRef<HTMLDivElement>(null);
  const [frequency, setFrequency] = useState(count);
  const [reduced, setReduced] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = host.current!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(motion.matches);
    updateMotion();
    motion.addEventListener('change', updateMotion);
    // Shaders 4 uses height-normalized coordinates (uv.x * width / height).
    // Convert the horizontal column count so flute seams match the fade columns.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width) setFrequency(count * height / width);
    });
    observer.observe(element);
    return () => { observer.disconnect(); motion.removeEventListener('change', updateMotion); };
  }, [count]);

  return <div ref={host} style={{ width: '100%', height: '100%' }} data-fluted-hero={failed ? 'fallback' : 'webgpu'}>
    {failed ? <MotionPattern kind="offset" count={count} mode="dark" fit="stretch" motion="tide" duration={12} intensity={0.7} resolution="display" onAvailabilityChange={onAvailabilityChange} /> :
      <Shader style={{ width: '100%', height: '100%' }} colorSpace="srgb" disableTelemetry
        onReady={() => onAvailabilityChange(true)} onUnavailable={() => setFailed(true)}>
        <FlutedGlass angle={0} frequency={frequency} shape="rounded" softness={0.5}
          refraction={4} aberration={0} highlight={0.45} highlightSoftness={0.55}
          highlightColor="#78968a" lightAngle={65} speed={0}>
          <LinearGradient colorA="#213a30" colorB="#10231e" start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.7 }} />
          <Swirl opacity={0.25} colorA="#10231e" colorB="#304d42" colorSpace="oklab" blend={35} detail={0.7} speed={reduced ? 0 : 0.12} />
          <RadialGradient colorA="#628471" colorB="#10231e00" center={{ x: 0.5, y: -0.15 }} radius={0.85} opacity={0.35} />
          {!reduced && <RadialGradient colorA="#8ca58b" colorB="#10231e00" radius={0.42} opacity={0.5}
            center={{ type: 'mouse-position', smoothing: 0.2, momentum: 0.2 }} />}
          {!reduced && <ChromaFlow baseColor="#3e6856" upColor="#6d8e73" downColor="#27483d"
            leftColor="#477361" rightColor="#8b9e80" intensity={0.65} radius={2.4} momentum={25} opacity={0.3} />}
        </FlutedGlass>
      </Shader>}
  </div>;
}
