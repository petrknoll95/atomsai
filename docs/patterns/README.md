# Procedural AtomsAI patterns

Four reusable React components render the original Figma patterns with **WebGL2 and GLSL ES 3.00**. Open `/patterns` for the interactive studio, or [the offline comparison report](index.html) to inspect all 14 original configurations. They power the seven original homepage placements and three added application hover patterns; see [homepage integration and comparisons](homepage/README.md).

## Technology decision

These are two-dimensional radial-gradient masks with specific compositing and blur behavior. A small, direct WebGL2 pipeline gives control over those operations and leaves a usable shader foundation for later animation. A 3D scene graph would add machinery without helping this geometry. p5.js could host the same shaders but would not resolve the source-specific masking or color-space requirements. Canvas2D and static SVG were useful references, but the chosen implementation keeps the rendering operations in shaders. The renderer uses native WebGL2; GSAP separately handles the homepage application cards' hover composition. The shader language follows the [WebGL2 specification](https://registry.khronos.org/webgl/specs/latest/2.0/).

The renderer evaluates original radial gradients from numeric tables, constructs repeated slit or annulus masks, applies separable Gaussian blur where present, and composites the original color roles. Its textures hold numeric gradient records and generated mask passes, **not pictures of the patterns**. Blocking every image request is part of the browser checks. The optional Figma overlay is a separate comparison image.

The default `Pattern` components still render only when properties or dimensions change, with no animation loop. Temporary GPU targets are released after each still draw; programs are released on unmount. Context restoration redraws the current settings. The separate `MotionPattern` component now retains two final mask textures and animates only their composite; see the [isolated motion studies and verification](motion/README.md). Homepage placements continue to use the still component.

## Components and configuration

```tsx
import {
  DriftPattern,
  OffsetPattern,
  SingleBandPattern,
  ConcentricPattern,
} from '@/components/patterns/pattern';

<DriftPattern count={20} mode="light" style={{ width: 800, height: 800 }} />
<OffsetPattern count={10} style={{ width: 800, height: 800 }} />
<SingleBandPattern count={40} style={{ width: 800, height: 800 }} />
<ConcentricPattern count={29} style={{ width: 800, height: 800 }} />
```

For responsive use, give the parent a definite height or aspect ratio; the canvas fills it by default. Non-square containers use uniform cover scaling and crop rather than stretching the source geometry. `Pattern` is also exported for dynamic `kind` selection.

| Property | Meaning |
| --- | --- |
| `count` | Integer 1–80: slits for the first three families, full rings for Concentric. |
| `mode` | `light` (default) or `dark`, resolving original Forest Light / Forest Dark variables. |
| `colors` | Optional role overrides as encoded Display P3 RGB tuples in the range 0–1. Drift/Offset/Concentric use `base`, `upper`, `lower`, `highlight`, `reflection`; Single band uses `base`, `field1`, `field2`, `field3`, `reflection`, `overlay`, `shade`. These are not sRGB hex values. |
| `colors.reflectionBase` | Backing fill of the additive reflection group, black by default. The homepage's legacy purple Concentric instances retain their nonblack backing. |
| `fit` | `cover` by default; `stretch` preserves the explicitly stretched source instances used on the homepage. |
| `blurScale` | Source effect-size adjustment for resized instances whose blur did not scale with their geometry. Homepage presets supply measured values. |
| `loading` | `eager` by default; `lazy` initializes once the canvas is within 400px of the viewport. Homepage placements use lazy rendering. |
| `rotation` | Clockwise degrees, default 0. |
| `zoom` | Additional cover scale, minimum 1; default 1. |
| `panX`, `panY` | Position within available cropped overflow, −1 to 1; default 0. |
| `className`, `style`, `label` | Layout styling and accessible canvas description. |

The studio has keyboard-operable native parameter controls, source-count presets, a 50% original overlay, and an actual-size view. These are numeric controls, not a carousel. The existing homepage carousel continues to use Embla.

## Original source versus inferred behavior

