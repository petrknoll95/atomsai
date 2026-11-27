# Revised vector artwork QA — 2026-11-17

Reviewed the final local preview at `http://127.0.0.1:3001`. This report supersedes the earlier `page-qa` raster/crop measurements. The user's latest requirement is 4:3 at every placement and breakpoint.

Ran `/blog` and all seven canonical article routes at widths 1440, 390 and 320, device pixel ratio 1. All 24 page/viewport combinations returned HTTP 200, all 105 main-content image instances decoded, and every one loads a direct `/assets/blog/illustrations/*.svg` URL. None uses `/_next/image`, a raster `srcset`, or the old abstract cover paths. All images use `object-fit: contain` and measure 4:3 within 0.001 ratio tolerance. No page errors or document horizontal overflow occurred. Technical and Insights filter results still show the expected canonical articles and loaded artwork.

Also reviewed the index and after-hours article at DPR 2 at widths 1440, 390, 768 and 1101. All 44 additional image instances loaded direct SVGs, retained 4:3 and had no document overflow. Desktop and mobile DPR 2 screenshots record the final artwork at device resolution, including the full grid and article cover/recommendations. The prior crop-driven raster undersampling and quality-75 optimizer recompression are absent.

| Placement | 1440 px screen | 390 px screen | 320 px screen |
| --- | --- | --- | --- |
| Index featured | 848 × 636 | 350 × 262.5 | 280 × 210 |
| Index cards | 413.33 × 310 | 350 × 262.5 | 280 × 210 |
| Article hero | 675 × 506.25 | 350 × 262.5 | 280 × 210 |
| Recommendations | 424 × 318 | 350 × 262.5 | 280 × 210 |

At 768 the index feature is 448 × 336, cards 336 × 252, article hero 675 × 506.25 and recommendations 704 × 528. At 1101 the index feature is 670 × 502.5, cards 502.5 × 376.875, article hero 675 × 506.25 and recommendations 335 × 251.25. All remain 4:3. The 1.9-unit outline in the 512-unit-wide SVG viewport yields at least 1.039 CSS px at the smallest tested 280-wide placement.

Visual inspection of the DPR 2 desktop grid, DPR 2 mobile after-hours cover and full 320 px index confirms sharp outlines, smooth gradients, complete uncropped objects and generous clear space. Card tags do not intersect the drawings. The revised sequence visibly alternates Forest, Iris, Orange and Deep Green fields, while retaining light linework. The ring's opening remains clear, the autonomy frame and cube stay complete, and the revised speed/evaluation silhouettes differ from the rectangular scenes around them. No unwanted letterboxing, raster edges, image stretching or missing geometry was visible.

Evidence: `results.json` contains all 24 page checks and actual image URLs, fit, sizes, decoded status, links and filter contents. `density-results.json` holds the DPR 2 and breakpoint checks. `blog-{1440,390,320}.png` and after-hours hero/cover/recommendation screenshots document standard density. The `*-dpr2.png` files document final high-density clarity and sequence. `check.mjs` and `density-check.mjs` reproduce the checks. No application files or Git state were changed by this audit.
