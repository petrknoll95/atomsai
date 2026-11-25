/* Generated from original Figma 205:12328; see docs/patterns/source.
   DISPLAY_P3 channels. Matrices are flat row-major Figma [a,b,tx,c,d,ty].
   Gradient matrices act on normalized local paint coordinates; values are exact.
   Root component canvas placement is normalized to (0,0); source JSON retains it.
   Child order and fill order are original Figma order, including mask semantics. */
export type PatternKind = 'drift' | 'offset' | 'single-band' | 'concentric';
export type PatternTheme = 'light' | 'dark';
export type RGBA = [number, number, number, number];
export type Matrix = [number, number, number, number, number, number];
export type Bounds = [number, number, number, number];
export type GradientStop = [number, number, number, number, number];
export interface SourceGradient {
  type: 'radial' | 'linear' | 'angular' | 'diamond';
  matrix: Matrix;
  stops: GradientStop[];
  sourceIds: string[];
}
export type SourcePaint = {
  opacity: number;
  blendMode: string;
  visible: boolean;
} & ({gradient: string} | {colorRole: string; variableId: string} | {rgba: RGBA});
export interface SourceNode {
  id: string;
  name: string;
  type: 'frame' | 'rect' | 'ellipse' | 'vector';
  bounds: Bounds;
  transform: Matrix;
  opacity: number;
  blendMode: string;
  visible: boolean;
  isMask: boolean;
  maskType?: 'ALPHA' | 'LUMINANCE' | 'VECTOR';
  clip?: boolean;
  paints: SourcePaint[];
  effects?: {type: string; radius: number; visible: boolean; blurType?: string}[];
  arc?: {start: number; end: number; innerRadius: number};
  paths?: {windingRule: string; data: string}[];
  children?: SourceNode[];
  repeat?: {axis: 'x'; count: number; step: number; template: SourceNode; sourceIds: string[]; sourceTypes: string[]};
}
export interface PatternVariant {
  id: string;
  sourceDensity: string;
  slitCount: number;
  ringPitch?: number;
  root?: SourceNode;
}
export interface PatternSource {
  kind: PatternKind;
  setId: string;
  defaultDensity: string;
  /** Verbatim component-set description; Concentric incorrectly describes 29 rings as 30. */
  description: string;
  viewport: [number, number];
  overscan: Bounds;
  template?: SourceNode;
  variants: Record<string, PatternVariant>;
}
export const patternThemeMetadata = {
  light: {id:'5:0', name:'Forest Light'},
  dark: {id:'5:2', name:'Forest Dark'},
} as const;

export const patternThemes: Record<PatternTheme, Record<string, RGBA>> = {
  "light": {
    "pattern/drift/base": [0.15294118225574493, 0.26274511218070984, 0.23137255012989044, 1],
    "pattern/drift/lower-field": [0.4000000059604645, 0.5372549295425415, 0.47058823704719543, 1],
    "pattern/drift/upper-field": [0.4000000059604645, 0.5372549295425415, 0.47058823704719543, 1],
    "pattern/drift/highlight": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/drift/reflection": [0.9647058844566345, 0.9450980424880981, 0.9098039269447327, 1],
    "pattern/offset/base": [0.15294118225574493, 0.26274511218070984, 0.23137255012989044, 1],
    "pattern/offset/upper-field": [0.4000000059604645, 0.5372549295425415, 0.47058823704719543, 1],
    "pattern/offset/lower-field": [0.9647058844566345, 0.9450980424880981, 0.9098039269447327, 1],
    "pattern/offset/highlight": [0.3448955714702606, 0.3448955714702606, 0.3448955714702606, 1],
    "pattern/offset/reflection": [1, 1, 1, 1],
    "pattern/single-band/base": [0.15294118225574493, 0.26274511218070984, 0.23137255012989044, 1],
    "pattern/single-band/lower-field": [0.6549019813537598, 0.6666666865348816, 0.6627451181411743, 1],
    "pattern/single-band/upper-field": [0.4000000059604645, 0.5372549295425415, 0.47058823704719543, 1],
    "pattern/single-band/reflection-1": [1, 1, 1, 1],
    "pattern/single-band/reflection-2": [0.9411764740943909, 0.9215686321258545, 0.9607843160629272, 1],
    "pattern/single-band/reflection-3": [0.15294118225574493, 0.26274511218070984, 0.23137255012989044, 1],
    "pattern/concentric/base": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/concentric/upper-field": [0.4000000059604645, 0.5372549295425415, 0.47058823704719543, 1],
    "pattern/concentric/lower-field": [0.4000000059604645, 0.5372549295425415, 0.47058823704719543, 1],
    "pattern/concentric/highlight": [0.18224161863327026, 0.18224158883094788, 0.18224158883094788, 1],
    "pattern/concentric/reflection": [0.3931038975715637, 0.3931039571762085, 0.3931039571762085, 1],
    "pattern/concentric/reflection-base": [0, 0, 0, 1]
  },
  "dark": {
    "pattern/drift/base": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/drift/lower-field": [0.25882354378700256, 0.4000000059604645, 0.3529411852359772, 1],
    "pattern/drift/upper-field": [0.25882354378700256, 0.4000000059604645, 0.3529411852359772, 1],
    "pattern/drift/highlight": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/drift/reflection": [0.4000000059604645, 0.5372549295425415, 0.47058823704719543, 1],
    "pattern/offset/base": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/offset/upper-field": [0.25882354378700256, 0.4000000059604645, 0.3529411852359772, 1],
    "pattern/offset/lower-field": [0.9647058844566345, 0.9450980424880981, 0.9098039269447327, 1],
    "pattern/offset/highlight": [0.3448955714702606, 0.3448955714702606, 0.3448955714702606, 1],
    "pattern/offset/reflection": [1, 1, 1, 1],
    "pattern/single-band/base": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/single-band/lower-field": [0.6549019813537598, 0.6666666865348816, 0.6627451181411743, 1],
    "pattern/single-band/upper-field": [0.25882354378700256, 0.4000000059604645, 0.3529411852359772, 1],
    "pattern/single-band/reflection-1": [1, 1, 1, 1],
    "pattern/single-band/reflection-2": [0.9411764740943909, 0.9215686321258545, 0.9607843160629272, 1],
    "pattern/single-band/reflection-3": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/concentric/base": [0.062745101749897, 0.13725490868091583, 0.11764705926179886, 1],
    "pattern/concentric/upper-field": [0.25882354378700256, 0.4000000059604645, 0.3529411852359772, 1],
    "pattern/concentric/lower-field": [0.25882354378700256, 0.4000000059604645, 0.3529411852359772, 1],
    "pattern/concentric/highlight": [0.18224161863327026, 0.18224158883094788, 0.18224158883094788, 1],
    "pattern/concentric/reflection": [0.3931038975715637, 0.3931039571762085, 0.3931039571762085, 1],
    "pattern/concentric/reflection-base": [0, 0, 0, 1]
  }
};

export type PatternData = { source: PatternSource; gradients: Record<string, SourceGradient> };
