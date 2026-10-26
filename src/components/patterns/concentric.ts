import { patternGradients, patternSources, patternThemes, type SourceNode } from './source-data';
import type { GradientData, MaskData, PatternColor, PatternModel, PatternOptions } from './types';

const layers = ['Upper field', 'Lower field', 'Highlight', 'Reflection'] as const;
const roles = ['base', 'upper', 'lower', 'highlight', 'reflection'] as const;
const themeRoles = ['base', 'upper-field', 'lower-field', 'highlight', 'reflection'] as const;
const STOP_COUNT = 40;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, amount: number) => a + (b - a) * amount;

type Geometry = Pick<PatternModel, 'gradients' | 'masks' | 'ringPitch'>;
const originals = new Map<number, Geometry>();

function descendants(node: SourceNode): SourceNode[] {
  return [node, ...(node.children ?? []).flatMap(descendants)];
}

/** Original components 77:2554 / 77:2644, captured in docs/patterns/source.
 * Keep original Float32 matrices, stop positions, RGBA and paint order verbatim.
 * Reflection is an ALPHA mask: its grayscale RGB must not reduce its opacity.
 */
function originalGeometry(count: 15 | 29): Geometry {
  const cached = originals.get(count);
  if (cached) return cached;
  const variant = Object.values(patternSources.concentric.variants).find(source => source.slitCount === count);
  if (!variant?.root || !variant.ringPitch) throw new Error(`Missing original Concentric source for ${count} rings.`);
  const nodes = descendants(variant.root);
  const gradients: GradientData[] = [];
  const masks = layers.map(name => {
    const layer = nodes.find(node => node.name === name);
    const mask = layer && descendants(layer).find(node => node.isMask);
    if (!mask) throw new Error(`Missing Concentric ${name} mask.`);
    return {
      alphaOnly: mask.maskType === 'ALPHA',
      opacity: mask.opacity,
      blur: mask.effects?.find(effect => effect.visible && effect.type === 'LAYER_BLUR')?.radius ?? 0,
      shapes: descendants(mask).filter(node => node.visible && node.type === 'ellipse').map(shape => ({
        opacity: shape.opacity,
        outer: shape.bounds[2] / 2,
        inner: shape.bounds[2] / 2 * (shape.arc?.innerRadius ?? 0),
        gradients: shape.paints.filter(paint => paint.visible && 'gradient' in paint).map(paint => {
          if (!('gradient' in paint)) throw new Error('Expected a Concentric gradient paint.');
          const original = patternGradients[paint.gradient];
          if (!original || original.type !== 'radial') throw new Error(`Missing radial source ${paint.gradient}.`);
          const index = gradients.length;
          gradients.push({ matrix: original.matrix, stops: original.stops, opacity: paint.opacity });
          return index;
        }),
      })),
    } satisfies MaskData;
  });
  const geometry = { gradients, masks, ringPitch: variant.ringPitch };
  originals.set(count, geometry);
  return geometry;
}

/** Interpolate a captured alpha profile by physical outer radius, keeping the
 * upper layer's a/b half-ring families separate. Sample indices represent equal
 * progress through each gradient's padded range, not absolute stop positions.
 * Outside the captured radius range, use the nearest recorded profile.
 */
function profileAlpha(source: Geometry, layer: number, profile: number, radius: number, sample: number): number {
  const shapes = source.masks[layer].shapes.filter((_, index) => layer !== 0 || index % 2 === profile);
  const paint = layer === 0 ? 0 : profile;
  const alpha = (index: number) => source.gradients[shapes[index].gradients[paint]].stops[sample][4];
  const first = shapes[0].outer!;
  const last = shapes.length - 1;
  if (radius <= first) return alpha(0);
  if (radius >= shapes[last].outer!) return alpha(last);
  const right = shapes.findIndex(shape => shape.outer! >= radius);
  const leftRadius = shapes[right - 1].outer!;
  const amount = (radius - leftRadius) / (shapes[right].outer! - leftRadius);
  return mix(alpha(right - 1), alpha(right), amount);
}

