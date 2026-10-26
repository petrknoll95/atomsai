import sharp from 'sharp';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Keep original Figma exports. Lossless delivery copies retain the ICC profile.
const report = [];
for (const name of ['industries-BackgroundImage', 'industries-BackgroundImage1', 'industries-BackgroundImage2', 'industries-BackgroundImage3', 'stories-Media']) {
  const source = `public/assets/figma/${name}.png`;
  const output = `public/assets/figma/${name}.webp`;
  await sharp(source).keepMetadata().webp({ lossless: true, effort: 6 }).toFile(output);
  const originalPixels = await sharp(source).removeAlpha().raw().toBuffer();
  const outputPixels = await sharp(output).removeAlpha().raw().toBuffer();
  if (!originalPixels.equals(outputPixels)) throw new Error(`Pixel mismatch: ${name}`);
  const original = await fs.readFile(source), optimized = await fs.readFile(output);
  report.push({ source, output, sourceBytes: original.length, outputBytes: optimized.length, decodedRgbIdentical: true, sourceSha256: createHash('sha256').update(original).digest('hex'), outputSha256: createHash('sha256').update(optimized).digest('hex') });
  for (const width of [512, 1024]) {
    const responsiveOutput = `public/assets/figma/${name}-${width}.webp`;
    await sharp(source).resize({ width, withoutEnlargement: true }).keepMetadata().webp({ lossless: true, effort: 6 }).toFile(responsiveOutput);
    report.push({ source, output: responsiveOutput, width, outputBytes: (await fs.stat(responsiveOutput)).size, transformation: 'Lanczos3 resize; lossless WebP with original ICC profile; used only below 1200px.' });
  }
}
await fs.writeFile('docs/design/optimized-assets.json', JSON.stringify(report, null, 2) + '\n');
console.log('Five full-resolution lossless copies verified pixel-identical; ten responsive derivatives generated.');
