import { defineShader, transformColor, transformPosition, wgsl } from 'shaders/std';

/** Softbox lighting behind the glass, in the site's forest palette. */
export const AtomsLightField = defineShader({
  name: 'AtomsLightField',
  animatedTime: { speed: 'speed' },
  props: {
    speed: { default: 1 },
    dark: { default: '#10231e', transform: transformColor },
    light: { default: '#425f51', transform: transformColor },
    cursor: { default: { x: 0.5, y: 0.3 }, transform: transformPosition },
    presence: { default: 0 },
  },
  paint: wgsl`
    let drift = sin(time * 0.12) * 0.025;
    let overhead = exp(-pow((uv.y + 0.16) / 0.34, 2.0));
    let softbox = exp(-pow((uv.x - 0.26 - drift) / 0.28, 2.0));
    let second = exp(-pow((uv.x - 0.83 + drift) / 0.24, 2.0));
    let wash = overhead * (0.38 + softbox * 0.62 + second * 0.36);
    let d = (uv - cursor) * vec2f(aspect, 1.0);
    let spot = exp(-dot(d, d) / 0.065) * presence;
    let lightAmount = wash + spot * 0.65;
    return vec4f(mix(dark.rgb, light.rgb, clamp(lightAmount, 0.0, 1.0)), 1.0);
  `,
});

/** Thin reflective edges and a broad curved face, without a second texture pass. */
export const AtomsGlassSurface = defineShader({
  name: 'AtomsGlassSurface',
  animatedTime: { speed: 'speed' },
  props: {
    count: { default: 10 },
    speed: { default: 1 },
    rim: { default: '#668477', transform: transformColor },
    cursor: { default: { x: 0.5, y: 0.3 }, transform: transformPosition },
    presence: { default: 0 },
  },
  effect: wgsl`
    let column = floor(uv.x * count);
    let cell = fract(uv.x * count);
    let centre = (column + 0.5) / count;
    let variance = 0.83 + 0.17 * sin(column * 2.399);
    let overhead = exp(-pow((uv.y + 0.08) / 0.42, 2.0));
    let baseLight = (0.23 + overhead * 0.65) * variance;
    let dx = (centre - cursor.x) * aspect;
    let dy = uv.y - cursor.y;
    let proximity = exp(-(dx * dx / 0.09 + dy * dy / 0.14)) * presence;
    let reflection = exp(-pow((cell - 0.035) / 0.043, 2.0));
    let shoulder = exp(-pow((cell - 0.11) / 0.17, 2.0));
    let occlusion = exp(-pow((cell - 0.97) / 0.045, 2.0));
    let face = 0.84 + 0.16 * sin(cell * 3.14159265);
    let sheen = (reflection * 0.15 + shoulder * 0.065) * (baseLight + proximity * 1.45);
    let shaded = child.rgb * face * (1.0 - occlusion * 0.12);
    // Static sub-pixel dithering keeps the deep green gradients smooth.
    let noise = fract(sin(dot(floor(uv * viewport), vec2f(12.9898, 78.233))) * 43758.5453) - 0.5;
    return vec4f(max(vec3f(0.0), shaded + rim.rgb * sheen + noise * 0.00055), child.a);
  `,
});