/** INFERRED continuation for counts absent from Figma. Both originals satisfy
 * (count - 1) * pitch = 588. The one-ring case uses a 600-unit radius so it covers
 * the full 840-square field. These rules preserve coverage for supported 1–80.
 *
 * Matrix geometry and stop positions below match every original gradient to
 * Float32 precision. Alpha interpolation is a design inference: the source only
 * supplies per-ring samples at pitches 42 and 21. Interpolate radius first, then
 * pitch linearly; outside that pitch interval clamp to the nearest source.
 * No image, SVG mask, animation, or unverified opacity equation is used.
 */
function extendedGeometry(count: number): Geometry {
  const coarse = originalGeometry(15);
  const fine = originalGeometry(29);
  const pitch = count === 1 ? 600 : 588 / (count - 1);
  const pitchMix = clamp((42 - pitch) / 21, 0, 1);
  const gradients: GradientData[] = [];
  const masks: MaskData[] = layers.map((_, layer) => ({
    alphaOnly: layer === 3,
    opacity: 1,
    blur: 0,
    shapes: [],
  }));

  function gradient(layer: number, profile: number, outer: number, inner: number, dy: number): number {
    const radius = outer + 2 + Math.abs(dy);
    const scale = outer / radius;
    const start = Math.max(0, (inner - Math.abs(dy) - 2) / radius);
    const stops = Array.from({ length: STOP_COUNT }, (_, sample) => {
      const alpha = layer === 3 ? 1 : mix(
        profileAlpha(coarse, layer, profile, outer, sample),
        profileAlpha(fine, layer, profile, outer, sample),
        pitchMix,
      );
      return [mix(start, 1, sample / (STOP_COUNT - 1)), 1, 1, 1, clamp(alpha, 0, 1)];
    });
    const index = gradients.length;
    gradients.push({
      matrix: [scale, 0, (1 - scale) / 2, 0, scale, .5 - (outer + dy) / (2 * radius)],
      stops,
      opacity: 1,
    });
    return index;
  }

  for (let k = 1; k <= count; k++) {
    const outer = k * pitch;
    const inner = (k - 1) * pitch;
    const middle = (k - .5) * pitch;
    const upperShift = (2 * k - 1) * pitch * pitch * 17 / 16800;
    masks[0].shapes.push(
      { outer: middle, inner, opacity: 1, gradients: [gradient(0, 0, middle, inner, upperShift)] },
      { outer, inner: middle, opacity: 1, gradients: [gradient(0, 1, outer, middle, -upperShift)] },
    );
    for (const layer of [1, 2]) {
      const shift = pitch * pitch / 672 * (layer === 2 ? 2.6 : 1);
      masks[layer].shapes.push({
        outer, inner, opacity: 1,
        gradients: [
          gradient(layer, 0, outer, inner, (k - 1) * shift),
          gradient(layer, 1, outer, inner, -k * shift),
        ],
      });
    }
    masks[3].shapes.push({ outer, inner, opacity: .2, gradients: [gradient(3, 0, outer, inner, -k * pitch * pitch / 8400)] });
  }
  return { gradients, masks, ringPitch: pitch };
}

export function buildConcentricModel(options: PatternOptions): PatternModel {
  const count = clamp(Math.round(options.count) || 1, 1, 80);
  const geometry = count === 15 || count === 29 ? originalGeometry(count) : extendedGeometry(count);
  const theme = patternThemes[options.mode ?? 'light'];
  // Source reflection-base is black in both modes: the additive identity. It is
  // not a sixth color carrier and must not displace the actual reflection role.
  const colors: PatternColor[] = roles.map((role, index) => {
    const override = options.colors?.[role];
    if (override) return override;
    const color = theme[`pattern/concentric/${themeRoles[index]}`];
    return [color[0], color[1], color[2]];
  });
  return { ...geometry, colors, kind: 'concentric', count };
}
