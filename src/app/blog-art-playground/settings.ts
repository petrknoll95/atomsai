export const width = 1600;
export const height = 900;

export const palettes = [
  { name: 'Forest & cream', tokens: ['forest-shade', 'deep-green', 'forest-green', 'sage', 'sage-tint', 'stone', 'cream'] },
  { name: 'Forest & iris', tokens: ['forest-shade', 'deep-green', 'forest-green', 'iris', 'iris-light', 'cream'] },
  { name: 'Iris & cream', tokens: ['forest-shade', 'iris-dark', 'iris', 'iris-light', 'cream'] },
] as const;

export const defaults = {
  palette: 0,
  zoom: 100,
  imageX: 50,
  imageY: 50,
  opacity: 46,
  burstX: 50,
  burstY: 100,
  frequency: 148,
  quality: 1,
};

export type Settings = typeof defaults;
export type Cover = { slug: string; title: string; src: string };
