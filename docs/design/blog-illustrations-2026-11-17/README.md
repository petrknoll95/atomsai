# Published article illustrations — 2026-11-17

Seven custom covers for the seven real articles in the [AtomsAI subscription feed](https://atomsai.com/resources/blog/subscribe). The user's requested [Illustration Skill](https://petrknoll95.github.io/atoms-ai-brand/skills/atomsai-illustrations/SKILL.md) supersedes the earlier blog-art experiments for this series. The SaaS Labs cover file is unchanged. Article content and migration belong to the separate migration task.

Three sub-agents designed original dimensioned scenes using the supplied renderer and the current brand source. Each illustration has an editable `recipe.mjs`, concept-specific assertions, a decision record, and an eight-view Dark/Light comparison. The complete skill snapshot is stored in `skills/atomsai-illustrations`; its renderer verifies its own source hashes. No generated SVG paths, opacities or gradients were patched after export.

Production assets are `public/assets/blog/illustrations/<article-slug>.svg` (unchanged transparent master) and `.webp` (1600 × 900, opaque Forest shade, lossless sRGB). `src/content/blog/editorial-artwork.json` explicitly maps every article and is shared by the migrated index, article heroes, recommendations and social metadata. Each cover replacement was committed immediately and independently.

To reproduce one cover from the repository root, substitute its slug:

```sh
node skills/atomsai-illustrations/scripts/render.mjs --recipe "$PWD/docs/design/blog-illustrations-2026-11-17/<slug>/recipe.mjs" --out "$PWD/docs/design/blog-illustrations-2026-11-17/<slug>/review"
node scripts/export-blog-illustration.mjs <slug>
```

When the brand source repository is available, pass `--repo /absolute/path/to/atoms-ai-brand` to the first command to verify this snapshot against that source. Detailed regenerated views stay local; the reviewed contact sheets and verification reports are tracked.

All seven exports pass dimension, opacity, source-hash and wide/square crop checks in `asset-checks.json`. `contact-sheet-wide.png` and `contact-sheet-square.png` show the complete set. The largest cover is under 50 KB. Page evidence is in `page-qa/`; the local preview is http://127.0.0.1:3001/blog. This work was not pushed or deployed.

Fine outlines are preserved by square mobile frames for these illustrations and 4:3 frames for small desktop rows/recommendations. Other artwork retains its existing frame. The image geometry and stroke proportions remain unchanged.
