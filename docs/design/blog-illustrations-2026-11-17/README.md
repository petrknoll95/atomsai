# Published article illustrations — revised 2026-11-17

Seven custom covers for the seven real articles in the [AtomsAI subscription feed](https://atomsai.com/resources/blog/subscribe). The SaaS Labs artwork file is unchanged. The current result is shown in `contact-sheet-4x3-v2.png`; `page-qa-v2/` contains the current browser evidence. Files without the v2 suffix record the earlier Forest/Iris treatment and its review, not the final colors or framing.

The user's revision supersedes the linked Illustration Skill's default colors: alternate Forest Green `#43695B`, Deep Green `#1D3C34`, Iris `#A77BCA`, and Orange `#FF671F` backgrounds, with Paper `#FAFAFA` outlines and Cream `#F6F1E8` highlight fades. Every live image frame is always 4:3. The illustration sits in a centered, padded 1:1 area, with its geometry and shared vertices preserved. Speed-to-lead was redesigned as three positions on an open circular track; evaluation was redesigned as a spherical specimen in a fixed measuring fixture.

`src/content/blog/illustration-themes.json` assigns the backgrounds. `scripts/export-blog-illustration.mjs` loads the editable scene recipe, verifies the bundled renderer hashes and the recipe's geometry assertions, applies the user's palette and a consistent 1.9-unit outline before serialization, and exports:

- `public/assets/blog/illustrations/<slug>.svg`: self-contained 4:3 vector displayed directly on the page, without image optimization or lossy resampling.
- `<slug>-art.svg`: transparent square vector for other formats.
- `<slug>.webp`: lossless 3072 × 2304 sRGB companion for social metadata.

The 384-unit square sits at `(64, 0)` inside the 512 × 384 cover. At the smallest tested 280 px thumbnail width, the outline is 1.04 CSS px. All viewports retain the complete illustration. To reframe for a different aspect ratio, center the transparent square vector using `contain` over its assigned background; `reframing-v2.png` demonstrates 4:3, 1:1, 3:4, and 16:9 placements. The website itself consistently uses 4:3.

The existing `editorial-artwork.json` map keeps the WebP path for metadata. `BlogArt` selects its matching SVG for visible images. This preserves the shared article mapping used by the index, heroes and recommendations. `revision-resolution.md` documents the old width-only raster selection and quality-75 resampling that caused softness.

Regenerate one production cover from the repository root:

```sh
node scripts/export-blog-illustration.mjs <slug>
```

For geometry exploration, the original eight-view renderer remains available without modifying the kit:

```sh
node skills/atomsai-illustrations/scripts/render.mjs --recipe "$PWD/docs/design/blog-illustrations-2026-11-17/<slug>/recipe.mjs" --out "$PWD/docs/design/blog-illustrations-2026-11-17/<slug>/review"
```

That reference renderer deliberately retains its original Iris theme; the production exporter applies the user's new direction. Each article directory has the editable recipe, decisions, geometry review and current `export.json`. Three sub-agents worked on design and browser review. Each replacement was committed separately.

Current asset checks are in `asset-checks-v2.json`. The local preview is http://127.0.0.1:3001/blog. This work was not pushed or deployed.
