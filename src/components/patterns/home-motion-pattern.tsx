"use client";

import { useContext, type CSSProperties } from 'react';
import { MotionPattern } from './motion-pattern';
import { MotionPlaybackContext } from './motion-playback-context';
import type { PatternOptions } from './types';

export function HomeMotionPattern({ style, ...options }: PatternOptions & { style?: CSSProperties }) {
  const playing = useContext(MotionPlaybackContext);
  const concentric = options.kind === 'concentric';
  return <MotionPattern {...options} style={style} motion={concentric ? 'ripple' : 'tide'}
    duration={concentric ? 8 : 12} intensity={0.7} playing={playing} />;
}
