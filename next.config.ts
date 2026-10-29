import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

// Production checks must not replace chunks used by the live local preview.
export default function config(phase: string): NextConfig {
  return {
    devIndicators: false,
    allowedDevOrigins: ['127.0.0.1'],
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-preview' : '.next',
  };
}
