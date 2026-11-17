import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import * as geometry from '../skills/atomsai-illustrations/runtime/geometry.mjs';
import * as primitives from '../skills/atomsai-illustrations/runtime/primitives.mjs';
import { fitToReference } from '../skills/atomsai-illustrations/runtime/models.mjs';
import { projectScene, frameToSvg } from '../skills/atomsai-illustrations/runtime/render.mjs';
import { colors } from '../skills/atomsai-illustrations/runtime/colors.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const slug = process.argv[2];
assert(/^[a-z0-9-]+$/.test(slug ?? ''), 'Supply an article slug.');
const source = `docs/design/blog-illustrations-2026-11-17/${slug}`;
const target = `public/assets/blog/illustrations/${slug}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile(path.join(root, 'skills/atomsai-illustrations/assets/reference-manifest.json')));
for (const [file, expected] of Object.entries(manifest.runtime)) {
  assert.equal(hash(await readFile(path.join(root, 'skills/atomsai-illustrations', file))), expected, `Renderer drift: ${file}`);
}
const themes = JSON.parse(await readFile(path.join(root, 'src/content/blog/illustration-themes.json')));
assert(['forestGreen', 'deepGreen', 'iris', 'orange'].includes(themes[slug]), 'Missing approved cover background.');
const background = colors[themes[slug]].hex;
const recipe = await import(pathToFileURL(path.join(root, source, 'recipe.mjs')));
const api = { ...geometry, ...primitives };
const scene = recipe.default(api);
assert.equal(typeof recipe.verify, 'function', 'Recipe must include concept checks.');
recipe.verify(scene, api, assert);
fitToReference(scene, recipe.reference);

// The user's revised art direction overrides the kit's Iris-only default.
// Theme the renderer before serialization; retain its geometry and occlusion.
geometry.CAMERA.iris = colors.cream.hex;
const frame = projectScene(scene, { yaw: 0, pitch: 0, white: false });
const linework = [...frame.front, ...frame.rear, ...frame.accent];
for (const line of linework) line.width = 1.6;
const points = [...linework.flatMap(line => line.points), ...frame.highlights.flatMap(h => h.points)];
const extent = Math.max(...points.flatMap(p => [Math.abs(p[0]), Math.abs(p[1])]));
assert(extent < 154, 'Keep the whole illustration inside its padded square.');
const art = frameToSvg(frame);
assert(!/<(?:image|script|foreignObject|text)\b/i.test(art), 'Expected self-contained vector art.');
assert(!art.includes('#A77BCA'), 'An old Iris highlight survived the theme.');
const inner = art.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
// A 384-square illustration area sits inside a 512 × 384 editorial frame.
// Neither the drawing nor its strokes are enlarged to fill the wider crop.
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="3072" height="2304" viewBox="0 0 512 384"><rect width="512" height="384" fill="${background}"/><svg x="64" y="0" width="384" height="384" viewBox="0 0 384 384">${inner}</svg></svg>`;
await mkdir(path.join(root, 'public/assets/blog/illustrations'), { recursive: true });
await writeFile(path.join(root, `${target}-art.svg`), art);
await writeFile(path.join(root, `${target}.svg`), cover);
await sharp(Buffer.from(cover)).toColourspace('srgb').webp({ lossless: true }).toFile(path.join(root, `${target}.webp`));
await writeFile(path.join(root, source, 'export.json'), JSON.stringify({
  article: slug,
  skill: 'https://petrknoll95.github.io/atoms-ai-brand/skills/atomsai-illustrations/SKILL.md',
  revision: 'Clearer recognizable 3D objects; four approved backgrounds, thinner Paper outlines, Cream highlights, 4:3 frames with square-contained art.',
  recipe: `${source}/recipe.mjs`, rendererFingerprint: hash(JSON.stringify(manifest.runtime)),
  transparentMaster: `${target}-art.svg`, svgSha256: hash(art),
  displayVector: `/${target.replace(/^public\//, '')}.svg`,
  cover: `/${target.replace(/^public\//, '')}.webp`,
  width: 3072, height: 2304, aspectRatio: '4:3', squareArtViewport: [64, 0, 384, 384],
  background, outline: colors.paper.hex, highlight: colors.cream.hex,
  stroke: 1.6, neutralBoundsExtent: extent,
  encoding: 'SVG on the page; lossless 3072 × 2304 sRGB WebP for social metadata.',
  checks: 'Runtime hashes, recipe assertions, vector-only export and padded square bounds passed.',
}, null, 2) + '\n');
console.log(`${slug}: ${themes[slug]}, vector cover and lossless 3072 × 2304 WebP.`);
