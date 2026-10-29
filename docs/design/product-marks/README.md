# Product marks used in Applications

Retrieved from the products' official websites on 2026-10-27. Only the product mark is shown; wordmarks and “by JustCall” endorsements are omitted at the user's request. Original source SVGs are retained in `source/`.

| Product | Official source | Extraction |
| --- | --- | --- |
| JustCall | [Homepage](https://justcall.io/) header inline SVG, `aria-label="JustCall Logo"` | First four filled paths; original mark coordinates retained, viewBox tightened to 24.8293 × 23.9683. Duplicate unfilled paths and lettering omitted. |
| Helpwise | [Official CDN vector](https://cdn.helpwise.io/landingv3/svg/hwlogobyjc.svg), matching the [homepage](https://helpwise.io/) header's `hwlogobyjc.webp` | Original diamond path and original H path. The white H becomes a transparent cutout through an SVG luminance mask, so the background shows through in both monochrome states. No tracing or redrawing. |
| ServiceAgent | [Homepage](https://serviceagent.ai/) header inline SVG, viewBox `0 0 193 40` | Original mark path, cube group, and alpha mask; lettering omitted. The original facet colors collapse to one silhouette when displayed as a CSS alpha mask. |
| CallPage | [Homepage](https://www.callpage.io/) header inline SVG, viewBox `0 0 481 177` | Original orange circular mark and its internal masks; wordmark and endorsement omitted. ViewBox tightened to the mark bounds. |

Files served by the site live in `public/assets/products/`. They use the original vector path data, without fonts, scripts, or external image dependencies. All four occupy the same 80 × 80 CSS-pixel box, retain their aspect ratio, and are centered with `mask-size: contain`. Their longest visible dimension is approximately 80px; width/height differences reflect the actual mark proportions.

Color is controlled solely by the existing GSAP interaction progress: black at rest, white on hover or keyboard focus, with a grayscale transition. The pattern assignments and card interactions are unchanged. The marks are decorative because each card already identifies its product with a heading.

Verification screenshots and browser results are in `docs/visual/product-marks/`: Chromium and WebKit, idle and hover marks, shared dimensions, keyboard focus and narrow-screen overflow. Build/type checking and lint passed.
