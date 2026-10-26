import type { CSSProperties } from 'react';

export type PatternKind = 'drift' | 'offset' | 'single-band' | 'concentric';
export type PatternMode = 'light' | 'dark';
/** Encoded Display P3 channels, in the same 0–1 space as the Figma document. */
export type PatternColor = readonly [number, number, number];
export type PatternColors = Partial<Record<'base' | 'upper' | 'lower' | 'highlight' | 'reflection' | 'reflectionBase' | 'field1' | 'field2' | 'field3' | 'overlay' | 'shade', PatternColor>>;

export interface PatternOptions {
  kind: PatternKind;
  /** Slits for linear patterns; full rings for Concentric. Range 1–80. */
  count: number;
  mode?: PatternMode;
  colors?: PatternColors;
  /** Source instances can stretch their normalized geometry; cover is the default. */
  fit?: 'cover' | 'stretch';
  /** Source effect-size override for instances resized without scaling their blur. */
  blurScale?: number;
  /** Clockwise degrees. Geometry is uniformly scaled and cropped, never stretched. */
  rotation?: number;
  /** Cover scale multiplier, at least 1. */
  zoom?: number;
  /** Position within the available cropped overflow, from −1 to 1. */
  panX?: number;
  panY?: number;
}

export interface PatternProps extends PatternOptions {
  loading?: 'eager' | 'lazy';
  className?: string;
  style?: CSSProperties;
  label?: string;
}

export interface GradientData {
  /** Row-major Figma transform: [a, b, tx, c, d, ty]. */
  matrix: readonly number[];
  /** Original positions and unpremultiplied RGBA channels. */
  stops: readonly (readonly number[])[];
  opacity: number;
}

export interface MaskData {
  /** One repeated slit or one annulus per entry. */
  shapes: { gradients: number[]; opacity: number; outer?: number; inner?: number }[];
  alphaOnly: boolean;
  opacity: number;
  /** Figma layer blur radius, in 840-unit source field coordinates. */
  blur: number;
}

export interface PatternModel {
  gradients: GradientData[];
  masks: MaskData[];
  colors: PatternColor[];
  kind: PatternKind;
  count: number;
  /** Actual source pitch, or an explicitly inferred extension for other counts. */
  ringPitch: number;
}
