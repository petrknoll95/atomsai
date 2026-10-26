import { patternGradients, patternSources, patternThemes, type SourceNode } from './source-data';
import type { GradientData, MaskData, PatternColor, PatternModel, PatternOptions } from './types';
import { buildConcentricModel } from './concentric';

function descendants(node: SourceNode): SourceNode[] {
  return [node, ...(node.children ?? []).flatMap(descendants)];
}

/** Translate the inspected source into numeric shader tables. No image textures. */
export function buildPatternModel(options: PatternOptions): PatternModel {
  if (options.kind === 'concentric') return buildConcentricModel(options);
  const count = Math.max(1, Math.min(80, Math.round(options.count) || 1));
  const source = patternSources[options.kind];
  const variant = Object.values(source.variants).find(value => value.slitCount === count);
  const fallback = source.variants[count > 15 ? '2' : '1'];
  const root = source.template ?? variant?.root ?? fallback?.root;
  if (!root) throw new Error(`Missing original source for ${options.kind}.`);
  const nodes = descendants(root);
  const gradients: GradientData[] = [];
  const sourceIds = new Map<string, number>();
  const masks: MaskData[] = nodes.filter(node => node.isMask).map(node => ({
    alphaOnly: node.maskType === 'ALPHA',
    opacity: node.opacity,
    blur: node.effects?.find(effect => effect.visible && effect.type === 'LAYER_BLUR')?.radius ?? 0,
    shapes: (node.repeat ? [node.repeat.template] : node.children ?? []).map(shape => ({
      opacity: shape.opacity,
      outer: shape.type === 'ellipse' ? shape.bounds[2] / 2 : undefined,
      inner: shape.type === 'ellipse' ? shape.bounds[2] / 2 * (shape.arc?.innerRadius ?? 0) : undefined,
      gradients: shape.paints.filter(paint => paint.visible && 'gradient' in paint).map(paint => {
        if (!('gradient' in paint)) throw new Error('Expected gradient paint.');
        const key = `${paint.gradient}:${paint.opacity}`;
        const existing = sourceIds.get(key);
        if (existing !== undefined) return existing;
        const original = patternGradients[paint.gradient];
        if (original.type !== 'radial') throw new Error('Unexpected source gradient type.');
        const id = gradients.length;
        gradients.push({ matrix: original.matrix, stops: original.stops, opacity: paint.opacity });
        sourceIds.set(key, id);
        return id;
      }),
    })),
  }));
  const customRoles = options.kind === 'single-band'
    ? ['base', 'field1', 'field2', 'field3', 'reflection', 'overlay', 'shade'] as const
    : options.kind === 'drift'
      ? ['base', 'lower', 'upper', 'highlight', 'reflection'] as const
      : ['base', 'upper', 'lower', 'highlight', 'reflection'] as const;
  const colors: PatternColor[] = nodes.flatMap(node => node.paints.filter(paint => paint.visible && 'colorRole' in paint && !paint.colorRole.endsWith('/reflection-base')).map(paint => {
    if (!('colorRole' in paint)) throw new Error('Expected theme-bound source paint.');
    const value = patternThemes[options.mode ?? 'light'][paint.colorRole];
    if (!value) throw new Error(`Missing theme role ${paint.colorRole}.`);
    return value.slice(0, 3) as unknown as PatternColor;
  })).map((value, index) => options.colors?.[customRoles[index]] ?? value);
  return { gradients, masks, colors, kind: options.kind, count, ringPitch: variant?.ringPitch ?? fallback?.ringPitch ?? 0 };
}
