// Strips the iris fills from the trust illustrations, keeping only the line group,
// so the cards can tint them with currentColor through a CSS mask.
// Usage: node scripts/trust-line-art.mjs
import fs from 'node:fs/promises';
for (const name of ['integrations', 'safeguards', 'reliability', 'security']) {
  const svg = await fs.readFile(`public/assets/illustrations/trust-${name}.svg`, 'utf8');
  const open = svg.match(/^<svg[^>]*>/)[0];
  const start = svg.indexOf('<g fill="none" stroke=');
  if (start < 0) throw new Error(`no line group in ${name}`);
  await fs.writeFile(`public/assets/illustrations/trust-${name}-line.svg`, open + svg.slice(start).replace(/stroke="#10231E"/, 'stroke="#000"'));
  console.log(`wrote trust-${name}-line.svg`);
}
