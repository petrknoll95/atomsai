# Visual verification

Verified on 26 October 2026 against the production build at `http://127.0.0.1:3001`.

The full-page captures have been refreshed after the [procedural pattern integration](../patterns/homepage/README.md) and [application hover interaction](../patterns/application-hover/README.md). At 1600px the capture hovers ServiceAgent to reproduce the illustrated Figma state; responsive captures show all four cards inactive by default. They also include the previously requested [kinetic carousel](kinetic-carousel/README.md) and [customer-story correction](customer-story-correction/README.md). Those intentional changes account for larger differences from the original source in Industries and Customer stories.

Open [the comparison viewer](index.html) locally to switch between the original Figma export, browser render, 50% overlay and amplified difference. It includes full-page and individual section views, with an actual-pixel option. The [original export](reference/homepage.png), [browser capture](rendered/homepage-1600.png), [overlay](comparison/overlay.png) and [difference](comparison/difference-x4.png) are also ordinary PNG files.

## Reference and method

The visual target is [Figma frame 185:3428](https://www.figma.com/design/pLyUMYhdCUYzwz0UXPtGY8/AtomsAI---Website?node-id=185-3428), inside the linked section 294:6299. Its measured size is **1600 × 7965.0908203125 CSS pixels**; Figma's original export rounds up to **1600 × 7966 pixels**. Chromium was captured at that exact export size with device scale factor 1, fonts and images fully loaded, and reduced motion enabled.

The source uses Display P3. Original exports retain their profiles; numeric image comparisons convert both inputs to sRGB. Images are aligned at their original top-left origin, without resizing, warping, translation or per-section realignment. Overlay opacity is 50%; absolute channel differences are amplified 4× for visibility. The final fractional export row appears in the full images but is excluded from section metrics. Source-derived integer section boundaries are used for both images.

Every measured section height matches the source within **0.013px**, the browser's fractional layout rounding in Industries. The four supplied Applications dropdown states also match their source panel geometry: x 204, y 80, width 736, height 444. Their exports include shadow margins, so comparison crops use the documented source-frame origin rather than adjusting the browser image to fit.

## Results

Mean error below is the average absolute 8-bit RGB channel difference, on a 0–255 scale. The second metric counts pixels where any channel differs by more than 32. These metrics complement the reviewed overlays; they are not a perceptual score or a claim of pixel identity.

| Section | Mean channel error | Pixels with a channel difference >32 |
| --- | ---: | ---: |
| Hero | 0.868 | 0.806% |
| Offerings | 2.899 | 0.184% |
| Applications | 0.562 | 0.596% |
| Preview | 0.831 | 0.536% |
| Industries | 3.480 | 2.882% |
| Customer stories | 2.245 | 0.891% |
| FAQ | 0.593 | 0.678% |
| Closing CTA | 0.842 | 0.126% |
| Footer | 0.590 | 0.672% |

The dropdown states have mean channel errors of 1.382 (ServiceAgent), 1.042 (JustCall), 1.265 (Helpwise), and 1.074 (CallPage). Their report uses a stricter >24 channel threshold and therefore should not be compared directly with the percentage column above.

Machine-readable evidence:

- [Page results and geometry](results.json), including captures at **1600, 1200, 1024, 768, 390 and 320px**. All have matching document and viewport widths, no reported overflowing elements, no broken images and no page errors.
- [Four dropdown comparisons](header-results.json), with original node IDs, export dimensions, crop coordinates and actual panel geometry. Their PNG overlays are in `comparison/header-*-overlay.png`.
- [Keyboard and interaction checks](interactions.json): skip navigation, dropdown focus and dismissal, exclusive FAQ expansion, industry selection, dialog focus restoration, scripted chat at 320px, local anchors and reduced motion.
- [Additional browser checks](browser-checks.json): WebKit at 1600, 390 and 320px; real Chromium touch swipes through Embla with normal and reduced motion. No horizontal overflow, broken assets or runtime errors were recorded.

Type checking, lint and the production build passed. The production dependency audit reported zero known vulnerabilities at verification time. This is targeted page verification, not a full accessibility certification or exhaustive device audit.

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

In another terminal, from the same directory:

```sh
VISUAL_URL=http://127.0.0.1:3001 npm run visual
VISUAL_URL=http://127.0.0.1:3001 npm run visual:header
VISUAL_URL=http://127.0.0.1:3001 npm run test:interactions
VISUAL_URL=http://127.0.0.1:3001 npm run test:browsers
npm audit --omit=dev
```

`npm run visual` visits lazy procedural canvases, then regenerates the captures, overlay/difference files, measurements and offline viewer. Reference PNGs remain unchanged. Browser versions are pinned by the lockfile; OS font rendering and color management can still affect edge pixels. Fresh source exports require access to the original Figma file; retained local exports make the current comparison reproducible without temporary asset URLs.

## Remaining differences and assumptions

- Small text/vector edge differences remain from browser rasterization. The Offerings overlays also retain a diffuse gradient/compositing difference, reflected in their larger mean error. These have not been hidden by shifting or blurring the comparison images.
- Chromium and WebKit use different implementations of the source's linear-burn glass effect. Both preserve live HTML text and controls, now over procedural patterns. Historical empty-panel calibration values are recorded in the brand audit; current integrated evidence is in the full-page images and pattern report. This is a compatibility implementation, not an exact rendering identity across engines.
- The source supplies no responsive homepage frames. Narrow layouts and breakpoints are inferred and checked for wrapping, hierarchy, overflow and usable controls; they cannot be verified against nonexistent source states.
- The customer-stat cards were corrected on 26 October 2026 at the user's request: light-theme foreground/surface colors replace the source's cream-on-paper combination, and “rateon” is corrected to “rate on.” The current source-comparison measurements include this intentional deviation. Focused evidence is in [customer-story correction](customer-story-correction/README.md).
- Property chat is explicitly scripted, voice interaction opens the supplied playground, and additional FAQ answers use navigation/contact guidance. These behaviors were not supplied as functional designs. Cookie Preferences is inactive because this page sets no optional cookies.
- The source font families, axes and weights are verified, but Figma does not expose its font-file checksum. Public web-font licensing was not documented in the supplied materials and remains unverified.

See [design provenance and source conflicts](../design/README.md) for exact token origins, font calibration, assets and the distinction between measured values and inferred decisions.
