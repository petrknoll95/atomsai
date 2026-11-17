# Published article illustrations — revised 2026-11-17

Seven custom covers for the seven real articles in the [AtomsAI subscription feed](https://atomsai.com/resources/blog/subscribe). The SaaS Labs artwork file is unchanged. The current abstract set is shown in `contact-sheet-4x3-v4.png`; `page-qa-v4/` contains the current browser evidence. Earlier v2 and v3 artifacts are historical and do not represent the current illustrations.

The user's revision supersedes the linked Illustration Skill's default colors: alternate Forest Green `#43695B`, Deep Green `#1D3C34`, Iris `#A77BCA`, and Orange `#FF671F` backgrounds, with Paper `#FAFAFA` outlines and Cream `#F6F1E8` highlight fades. Every live image frame is always 4:3. The illustration sits in a centered, padded 1:1 area, with its geometry and shared vertices preserved. The latest direction makes every concept abstract while preserving coherent 3D relationships and this approved style:

| Article | Current concept |
| --- | --- |
| The quote went out. Then nothing. | One continuous return path, with its returning arm highlighted |
| The reminder went out. The chair stayed empty. | A genuinely empty bay between two occupied positions |
| The homeowner asked three companies at lunch | Three paths sharing a starting line, with one advancing farther |
| The after-hours messages no one sees | An uninterrupted hollow passage through an open boundary |
| The demo was never the hard part | Complementary stepped forms that fit together |
| Write the evals before the prompt | Equal forms on a common reference, with one visibly deviating |
| How much autonomy should an agent have? | An off-center sphere with room to move within an open volume |

`src/content/blog/illustration-themes.json` assigns the backgrounds. `scripts/export-blog-illustration.mjs` loads the editable scene recipe, verifies the bundled renderer hashes and the recipe's geometry assertions, applies the user's palette and a consistent 1.6-unit outline before serialization, and exports:

- `public/assets/blog/illustrations/<slug>.svg`: self-contained 4:3 vector displayed directly on the page, without image optimization or lossy resampling.
- `<slug>-art.svg`: transparent square vector for other formats.
- `<slug>.webp`: lossless 3072 × 2304 sRGB companion for social metadata.

The 384-unit square sits at `(64, 0)` inside the 512 × 384 cover. The user requested slightly thinner linework: 1.6 units instead of 1.9, a 15.8% reduction. At the smallest tested 280 px thumbnail width this is 0.875 CSS px; thumbnail readability is reviewed visually at device pixel ratios 1 and 2 rather than claiming the earlier 1 px minimum. All viewports retain the complete illustration. To reframe for a different aspect ratio, center the transparent square vector using `contain` over its assigned background; `reframing-v2.png` demonstrates 4:3, 1:1, 3:4, and 16:9 placements. The website itself consistently uses 4:3.

The existing `editorial-artwork.json` map keeps the WebP path for metadata. `BlogArt` selects its matching SVG for visible images. This preserves the shared article mapping used by the index, heroes and recommendations. `revision-resolution.md` documents the old width-only raster selection and quality-75 resampling that caused softness.

Regenerate one production cover from the repository root:

```sh
node scripts/export-blog-illustration.mjs <slug>
```

For geometry exploration, the original eight-view renderer remains available without modifying the kit:

```sh
node skills/atomsai-illustrations/scripts/render.mjs --recipe "$PWD/docs/design/blog-illustrations-2026-11-17/<slug>/recipe.mjs" --out "$PWD/docs/design/blog-illustrations-2026-11-17/<slug>/review"
```

That reference renderer deliberately retains its original Iris theme; the production exporter applies the user's new direction. Each article directory has the editable recipe, decisions, geometry review and current `export.json`. Three sub-agents worked on design, independent geometry review and browser review. All seven recipes were reviewed from four orientations on both themes (56 views); assertions check closed surfaces, shared edges, equal dimensions, true openings, clearances and support contact. Geometry corrections included outward-facing surfaces on the return path, a support-edge pivot that keeps the tilted form above its base, and a sphere placement that reads as separate from its enclosure. Highlight surfaces are exposed so their fills do not bleed across other solids. Each replacement was committed separately. `small-thumbnails-v4.png` shows the actual 280 × 210 thumbnail size. Git history preserves the previous concepts.

Current asset checks are in `asset-checks-v4.json`. They compare the approved colors, verify current file hashes, check all eight geometry views and confirm the SVG and 3072 × 2304 raster dimensions. Browser checks in `page-qa-v4/` cover the index and all seven article pages at desktop and mobile sizes. The local preview is http://127.0.0.1:3001/blog. This work was not pushed or deployed.
