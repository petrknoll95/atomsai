export const motionPresets = [
  { id: 'breath', name: 'Tonal breath', description: 'Highlights open and recede in a clear, unhurried breath.', duration: 10, shader: 0 },
  { id: 'tide', name: 'Light tide', description: 'A broad wash of light travels through the existing tones.', duration: 12, shader: 1 },
  { id: 'orbit', name: 'Orbiting sheen', description: 'A soft light source circles the surface without turning the pattern.', duration: 14, shader: 2 },
  { id: 'silk', name: 'Silk interference', description: 'Two gentle waves overlap, creating a fluid shift in depth.', duration: 16, shader: 3 },
  { id: 'ripple', name: 'Expanding waves', description: 'Concentric rings flow outward continuously, emerging softly from the center.', duration: 8, shader: 4 },
] as const;
export type PatternMotion = typeof motionPresets[number]['id'];
