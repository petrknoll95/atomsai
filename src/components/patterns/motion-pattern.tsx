'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPatternRenderer } from './renderer';
import { motionPresets, type PatternMotion } from './motion-presets';
import type { PatternOptions } from './types';

export interface MotionPatternProps extends PatternOptions {
  motion?: PatternMotion;
  duration?: number;
  intensity?: number;
  playing?: boolean;
  /** Supplying a phase freezes playback for exact inspection. 0 and 1 match. */
  phase?: number;
  /** Optional source canvas selector for a visually aligned decorative copy. */
  syncWith?: string;
  onProgress?: (phase: number) => void;
  onAvailabilityChange?: (available: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

/** One cached-mask composite per frame; palette remains fixed. */
export function MotionPattern({ motion: requestedMotion, duration = 12, intensity = 0.7, playing = true, phase, syncWith, onProgress, onAvailabilityChange, className, style, ...options }: MotionPatternProps) {
  const motion = requestedMotion ?? (options.kind === 'concentric' ? 'ripple' : 'tide');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ options, motion, duration, intensity, playing, phase, syncWith, onProgress, onAvailabilityChange });
  const update = useRef<() => void>(() => {});
  const [error, setError] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = reduced.matches;
    let renderer: ReturnType<typeof createPatternRenderer> | null = null;
    let frame = 0, previous = 0, drawnAt = 0, notifiedAt = 0, cycle = 0;
    let sourceCanvas: HTMLCanvasElement | null = null;
    let sourceSelector: string | undefined;
    let visible = false, lost = false, failed = false, signature = '';
    const wrap = (value: number) => ((value % 1) + 1) % 1;
    const running = () => visible && !document.hidden && !reduceMotion && latest.current.playing && latest.current.phase === undefined && !lost && !failed;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const draw = (now: number) => {
      const settings = latest.current;
      if (settings.phase !== undefined) cycle = wrap(settings.phase);
      else if (settings.syncWith) {
        if (sourceSelector !== settings.syncWith || !sourceCanvas?.isConnected) {
          sourceSelector = settings.syncWith;
          sourceCanvas = document.querySelector<HTMLCanvasElement>(settings.syncWith);
        }
        const sourcePhase = sourceCanvas?.dataset.phase;
        if (sourcePhase !== undefined) cycle = wrap(Number(sourcePhase));
      }
      const preset = motionPresets.find(preset => preset.id === settings.motion)!;
      renderer?.drawMotion(preset.shader, cycle, settings.intensity);
      canvas.dataset.phase = cycle.toFixed(6);
      canvas.dataset.motionFrames = String(Number(canvas.dataset.motionFrames ?? 0) + 1);
      if (now - notifiedAt > 250 || !running()) { settings.onProgress?.(cycle); notifiedAt = now; }
    };
    const tick = (now: number) => {
      frame = 0;
      if (!running()) { previous = 0; canvas.dataset.playback = reduceMotion ? 'reduced' : 'paused'; return; }
      if (previous) cycle = wrap(cycle + (now - previous) / (Math.max(8, latest.current.duration) * 1000));
      previous = now;
      if (now - drawnAt >= 1000 / 30 - 0.5) { draw(now); drawnAt = now; }
      frame = requestAnimationFrame(tick);
    };
    const refresh = () => {
      stop();
      canvas.dataset.playback = reduceMotion ? 'reduced' : running() ? 'playing' : 'paused';
      if (!visible || document.hidden || lost || failed) return;
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      const next = JSON.stringify([latest.current.options, width, height, devicePixelRatio]);
      try {
        if (next !== signature) {
          renderer ??= createPatternRenderer(canvas);
          renderer.prepare(latest.current.options, width, height, devicePixelRatio);
          signature = next; latest.current.onAvailabilityChange?.(true);
        }
        draw(performance.now());
        if (running()) frame = requestAnimationFrame(tick);
      } catch {
        failed = true; canvas.dataset.renderState = 'error'; canvas.dataset.playback = 'unavailable'; setError(true); latest.current.onAvailabilityChange?.(false);
        renderer?.dispose(); renderer = null;
      }
    };
    update.current = refresh;
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting); refresh();
    });
    intersection.observe(canvas);
    const resize = new ResizeObserver(refresh); resize.observe(canvas);
    const lose = (event: Event) => {
      event.preventDefault(); stop(); lost = true; renderer = null; signature = '';
      canvas.dataset.renderState = 'lost'; canvas.dataset.playback = 'paused'; setError(true); latest.current.onAvailabilityChange?.(false);
    };
    const restore = () => { lost = false; failed = false; setError(false); refresh(); };
    canvas.addEventListener('webglcontextlost', lose);
    canvas.addEventListener('webglcontextrestored', restore);
    document.addEventListener('visibilitychange', refresh);
    const changeMotion = (event: MediaQueryListEvent) => { reduceMotion = event.matches; refresh(); };
    reduced.addEventListener('change', changeMotion);
    window.addEventListener('resize', refresh);
    return () => {
      stop(); intersection.disconnect(); resize.disconnect();
      canvas.removeEventListener('webglcontextlost', lose);
      canvas.removeEventListener('webglcontextrestored', restore);
      document.removeEventListener('visibilitychange', refresh);
      reduced.removeEventListener('change', changeMotion);
      window.removeEventListener('resize', refresh);
      renderer?.dispose(); update.current = () => {};
    };
  }, []);
  useEffect(() => {
    latest.current = { options, motion, duration, intensity, playing, phase, syncWith, onProgress, onAvailabilityChange };
    update.current();
  }, [options.kind, options.count, options.mode, options.colors, options.fit, options.blurScale, options.rotation, options.zoom, options.panX, options.panY, motion, duration, intensity, playing, phase, syncWith, onProgress, onAvailabilityChange]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
    <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} role="img" aria-label={`${motionPresets.find(preset => preset.id === motion)!.name}, ${options.kind} pattern`} data-motion={motion} data-pattern={options.kind} data-count={options.count} data-render-state="pending" />
    {error && <p role="status" style={{ position: 'absolute', inset: '40% 24px auto', textAlign: 'center', padding: '20px', borderRadius: '12px', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>This browser cannot display the shader. Motion is unavailable.</p>}
  </div>;
}
