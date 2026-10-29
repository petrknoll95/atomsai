import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

// Production checks must not replace chunks used by the live local preview.
export default function config(phase: string): NextConfig {
  const pages = process.env.GITHUB_PAGES === 'true';
  return {
    ...(pages ? { output: 'export' as const, basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/atomsai', trailingSlash: true, images: { unoptimized: true } } : {}),
    devIndicators: false,
    allowedDevOrigins: ['127.0.0.1'],
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-preview' : '.next',
  };
}
