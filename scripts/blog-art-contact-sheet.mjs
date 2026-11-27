import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const maps = await Promise.all(['field-note-artwork','editorial-artwork'].map(async name => JSON.parse(await readFile(path.join(root, `src/content/blog/${name}.json`), 'utf8'))));
const assets = [...new Set(maps.flatMap(map => Object.values(map)))];
const out = path.join(root, 'docs/design/blog-art-raster-2026-11-17');
await mkdir(out, { recursive:true });
for (const square of [false,true]) {
  const width = 320, imageHeight = square ? 320 : 180, height = imageHeight + 36;
  const cols = 4, composites = [];
  for (const [index,asset] of assets.entries()) {
    const name = path.basename(asset,'.webp');
    const left = index % cols * width, top = Math.floor(index / cols) * height;
    composites.push({ input: await sharp(path.join(root,'public',asset)).resize(width,imageHeight,{fit:'cover'}).png().toBuffer(), left, top });
    composites.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="36"><rect width="320" height="36" fill="#FAFAFA"/><text x="12" y="23" font-family="sans-serif" font-size="13" fill="#1D3C34">${name}</text></svg>`), left, top:top+imageHeight });
  }
  await sharp({create:{width:cols*width,height:Math.ceil(assets.length/cols)*height,channels:3,background:'#FAFAFA'}}).composite(composites).png().toFile(path.join(out,square?'contact-sheet-square.png':'contact-sheet-wide.png'));
}
console.log(`Rendered ${assets.length} covers in wide and square contact sheets.`);
