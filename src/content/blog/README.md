# AtomsAI blog content

Imported from https://atomsai.com/resources/blog on 2026-10-29.

The seven source articles retain their titles, summaries, dates, authors, tags, full article bodies, and original cover artwork. Artwork is stored locally in public/assets/blog. Source URLs are recorded in posts.json.

The redesigned blog displays a separate set of minimal editorial covers from public/assets/blog/editorial, mapped in blog-data.ts. The original imported covers remain intact. Regenerate the new SVG and WebP covers with node scripts/generate-blog-artwork.mjs; the generator uses the site's own fonts, slit logo geometry, and palette. SVG lettering is outlined for portability.

Insights and Technical are local browsing categories assigned to the existing articles; the source uses topic tags. The source marks the three older editorial notes as draft content in hidden metadata; this import follows the publicly visible content without changing its publication dates.

Run node scripts/import-atoms-blog.mjs to refresh. The importer allowlists article markup, removes scripts and source styling, rewrites migrated article links to /blog, and leaves unmigrated destinations on atomsai.com.
