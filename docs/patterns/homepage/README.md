# Homepage shader integration

All homepage gradient-pattern applications use the same procedural WebGL2 components as the studio. The original seven placements now have three additional [application hover patterns](../application-hover/README.md). There are ten active canvases in Chromium and eleven in WebKit after scrolling the full page, where the chat glass requires a separately blurred copy of its backdrop. No homepage pattern PNG is loaded, including through CSS.

The hero dot field, icons, logos and the offering cards' independent color-burn masks remain original SVG artwork. They are not members of the four gradient-pattern families. The industry carousel remains Embla.

## Source mapping

| Homepage placement | Procedural configuration | Original composition preserved |
| --- | --- | --- |
| Applications offering | Drift, 5 slits, Forest Dark | Stretched 480.003×553 source; layer blur remains 1.89px. |
| Models offering | Concentric, 15 rings, Forest Dark | 553×553 canvas at x=−36.66796875 inside the 480×553 crop. |
| AI Services offering | Single band, 5 slits, Forest Dark | Stretched 480.003×553 source; layer blur remains 1.89px. |
| ServiceAgent circle | Concentric, 15 rings, legacy iris colors | 352×352 with circular clipping. |
| Voice preview | Drift, **1 slit**, Forest Dark | Stretched 992×640 source, centered in the responsive widget; source blur 2.3435997963px. |
| Property advisor | Concentric, 15 rings, legacy iris colors | 800×800 source at (−160,−80) inside a 480×640 viewport. |
| Closing CTA | Offset, 20 slits, Iris Light | 720×720 rotated −90°, centered in a 720×368 crop. |

[Exact source evidence](../homepage-source.json) and [the source audit](../homepage-source.md) retain IDs, component variants, resolved colors, effects, matrices, crop dimensions and gradient comparisons. The coordinating agent independently checked the original CTA transform, legacy reflection fill and the two different blur behaviors through the original Figma API.

The older Concentric instances have the same geometry and gradients as the current 15-ring component, with float differences no larger than 5.96e−8. Their direct colors are intentional overrides: notably the older D8CDE5 highlight and the nonblack iris-shade reflection backing. Applying the current Iris theme wholesale would change their appearance. The new `reflectionBase` role preserves that backing's original normal blend before the reflection group's additive blend.

The visible source is cropped before responsive cover scaling. The voice keeps its existing fixed 992×640 artwork box, and the WebKit chat duplicate remains aligned with the full widget, even when the glass is narrower. Tiny source transforms below a thousandth of a pixel are recorded; the runtime uses their equivalent nominal dimensions except the visibly relevant Concentric offering offset. Stretched masks preserve isotropic blur using the original effect sizes. Mobile cover behavior is an implementation assumption inherited from the existing homepage, not a supplied mobile Figma variant.

## Verification

Open [the comparison viewer](index.html) to switch between original export, shader output, 50% overlay and amplified difference for every placement in Chromium and WebKit. Every comparison uses the original crop dimensions at DPR 1, without alignment correction, resampling or filtering. The original exports include their parent clipping/background at rounded corners; the fixture reproduces those backgrounds.

The final comparisons have approximately **0.51–0.72 mean absolute channel error on a 0–255 scale**. The images are not pixel-identical. Small gradient/edge rasterization differences remain, particularly in the rotated CTA and circular clipping. The regression limit is mean error 1.5 and at most 0.1% of pixels with any channel error above 32; these are documented tolerances, not claims of equality.

- [Crop comparison results](results.json), [source exports](reference/) and [browser captures](rendered/).
- [Homepage integration checks](integration-checks.json): both browsers at 1600, 1200, 768, 390 and 320px; lazy activation, all placements, decorative semantics, zero legacy-pattern requests, no overflow or WebGL context loss, and WebKit backdrop alignment.
- [Retina checks](retina-checks.json): Chromium and WebKit at 1600 and 390px, DPR 2, including all four application patterns. All ten/eleven active canvases rendered without context loss or browser errors. Physical mobile GPU memory and sustained animation performance are not measured by this check.
- Full-page captures: [Chromium desktop](integrated-chromium-1600.png), [Chromium mobile](integrated-chromium-390.png), [WebKit desktop](integrated-webkit-1600.png), [WebKit mobile](integrated-webkit-390.png).
- [Full homepage versus Figma](../../visual/index.html), including unchanged section geometry and relevant interaction checks.
- The studio's [28 original preset comparisons](../results.json) and [interaction checks](../interactions.json) also run after the shared renderer changes.

The page draws stills only when needed. Canvases initialize near the viewport, unchanged size/options skip redraws, and unblurred patterns skip two intermediate passes. A hidden Chromium chat fallback never initializes WebGL. Temporary render targets are released after every draw. GSAP animates the application cards' wrapper compositing; the shader stills do not acquire a continuous rendering loop.

## Reproduce

Build and serve the app, then run:

```sh
npm run typecheck
npm run lint
npm run build
npm run start -- --port 3001
```

In another terminal:

```sh
VISUAL_URL=http://127.0.0.1:3001 npm run visual:home-patterns
VISUAL_URL=http://127.0.0.1:3001 npm run test:home-patterns
VISUAL_URL=http://127.0.0.1:3001 VISUAL_DPR=2 npm run test:home-patterns
VISUAL_URL=http://127.0.0.1:3001 npm run visual:patterns
VISUAL_URL=http://127.0.0.1:3001 npm run test:patterns
VISUAL_URL=http://127.0.0.1:3001 npm run visual
VISUAL_URL=http://127.0.0.1:3001 npm run test:interactions
VISUAL_URL=http://127.0.0.1:3001 npm run test:browsers
```

The crop fixture uses the exact production component: `/patterns/render?application=preview-concentric`. The full-page capture helpers visit lazy canvases before taking screenshots. Original static exports remain available as source evidence, and are blocked by the homepage integration test to prove they are not rendering the patterns.
