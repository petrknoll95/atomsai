import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const slug = process.argv[2];
assert(/^[a-z0-9-]+$/.test(slug ?? ''), 'Supply an article slug.');
const source = `docs/design/blog-illustrations-2026-11-17/${slug}`;
const target = `public/assets/blog/illustrations/${slug}`;
const svg = await readFile(path.join(root, source, 'review/neutral-dark.svg'));
const report = JSON.parse(await readFile(path.join(root, source, 'review/report.json'), 'utf8'));
assert.equal(report.mechanicalChecks, 'passed');
assert.equal(report.conceptChecks, 'recipe assertions passed');
assert(!/<(?:image|script|foreignObject|text)\b/i.test(svg.toString()), 'Expected self-contained vector art.');
await mkdir(path.join(root, 'public/assets/blog/illustrations'), { recursive: true });
// Keep the renderer's transparent master byte-identical. Only the raster cover
// receives an editorial background and uniform placement in its wider frame.
await copyFile(path.join(root, source, 'review/neutral-dark.svg'), path.join(root, `${target}.svg`));
const framed = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#10231E"/><svg x="260" y="-90" width="1080" height="1080" viewBox="0 0 384 384">${svg.toString().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</svg></svg>`;
await sharp(Buffer.from(framed)).toColourspace('srgb').webp({ lossless: true }).toFile(path.join(root, `${target}.webp`));
const asset = path.join(root, `${target}.webp`);
const meta = await sharp(asset).metadata();
assert.equal(meta.width, 1600); assert.equal(meta.height, 900);
assert((await sharp(asset).stats()).isOpaque);
await writeFile(path.join(root, source, 'export.json'), JSON.stringify({
  article: slug,
  skill: 'https://petrknoll95.github.io/atoms-ai-brand/skills/atomsai-illustrations/SKILL.md',
  recipe: `${source}/recipe.mjs`,
  rendererFingerprint: report.rendererFingerprint,
  transparentMaster: `${target}.svg`,
  svgSha256: createHash('sha256').update(svg).digest('hex'),
  cover: `/${target.replace(/^public\//, '')}.webp`,
  width: 1600, height: 900, background: '#10231E', encoding: 'lossless WebP, sRGB',
  geometry: 'Unmodified renderer output, uniform 1080px viewport centered in the cover.',
}, null, 2) + '\n');
console.log(`${slug}: exported SVG master and opaque 1600 × 900 cover.`);
