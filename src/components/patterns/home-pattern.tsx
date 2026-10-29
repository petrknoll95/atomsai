import type { CSSProperties } from 'react';
import { Pattern } from './pattern';
import { HomeMotionPattern } from './home-motion-pattern';
import type { PatternColor, PatternColors, PatternOptions } from './types';
import styles from './home-pattern.module.css';

/** Direct colors retained by the homepage's older Concentric instances.
 * They intentionally differ from the current Iris theme's F0EBF5 highlight.
 * Original nodes and resolved values: docs/patterns/homepage-source.json. */
const legacyIris: PatternColors = {
  base: [0.2862745225429535, 0.24705882370471954, 0.3450980484485626],
  upper: [0.5490196347236633, 0.47058823704719543, 0.6901960968971252],
  lower: [0.5490196347236633, 0.47058823704719543, 0.6901960968971252],
  highlight: [0.8470588326454163, 0.8039215803146362, 0.8980392217636108],
  reflection: [0.5490196347236633, 0.47058823704719543, 0.6901960968971252],
  reflectionBase: [0.2862745225429535, 0.24705882370471954, 0.3450980484485626],
};
const irisOffset: PatternColors = {
  base: [0.5490196347236633, 0.47058823704719543, 0.6901960968971252],
  upper: [0.5490196347236633, 0.47058823704719543, 0.6901960968971252],
  lower: [0.9411764740943909, 0.9215686321258545, 0.9607843160629272],
  highlight: [0.5490196347236633, 0.47058823704719543, 0.6901960968971252],
  reflection: [1, 1, 1],
};
// Current Theme / Iris Light roles. The new app assignments are documented
// decisions, while these colors come from source/theme-variables.json, mode 5:5.
const iris = irisOffset.base!;
const irisShade = legacyIris.base!;
const irisMist = irisOffset.lower!;
const white: PatternColor = [1, 1, 1];
const irisDrift: PatternColors = { base: iris, lower: irisShade, upper: irisMist, highlight: iris, reflection: white };
const irisBand: PatternColors = { base: irisShade, field1: irisMist, field2: iris, field3: iris, reflection: white, overlay: irisMist, shade: irisShade };

type Placement = {
  options: PatternOptions;
  viewport: readonly [number, number];
  /** Pattern instance bounds inside the original clipped viewport. */
  instance: readonly [number, number, number, number];
  radius: number | 'circle';
};

export const homePatternPlacements = {
  'offerings-drift': { options: { kind: 'drift', count: 5, mode: 'dark', fit: 'stretch', blurScale: 800 / 480.00335693359375 }, viewport: [480, 553], instance: [0, 0, 480, 553], radius: 16 },
  'offerings-concentric': { options: { kind: 'concentric', count: 15, mode: 'dark' }, viewport: [480, 553], instance: [-36.66796875, 0, 553, 553], radius: 16 },
  'offerings-band': { options: { kind: 'single-band', count: 5, mode: 'dark', fit: 'stretch', blurScale: 800 / 480.0032958984375 }, viewport: [480, 553], instance: [0, 0, 480, 553], radius: 16 },
  'applications-concentric': { options: { kind: 'concentric', count: 15, colors: legacyIris }, viewport: [352, 352], instance: [0, 0, 352, 352], radius: 'circle' },
  'applications-drift': { options: { kind: 'drift', count: 5, colors: irisDrift }, viewport: [352, 352], instance: [0, 0, 352, 352], radius: 'circle' },
  'applications-band': { options: { kind: 'single-band', count: 5, colors: irisBand }, viewport: [352, 352], instance: [0, 0, 352, 352], radius: 'circle' },
  'applications-offset': { options: { kind: 'offset', count: 20, colors: irisOffset }, viewport: [352, 352], instance: [0, 0, 352, 352], radius: 'circle' },
  'preview-drift': { options: { kind: 'drift', count: 1, mode: 'dark', fit: 'stretch' }, viewport: [992, 640], instance: [0, 0, 992, 640], radius: 32 },
  'preview-concentric': { options: { kind: 'concentric', count: 15, colors: legacyIris }, viewport: [480, 640], instance: [-160, -80, 800, 800], radius: 32 },
  'cta-pattern': { options: { kind: 'offset', count: 20, colors: irisOffset, rotation: -90 }, viewport: [720, 368], instance: [0, -176, 720, 720], radius: 16 },
} as const satisfies Record<string, Placement>;

export type HomePatternApplication = keyof typeof homePatternPlacements;

/** Measured homepage crops and the three added application hover assignments. */
export function HomePattern({ application, id, className, style, loading = 'lazy', animated = true }: {
  application: HomePatternApplication;
  id?: string;
  /** Disable only for source-comparison fixtures. */
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
  loading?: 'eager' | 'lazy';
}) {
  const { options, viewport: [width, height], instance: [x, y, artworkWidth, artworkHeight] } = homePatternPlacements[application];
  // Keep this boundary in the HTML: a failed/late CSS chunk must never let
  // absolutely positioned decorative canvases use the whole page as their box.
  const viewportStyle = {
    '--artwork-ratio': width / height,
    containerType: 'size',
    contain: 'strict',
    overflow: 'hidden',
    pointerEvents: 'none',
  } as CSSProperties;
  const instanceStyle: CSSProperties = {
    position: 'absolute', left: `${x / width * 100}%`, top: `${y / height * 100}%`,
    width: `${artworkWidth / width * 100}%`, height: `${artworkHeight / height * 100}%`,
  };
  return <div id={id} className={`${styles.viewport} ${className ?? ''}`} style={{ ...viewportStyle, ...style }} data-home-pattern={application} aria-hidden="true">
    <div className={styles.artwork}>{animated ? <HomeMotionPattern {...options} style={instanceStyle} /> : <Pattern {...options} loading={loading} style={instanceStyle} />}</div>
  </div>;
}