The visual authority is the [original Patterns section, node 205:12328](https://www.figma.com/design/pLyUMYhdCUYzwz0UXPtGY8/AtomsAI---Website?node-id=205-12328). It was inspected through Figma's original Plugin API on 2026-10-26, including component properties, all child geometry, paint order, masks, effects, variables and modes. No source design was modified. See [source provenance](source/README.md), [variant/export manifest](reference/manifest.json), and the retained scene JSON and extraction scripts in `source/`.

| Family | Source counts verified against exports | Measured construction |
| --- | --- | --- |
| Drift | 5, 10, 20, 40 | Repeated width `840/count`; invariant gradient matrices and stops. |
| Offset | 5, 10, 20, 40 | Same repeated geometry, its own original paints and compositing. |
| Single band | 5, 10, 20, 40 | Same repeated geometry, nested masks, reflection and shade. |
| Concentric | 15, **29** | Original ring pitches 42 and 21; unique per-ring gradient tables. |

All reference viewports are 800×800, cropping 20 units from each side of the 840×840 field. The source exposes density variants, not a numeric slit-count property. The Concentric component description says “30,” but its actual second variant has **29 rings**. The implementation follows inspected geometry.

The brand repository's Canvas2D renderer was audited as a useful earlier implementation, but it uses rounded gradient values and a different rendering/color-space path; its fixed Concentric mask assets do not supply a general procedural generator. The live Figma file takes precedence here. The new data retains 328 distinct gradients and 12,859 unrounded stops, source IDs, original masks and original color variables. It does not silently substitute brand hex colors for the document's Display P3 channels.

Explicit extensions and limits:

- Other linear counts use the measured `840/count` repetition with unchanged source gradients. These additional counts are inferred, not published source variants.
- Concentric 15 and 29 use their exact original per-ring matrices and stops. For other counts, geometry extends the measured pitch relationship (`588/(count−1)`, with a one-ring special case). Alpha profiles interpolate within the two original families by physical radius and pitch; the pitch interpolation clamps outside 21–42. This is a documented design extension, **not recovery of an unknown original authoring algorithm**.
- Only Forest Light and Forest Dark are exposed from the source's five theme modes. The 14 export comparisons cover the original Forest Light settings. Dark uses inspected variable values and is functionally checked, but has no separately exported pixel baseline.
- Rotation, zoom, pan, responsive cover behavior and the 1–80 control range are application decisions. Exact comparisons use default framing and the original dimensions.

## Masking and color findings

The source file uses Display P3. Source gradients and layer compositing are evaluated in that encoded space, then the result is explicitly converted to sRGB for a consistent browser canvas and screenshot path. An 8-bit P3 quantization step before conversion matches the source export's precision. Wide-gamut colors outside sRGB are clipped for this presentation path; this is not a wide-gamut output mode.

Drift and Single band retain the measured layer blur radius `1.8899998664855957`; Offset and Concentric have none. The shader uses a separable Gaussian reconstruction. Single band's field layers are grouped before the global mask is applied. Its final Shade luminance mask has no opaque backing: an isolated original export confirmed the effective squared-alpha behavior. Concentric's grayscale reflection is an **alpha mask** with opaque gradient alpha and node opacity 0.2, so its gray RGB levels do not modulate opacity. Preserving these unusual details materially improved the match.

The standard path uses floating-point intermediate mask targets. Unblurred families skip the two blur passes and their temporary targets. Unchanged dimensions and options skip redundant redraws. A reduced-precision RGBA8 fallback exists if `EXT_color_buffer_float` is unavailable, but that fallback has not been validated against the pixel baselines. WebGL2 failure produces an explicit visible error rather than substituting a raster image. Device pixel ratio is capped at 2 and mask-field resolution at 2048 pixels; the audited exact-size fixture uses DPR 1.

## Visual evidence and remaining differences

The production build was captured with Playwright in **Chromium and WebKit**, for **28 comparisons** covering all 14 original configurations. Every capture is 800×800 at DPR 1, aligned at (0,0). Both images are converted to sRGB for comparison. There is no resizing, registration correction, filtering or blur of the evidence. Overlays use 50% opacity; difference images amplify absolute channel error 8×.

The final mean absolute channel error is **0.5451–0.7764 on a 0–255 scale**. In every comparison, the 99th-percentile maximum pixel-channel error is 3. The worst individual channel difference is 9 at a few Concentric edge pixels. Residual differences remain in gradient quantization, blur reconstruction and edge rasterization; **the output is not pixel-identical**. Geometry and source gradient data are retained exactly for the published configurations, subject to the documented negligible Single band source-position float difference.

The regression script fails above a mean error of 1/255 or when more than 0.01% of pixels differ by more than 8 in any channel. Those are regression tolerances, not a claim of exact equality.

- [Offline comparison viewer](index.html): switch original, shader, aligned overlay and amplified difference for each count and browser.
- [Machine-readable visual results](results.json): measurements, original Figma IDs, source image SHA-256 hashes and capture geometry.
- [Interaction results](interactions.json): count, palette, crop, reset, idle stability, image-independent rendering and context restoration in both browsers; no page overflow at 1440, 768, 390 or 320 pixels.
- [Desktop studio capture](studio-desktop.png) and [mobile studio capture](studio-mobile.png).

TypeScript, ESLint and the production build pass. The production dependency audit reports no known vulnerabilities. Original-source coverage and numerical integrity checks are retained in `source/*validation.json`.

## Reproduce

From the repository root:

```sh
npm ci
npx playwright install chromium webkit
npm run typecheck
npm run lint
npm run build
npm run start -- --port 3001
```

In another terminal:

```sh
VISUAL_URL=http://127.0.0.1:3001 npm run visual:patterns
VISUAL_URL=http://127.0.0.1:3001 npm run test:patterns
```

The visual command regenerates `rendered/`, `comparison/`, `results.json` and `index.html`. The interaction command regenerates `interactions.json`. The exact fixture is `/patterns/render?kind=concentric&count=29&size=800`; it also accepts `mode`, `rotation`, `zoom`, `panX` and `panY`.

## File ownership and organization

- `src/components/patterns/source-data.ts`: exact, generated Figma records and palettes. Preserve source values and IDs; do not hand-normalize them.
- `types.ts`, `model.ts`, `concentric.ts`: public options and numerical scene construction. Inferred Concentric behavior is isolated from published source presets.
- `shaders.ts`, `renderer.ts`: mask, blur and compositing programs; WebGL resource lifecycle and presentation.
- `pattern.tsx`: reusable React canvas lifecycle and four named components.
- `pattern-lab.tsx`, `pattern-lab.module.css`: studio controls and layout only.
- `home-pattern.tsx`, `home-pattern.module.css`: seven measured homepage placements plus three documented hover assignments, their colors, crop and effect-size overrides, shared by the actual page and comparison fixture.
- `src/app/patterns/`: studio and isolated render fixture, both excluded from indexing.
- `docs/patterns/source/`, `reference/`, `rendered/`, `comparison/`: original structural evidence, original exports, browser output and reproducible comparisons respectively.
- `public/pattern-references/`: local copies used only by the studio's optional comparison overlay.

Pattern color-role names describe their original compositing role and remain separate from homepage CSS tokens. The studio reuses the homepage's fonts and semantic theme variables. Motion-specific behavior is isolated in `motion-pattern.tsx`, `motion-presets.ts`, and the dedicated `/patterns/motion` page.
