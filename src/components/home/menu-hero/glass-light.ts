import { defineShader, wgsl } from 'shaders/std';

/** Keep the separated color fringes while letting the original pattern show through the bloom. */
export const GlassLight = defineShader({
  name: 'AtomsGlassLight',
  props: { fill: { default: 0.18 } },
  effect: wgsl`
    let peak = max(child.r, max(child.g, child.b));
    let low = min(child.r, min(child.g, child.b));
    let saturation = (peak - low) / max(peak, 0.0001);
    let fringe = smoothstep(0.75, 0.98, saturation);
    return vec4f(child.rgb, child.a * mix(fill, 1.0, fringe));
  `,
});
