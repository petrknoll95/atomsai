# AtomsAI blog content

Imported from https://atomsai.com/resources/blog on 2026-10-29.

The seven source articles retain their titles, summaries, dates, authors, tags and full article bodies. Original imported cover files remain preserved locally in public/assets/blog. Source URLs are recorded in posts.json.

The current blog index uses the ten field notes in `src/content/client-pages/blog.json`. `field-note-artwork.json` maps their exact titles to cover files. Only titles and summaries exist for these notes; do not invent full articles or destinations. The seven imported articles remain available at `/blog/[slug]`; `editorial-artwork.json` maps their covers for article heroes, recommendations and social metadata. Related subjects may intentionally share a cover across collections.

Create new art with `skills/atoms-blog-art/SKILL.md`. Use built-in image_gen for original raster artwork, retaining PNG masters and exporting 1600 × 900 sRGB WebPs to `public/assets/blog/generated`. The direction is flat editorial graphic collage with the current Forest/Cream/Iris palette, contrasting surface treatments and restrained fine detail. Natural shaded colors are valid. The prior SVG direction and generic gradient/ribbon raster pilots were rejected; do not reuse them as style baselines.

Exact prompts, source images, decisions, manifest and page screenshots belong in `docs/design/blog-art-raster-2026-11-17`. The old `docs/design/blog-art-2026-11-17` is explicitly superseded; its self-assigned scores do not establish quality.

Run `node scripts/check-blog-art.mjs` to validate coverage, raster provenance, opacity, dimensions, file sizes and compression fidelity. It does not certify aesthetics. Run `node scripts/blog-art-contact-sheet.mjs` to inspect wide and square crops together. For export only, run the skill's `scripts/prepare-cover.mjs source.png output-stem` from this project. Compare artwork against the actual reference covers and current palette, then inspect desktop/mobile layouts and filters.

The original imported artwork and previous typographic series remain intact. The old `scripts/generate-blog-artwork.mjs` requires `--legacy` and only rebuilds the archived series; it cannot overwrite either live artwork map.

Insights and Technical are local browsing categories assigned to the existing articles; the source uses topic tags. The source marks the three older editorial notes as draft content in hidden metadata; this import follows the publicly visible content without changing its publication dates.

Run node scripts/import-atoms-blog.mjs to refresh. The importer allowlists article markup, removes scripts and source styling, rewrites migrated article links to /blog, and leaves unmigrated destinations on atomsai.com.
