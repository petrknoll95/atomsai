# Recognizable illustration series — final browser review

Reviewed the final local preview at `http://127.0.0.1:3001` after the seventh revised asset (the autonomy dial) landed. This report supersedes the v2 visual findings for concepts and line weight.

The seven subjects read distinctly at the actual thumbnail sizes: an open envelope and document, an empty chair, a house receiving a message, a clock and envelope, a cable plug and matching socket, a clipboard checklist, and an adjustable dial. No artwork defect requiring another revision was found in the tested placements.

## Browser evidence

Checked `/blog` and representative article routes for the plug, clipboard, and after-hours clock at 1440 px / DPR 2, 390 px / DPR 1, and 320 px / DPR 1. These 12 page/viewport combinations returned HTTP 200. All 57 main-content image instances decoded, loaded direct SVG URLs, used `object-fit: contain`, and measured 4:3 within 0.001 tolerance. All seven unique SVGs were self-contained vectors; source hashes matched the final local files throughout the run. No browser page errors, missing artwork, image stretching, document overflow, or main-content horizontal overflow occurred. Technical and Insights filters retained their expected article titles and loaded covers.

| Placement | 1440 px / DPR 2 | 390 px / DPR 1 | 320 px / DPR 1 |
| --- | --- | --- | --- |
| Index featured | 848 × 636 | 350 × 262.5 | 280 × 210 |
| Index cards | approximately 413.33 × 310 | 350 × 262.5 | 280 × 210 |
| Article hero | 675 × 506.25 | 350 × 262.5 | 280 × 210 |
| Recommendations | 424 × 318 | 350 × 262.5 | 280 × 210 |

## Visual findings

Inspected the full desktop DPR 2 grid, all seven thumbnail captures at 390 and 320, the plug and clipboard heroes at desktop DPR 2 and the smallest mobile size, the clock hero at 390, and mobile article recommendations. The subjects remain fully inside their cards, with clear space around their silhouettes. Tags occupy the lower margin without covering drawings. The page's existing floating feedback control is visible in some element screenshots, in the card margin rather than over the illustration.

The user's requested reduction from 1.9 to 1.6 SVG units is present on all seven assets. At the narrowest 280 px cover this is intentionally 0.875 CSS px. The fine linework remains visually readable at DPR 1: the chair legs and back separate, the socket opening and cable remain visible, the clipboard's three boxes and two checks can be read, and the dial's control and stops remain distinct. This is a visual approval of the requested finer treatment, not a claim that every line is at least 1 CSS px.

The 3D relationships remain coherent in the displayed views. The chair's legs meet the seat and the back supports attach; the envelope contains the emerging sheet; the house retains a consistent roof and walls; the clock has a readable face and hands. The plug's tongue aligns with the recessed socket, its cable starts at the strain relief, and the clipboard clip sits on its paper and board. The dial reads as a raised control on a solid base. No floating joints or unintended highlight projection across adjacent parts was observed. In particular, the chair seat highlight stays off its rear support, and the clipboard's selected checkbox does not paint over the clip.

The four approved backgrounds and Paper/Cream line and gradient treatment remain consistent. SVG rendering avoids raster undersampling at both tested densities. No color seams, accidental halos, clipped geometry, or loss of recognition was visible in the final page captures.

## Files

`results.json` records URLs, source hashes, geometry measurements, SVG stroke values, effective CSS stroke widths, loading status, and filter results. `check.mjs` reproduces the scoped audit. `grid-1440-dpr2.png`, `thumbnail-sheet-390-dpr1.png`, `thumbnail-sheet-320-dpr1.png`, individual thumbnail captures, and the representative hero/cover/recommendation screenshots show the final seven assets. `preliminary-results.json` records the initial single-width pass and is not the final audit.

Only this evidence directory was written. No application code, image assets, content maps, or Git state was changed by this review. The browser checks cover the static final page views; multi-angle construction checks remain in the individual recipe review directories.
