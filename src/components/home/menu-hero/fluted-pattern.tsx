'use client';

import { useEffect, useRef, useState } from 'react';
import { Shader, CustomShader, ImageTexture, ChromaFlow, FlutedGlass, FilmGrain } from 'shaders/react';
import { MotionPattern } from '@/components/patterns/motion-pattern';
import { usePatternTexture } from './use-pattern-texture';
import { useGlassPointer } from './use-glass-pointer';
import { GlassLight } from './glass-light';

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
  const { texture, failed: textureFailed } = usePatternTexture(host, count);
  const unavailable = failed || textureFailed;
  const light = useGlassPointer(host, reduced || unavailable);

  useEffect(() => {
    const element = host.current!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(motion.matches);
    updateMotion();
    motion.addEventListener('change', updateMotion);
    // Shaders 4 uses height-normalized coordinates (uv.x * width / height).
    // The original pattern crops an 840-unit field to 800 units. Match its
    // visible count so glass seams stay aligned with the existing column fades.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width) setFrequency(count * (800 / 840) * height / width);
    });
    observer.observe(element);
    return () => { observer.disconnect(); motion.removeEventListener('change', updateMotion); };
  }, [count]);

  return <div ref={host} style={{ width: '100%', height: '100%' }} data-fluted-hero={unavailable ? 'fallback' : 'webgpu'}>
    {unavailable ? <MotionPattern kind="offset" count={count} mode="dark" fit="stretch" motion="tide" duration={12} intensity={0.7} resolution="display" onAvailabilityChange={onAvailabilityChange} /> : texture &&
      <Shader key={reduced ? 'still' : 'interactive'} style={{ width: '100%', height: '100%' }} colorSpace="srgb" disableTelemetry
        onReady={() => onAvailabilityChange(true)} onUnavailable={() => setFailed(true)}>
        <FilmGrain strength={0.025}>
          <FlutedGlass angle={0} frequency={frequency} shape="rounded" softness={1}
            refraction={0.08} aberration={0.025} highlight={0.9} highlightSoftness={0.28}
            highlightColor="#cae3d9" lightAngle={-55 + (light.x - 0.5) * 58 * light.presence} speed={0}>
            <ImageTexture url={texture} objectFit="fill" />
          </FlutedGlass>
          {/* Strong refraction on the light preserves the original pattern's geometry. */}
          {!reduced && <CustomShader src={GlassLight}>
            <FlutedGlass angle={0} frequency={frequency} shape="rounded" softness={1}
              refraction={4} aberration={0.12} highlight={0} speed={0}>
              <ChromaFlow baseColor="#bcead8" upColor="#7ec9a7" downColor="#328465"
                leftColor="#3fae8b" rightColor="#8cdbb5" intensity={1.5} radius={2.5} momentum={20} />
            </FlutedGlass>
          </CustomShader>}
        </FilmGrain>
      </Shader>}
  </div>;
}
