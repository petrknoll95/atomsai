import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async file => JSON.parse(await readFile(path.join(root,file),'utf8'));
const [notes,posts,noteArt,editorialArt,manifest] = await Promise.all([
  json('src/content/client-pages/blog.json'),json('src/content/blog/posts.json'),
  json('src/content/blog/field-note-artwork.json'),json('src/content/blog/editorial-artwork.json'),
  json('docs/design/blog-art-raster-2026-11-17/manifest.json'),
]);
const allNotes = notes.sections.find(section => section.id === 'all').blocks;
const paths = [];
for (const note of allNotes) {
  assert.ok(noteArt[note.title], 'Missing cover: '+note.title);
  paths.push(noteArt[note.title]);
}
assert.ok(noteArt[notes.featured.title], 'Missing featured cover');
for (const post of posts) {
  assert.ok(editorialArt[post.slug], 'Missing article: '+post.slug);
  paths.push(editorialArt[post.slug]);
}
const results = [];
for (const asset of new Set(paths)) {
  assert.match(asset,/^\/assets\/blog\/generated\/[a-z0-9-]+\.webp$/);
  const record = manifest.assets[path.basename(asset,'.webp')];
  assert.ok(record, 'Missing provenance: '+asset);
  assert.equal(record.generator,'image_gen');
  assert.equal(record.status,'selected-for-staging');
  const source = await readFile(path.join(root,record.master));
  assert.equal(createHash('sha256').update(source).digest('hex'),record.sha256,'Master hash changed');
  assert.equal((await sharp(source).metadata()).format,'png','Expected raster PNG master');
  for (const prompt of record.prompts) assert.ok((await readFile(path.join(root,prompt),'utf8')).trim().length > 50,'Missing exact prompt');
  const file = path.join(root,'public',asset);
  const [metadata,info,stats] = await Promise.all([sharp(file).metadata(),stat(file),sharp(file).stats()]);
  assert.equal(metadata.width,1600);
  assert.equal(metadata.height,900);
  assert.equal(metadata.space,'srgb');
  assert.ok(stats.isOpaque, 'Transparent cover');
  assert.ok(info.size < 600000, 'Unexpectedly large image: '+asset);
  const original = await sharp(source).rotate().resize(1600,900,{fit:'cover',position:'centre'}).toColourspace('srgb').removeAlpha().raw().toBuffer();
  const decoded = await sharp(file).removeAlpha().raw().toBuffer();
  assert.equal(decoded.length,original.length);
  let sum=0;for(let i=0;i<decoded.length;i++)sum+=(decoded[i]-original[i])**2;
  const psnr = 10*Math.log10(255**2/(sum/decoded.length));
  assert.ok(psnr>30,'Compression materially degrades master: '+asset);
  results.push({asset,width:metadata.width,height:metadata.height,bytes:info.size,compressionPSNR:Number(psnr.toFixed(2)),source:record.master});
}
console.log(JSON.stringify({currentNotes:allNotes.length,legacyArticles:posts.length,uniqueCovers:results.length,technicalChecks:'passed',aestheticQuality:'Requires visual comparison; not established by this script',assets:results},null,2));
