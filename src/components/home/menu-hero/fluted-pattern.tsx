'use client';

import { useEffect, useRef, useState } from 'react';
import { Shader, CustomShader, FlutedGlass } from 'shaders/react';
import { AtomsLightField, AtomsGlassSurface } from './glass-material';
import { useGlassPointer } from './use-glass-pointer';
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
  const light = useGlassPointer(host, reduced || failed);
  const cursor = { x: light.x, y: light.y };

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
        <CustomShader src={AtomsGlassSurface} count={count} cursor={cursor} presence={light.presence} speed={reduced ? 0 : 1}>
          <FlutedGlass angle={0} frequency={frequency} shape="rounded" softness={0.7}
            refraction={1.35} aberration={0} highlight={0.12} highlightSoftness={0.65}
            highlightColor="#668477" lightAngle={38} speed={0}>
            <CustomShader src={AtomsLightField} cursor={cursor} presence={light.presence} speed={reduced ? 0 : 1} />
          </FlutedGlass>
        </CustomShader>
      </Shader>}
  </div>;
}
