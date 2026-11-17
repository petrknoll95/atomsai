# Raster softness investigation — before vector revision

Read-only evidence collected from the local preview at 1440 and 390 CSS px, with device pixel ratios 1 and 2. Measured actual decoded network responses as well as rendered image boxes; browser `naturalWidth` alone can be density-adjusted and is not enough to diagnose this.

The source WebPs are opaque, lossless 1600 × 900 exports. `BlogArt` serves them through Next Image with `fill`; each grid card supplies a `sizes` value describing its CSS width. The square display uses `object-fit: cover`, so a 16:9 source must scale according to the square's height and crop its sides. The browser chooses responsive image widths using `sizes` without accounting for that extra 16:9 crop factor.

| Actual placement | Optimized response | Available image px / CSS px | Needed |
| --- | --- | --- | --- |
| Desktop 413.33 px square, DPR 1 | 640 × 360 | 0.87 | 1 |
| Desktop 413.33 px square, DPR 2 | 1080 × 608 | 1.47 | 2 |
| Mobile 350 px square, DPR 1 | 640 × 360 | 1.03 | 1 |
| Mobile 350 px square, DPR 2 | 828 × 466 | 1.33 | 2 |
| Desktop 675 × 379.69 hero, DPR 2 | 1600 × 900 | 2.37 | 2 |

The affected square cards therefore upscale an insufficiently sampled raster, even at DPR 1 on desktop. Every optimizer URL also requests quality 75, recompressing the originally lossless illustrations. The wide desktop article hero has adequate pixels, so the problem is strongest in square thumbnails and mobile square placements, rather than a uniformly defective master export.

Serve the self-contained square SVG directly and fit it with `object-fit: contain` inside the colored card. This keeps the real vector geometry and gradients until browser painting, prevents crop-driven image selection mismatch, and removes lossy optimizer recompression. `next/image` may be retained with `unoptimized` for SVGs; the installed Next documentation (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`, SVG section) explicitly recommends that path and notes `.svg` sources automatically skip optimization. No global SVG optimizer setting is necessary.

For composition, retain the 384-unit square viewBox and choose padding consistently; contain displays the whole object even in wide cards. Check actual projected size and stroke after any new fitting/padding, since removing the earlier 1080-in-900 crop magnification changes the artwork's apparent scale. Set background color on the wrapper or a full-viewBox rectangle, so any wide letterbox area uses the same field. The existing transparent SVGs have no raster dependencies and are appropriate sources.

Evidence: `page-qa/resolution.json` records all response URLs, requested sizes, actual network dimensions, CSS boxes, and density calculations. `page-qa/resolution.mjs` reproduces this investigation. No application changes were made. The upcoming vector revision needs separate visual QA.
