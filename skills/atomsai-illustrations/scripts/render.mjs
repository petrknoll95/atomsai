#!/usr/bin/env node
// Trusted local recipes only: a recipe is JavaScript and executes with Node permissions.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import * as geometry from '../runtime/geometry.mjs';
import * as primitives from '../runtime/primitives.mjs';
import { makeScene, fitToReference } from '../runtime/models.mjs';
import { projectScene, frameToSvg } from '../runtime/render.mjs';
import { colors } from '../runtime/colors.mjs';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  assert(['--recipe', '--existing', '--out', '--repo'].includes(key) && process.argv[i + 1], `Unknown or incomplete option: ${key}`);
  args[key.slice(2)] = process.argv[i + 1];
}
assert(args.out && Boolean(args.recipe) !== Boolean(args.existing), 'Usage: node scripts/render.mjs --recipe /absolute/recipe.mjs --out /absolute/output [--repo /absolute/atoms-ai-brand]\nOr use --existing layers instead of --recipe.');
const kit = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(kit, 'assets/reference-manifest.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
for (const [file, expected] of Object.entries(manifest.runtime)) assert.equal(hash(await readFile(resolve(kit, file))), expected, `Runtime drift: ${file}. Regenerate the kit; do not patch the renderer inside it.`);
if (args.repo) {
  for (const [file, expected] of Object.entries(manifest.inputs)) assert.equal(hash(await readFile(resolve(args.repo, file))), expected, `Kit is older than the local source: ${file}. Run node scripts/build-illustration-skill.mjs in the repo, then retry.`);
}

const api = { ...geometry, ...primitives };
let s, reference, title, rawChecks = 'existing gallery scene';
if (args.recipe) {
  const recipe = await import(pathToFileURL(resolve(args.recipe)));
  reference = recipe.reference;
  assert(manifest.gallery.includes(reference), 'Export reference = a current gallery slug from reference-manifest.json. This selects framing, not geometry.');
  assert.equal(typeof recipe.default, 'function', 'Recipe must export default function(api) returning a raw Scene.');
  s = recipe.default(api);
  assert(s?.lines && s?.faces, 'Recipe must return Scene geometry, not SVG or a flattened image.');
  if (recipe.verify) { recipe.verify(s, api, assert); rawChecks = 'recipe assertions passed'; }
  else rawChecks = 'no concept-specific assertions supplied — inspect dimensions, joins and intended symmetry';
  fitToReference(s, reference);
  title = recipe.title ?? 'New illustration';
} else {
  assert(manifest.gallery.includes(args.existing), 'Choose an example actually registered in the gallery.');
  reference = args.existing; title = args.existing; s = makeScene(args.existing);
}
const referenceScene = makeScene(reference);
const out = resolve(args.out);
await mkdir(out, { recursive: true });
const views = [
  { name: 'neutral', yaw: 0, pitch: 0 },
  { name: 'oblique', yaw: .65, pitch: -.35 },
  { name: 'back', yaw: Math.PI, pitch: 0 },
  { name: 'underside', yaw: .55, pitch: -1.1 },
];
const finite = value => {
  if (typeof value === 'number') assert(Number.isFinite(value), 'Non-finite geometry');
  else if (value && typeof value === 'object') for (const child of Object.values(value)) finite(child);
};
finite(s);
assert(s.highlights.length + s.contours.filter(c => c.highlight).length > 0, 'No focal Iris highlight.');
const reports = [], files = [], cells = [];
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const namespace = (svg, prefix) => svg.replace(/id="([^"]+)"/g, `id="${prefix}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
for (const white of [false, true]) {
  const theme = white ? 'light' : 'dark';
  for (const view of views) {
    const start = performance.now();
    const frame = projectScene(s, { ...view, white });
    const projectionMs = performance.now() - start;
    finite(frame);
    const linework = [...frame.front, ...frame.rear, ...frame.accent];
    assert(linework.length, 'Empty projected drawing');
    for (const line of linework) assert.equal(line.width, 1.28, 'Stroke width differs from the shared gallery width');
    if (s.hiddenLines === 'omit') assert.equal(frame.rear.length + frame.rearDots.length, 0, 'Opaque artwork exposes rear linework');
    const points = [...linework.flatMap(line => line.points), ...frame.highlights.flatMap(h => h.points), ...frame.frontDots.map(d => d.point), ...frame.rearDots.map(d => d.point)];
    const maxExtent = Math.max(...points.map(p => Math.max(Math.abs(p[0]), Math.abs(p[1]))));
    assert(maxExtent < 184, 'Drawing reaches the export edge; check arrow size and bounds');
    const svg = frameToSvg(frame);
    assert(!/<(?:image|script|foreignObject)\b|(?:href|src)="https?:/i.test(svg), 'Export has a raster, script or remote dependency');
    assert.equal(svg, frameToSvg(projectScene(s, { ...view, white })), 'Identical views produce different SVGs');
    const filename = `${view.name}-${theme}.svg`;
    await writeFile(resolve(out, filename), svg);
    files.push({ filename, white, svg });
    reports.push({ file: filename, yaw: view.yaw, pitch: view.pitch, boundsExtent: maxExtent, hiddenRuns: frame.rear.length, visibleRuns: frame.front.length, accentRuns: frame.accent.length, projectionMs: +projectionMs.toFixed(2) });
    cells.push({ title: `${view.name} · ${theme}`, svg, white });
  }
}
// Add the existing example at the same viewport and render scale, on both surfaces.
for (const white of [false, true]) cells.push({ title: `Reference: ${reference} · ${white ? 'light' : 'dark'}`, svg: frameToSvg(projectScene(referenceScene, { yaw: 0, pitch: 0, white })), white });
const cols = 4, cellW = 320, cellH = 352, rows = Math.ceil(cells.length / cols);
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cellW}" height="${rows * cellH}" viewBox="0 0 ${cols * cellW} ${rows * cellH}">${cells.map((cell, i) => {
  const x = i % cols * cellW, y = Math.floor(i / cols) * cellH;
  const bg = cell.white ? colors.paper.hex : colors.forestShade.hex, ink = cell.white ? colors.forestShade.hex : colors.paper.hex;
  return `<g transform="translate(${x} ${y})"><rect width="${cellW}" height="${cellH}" fill="${bg}"/>${namespace(cell.svg, `cell${i}`).replace('width="384" height="384"', 'x="10" y="0" width="300" height="300"')}<text x="160" y="328" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${ink}">${escape(cell.title)}</text></g>`;
}).join('')}</svg>`;
await writeFile(resolve(out, 'contact-sheet.svg'), sheet);
await writeFile(resolve(out, 'review.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — illustration review</title><style>body{font:16px system-ui;margin:24px;background:#fff;color:#10231e}h1{font-size:24px}img{width:min(100%,1280px);height:auto}p{max-width:70ch}</style><h1>${escape(title)}</h1><p>Current renderer · reference ${escape(reference)} · dark / light · neutral / oblique / back / underside. Mechanical checks do not prove visual quality.</p><img src="contact-sheet.svg" alt="Multi-view illustration comparison"><p>Inspect silhouette, spacing, Iris fill, hidden lines, connections and holes. Judge the drawing at 300 px viewport / 1 px stroke as well as enlarged. Export files retain transparency.</p></html>`);
let png = false;
try {
  const loadModule = createRequire(resolve(args.repo ?? kit, 'package.json'));
  const sharp = loadModule('sharp');
  await sharp(Buffer.from(sheet)).png().toFile(resolve(out, 'contact-sheet.png'));
  for (const file of files) await sharp(Buffer.from(file.svg)).resize(2000, 2000).png().toFile(resolve(out, file.filename.replace('.svg', '.png')));
  png = true;
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}
await writeFile(resolve(out, 'report.json'), JSON.stringify({
  title, reference, rendererFingerprint: hash(JSON.stringify(manifest.runtime)), palette: manifest.palette,
  mechanicalChecks: 'passed', conceptChecks: rawChecks, visualReview: 'required; inspect contact sheet and record findings before delivery',
  hiddenMode: s.hiddenLines ?? '35%', primitiveCounts: s.primitiveCounts, views: reports,
  png: png ? 'generated with sharp' : 'not generated: view review.html in a browser, or provide --repo with installed sharp',
  timingNote: 'Projection CPU time only; not p5 interaction frame rate.',
}, null, 2) + '\n');
console.log(`Checked 8 views and exported SVG${png ? '/PNG' : ''}, contact-sheet.svg, review.html and report.json to ${out}. Visual review still required.`);
