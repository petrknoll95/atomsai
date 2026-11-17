# Final abstract artwork browser QA — 2026-11-17

Checked the local preview at `http://127.0.0.1:3001` after the final autonomy correction was exported and committed. This v4 evidence replaces the literal v3 and earlier abstract/raster screenshots.

Ran the blog index and all seven canonical article routes at desktop 1440 px / DPR 2, mobile 390 px / DPR 1, and mobile 320 px / DPR 1: 24 page checks and 105 main-content image instances. All returned HTTP 200, decoded successfully and used direct SVG URLs with `image/svg+xml`, `object-fit: contain`, and 4:3 frames. No image uses the Next raster optimizer or a raster srcset. No page errors or document horizontal overflow occurred.

Fetched every displayed SVG and compared its SHA-256 with the corresponding current local file. All 105 comparisons matched. `verified-svg-hashes.json` lists the seven verified files; the final corrected autonomy asset has SHA-256 `b3cdf004a241089cf333098ae8168e213f3dab452bd7e2a05e1e66b4a3463680`. No earlier clock, envelope, dial or previous sphere placement appears in this evidence.

All served illustrations are self-contained vectors without embedded raster, text, script or foreignObject content. Every outline uses the requested 1.6-unit width. This gives 1.094 CSS px at a 350-wide mobile frame and 0.875 CSS px at the narrowest 280-wide frame. The finer lines remain visually continuous in the actual DPR 1 thumbnail captures; the latter measurement is below the generic skill's 1 px guideline and reflects the requested thinner treatment rather than raster undersampling.

| Placement | Desktop 1440 | Mobile 390 | Mobile 320 |
| --- | --- | --- | --- |
| Featured | 848 × 636 | 350 × 262.5 | 280 × 210 |
| Grid | 413.33 × 310 | 350 × 262.5 | 280 × 210 |
| Article hero | 675 × 506.25 | 350 × 262.5 | 280 × 210 |
| Recommendations | 424 × 318 | 350 × 262.5 | 280 × 210 |

Inspected the current desktop grid, article covers, mobile thumbnail sheets and recommendation captures. All illustrated objects remain fully inside their cards with surrounding clear space. Apertures, the empty bay and interlocking gaps remain visible; the after-hours conduit retains its open exit and passes through the slab opening. The corrected autonomy sphere now separates from the front cage corner. Paper outlines and Cream gradients stay sharp on the approved varied fields, with no visible cropping, stretching, duplicate raster edge or highlight bleed in the served neutral views. This page audit verifies placement and delivery; the separate eight-view recipe reviews cover rotated geometry.

Technical and Insights filters each returned the expected three non-featured articles at all tested widths, with all their images decoded. The feature remains outside the filter grid as intended.

`results.json` contains page measurements, image URLs/hashes, effective line widths and filter states. Full-page screenshots preserve normal site chrome. Isolated thumbnails, covers, grids and recommendation screenshots temporarily hide only the fixed navigation/feedback controls during capture to avoid screenshot overlays; artwork, dimensions and page layout are unchanged. `thumbnail-sheet-390-dpr1.png` and `thumbnail-sheet-320-dpr1.png` compare the actual rendered mobile thumbnails. `check.mjs` reproduces the audit. No application files, shared documentation or Git state were changed.
