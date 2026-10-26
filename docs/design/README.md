# Source contract and implementation decisions

Inspected on 26 October 2026. Visual target: [Figma section 294:6299](https://www.figma.com/design/pLyUMYhdCUYzwz0UXPtGY8/AtomsAI---Website?node-id=294-6299). The actual full homepage is frame 185:3428 on page 39:4543, **1600×7965.0908203125**. Adjacent dropdown variants are separate source states, not part of the homepage canvas height.

The target repository was an empty Git repository. The brand repository at `/Users/petrknoll/Documents/GitHub/atoms-ai-brand` was inspected read-only; its existing changes were preserved. The linked homepage takes precedence for page appearance. Brand materials supply shared foundations and original fonts/artwork; the older brand-site theme and hero prototype are not the page specification.

## Original evidence

`figma-structure.json` retains 504 source nodes, 55 component instances with overrides, 158 variables, 19 text styles, all modes, Auto Layout, constraints, dimensions and a responsive-frame inventory. It was read through the Figma Plugin API. `source/*.txt` retains the original design-context responses. The coordinator independently checked the frame, palette/modes, text geometry, FAQ wrapping and document color profile in Figma, reviewed the component implementations, and compared their integrated browser output.

The document uses **DISPLAY_P3**. CSS `color(display-p3 …)` preserves the numeric channels from the source; interpreting those channels as ordinary sRGB hex caused measurable color errors. Exported PNG profiles are retained. `supplemental-assets.json` records decorative exports and their node IDs. `asset-manifest.json` maps original assets to context identifiers; `source/header-dropdown-manifest.json` records the supplied dropdown variants. Some original context URLs expire; packaged assets and reference exports remain local and reproducible.

## Tokens actually used

Palette primitives are raw values. Roles describe how a value is used, and may change inside `.theme-dark`. `@theme` exposes these same roles to Tailwind v4 (`bg-background`, `text-foreground`, `font-display`, etc.). CSS modules consume the variables directly for source-specific geometry. The site follows the explicit page modes, not the device's preferred color scheme.

| Role / primitive | Measured source | Implementation |
| --- | --- | --- |
| Paper, cream, deep green, forest shade | Palette 5:16,5:10,5:5,5:4; channels conventionally written FAFAFA/F6F1E8/27433B/10231E in Figma's P3 document | `--palette-*`; default paper/green, dark forest/cream |
| Muted text and hairlines | Theme 5:24,5:25 and source overrides | Foreground at 60%; borders at 10% and 5%, retaining alpha |
| Secondary surface | Palette 21:181 | Exact float channels 0.922604859/0.922604859/0.894146502; no rounded hex substitution |
| Surface | Palette 247:4667 | Cream tint F0F0EC; Preview explicitly remains paper |
| Iris tint | Palette 5:19 | Live F0EBF5, used for footer badge and dropdown overrides |
| Body / interface type | Typography collection; actual PP `wght 425/475`, `ital 100` | `font-sans`; normal 425 / medium 475 |
| Display type | Actual text nodes specify Founders Grotesk Regular 400 | `font-display`, −1.5% tracking, cap/alphabetic text-box trim |
| Type scale | Display 9xl/6xl/5xl/4xl/3xl; body and label styles | 128/60/48/36/30px display; 18/16/14/12px text roles |
| Leading | 128 at 90%, 60/48 at 95%, 36/30 at 100%; PP 140% | Measured PP boxes use 25/22/20/17px where Figma rounds fractional values |
| Layout | Viewport 1600, Layout and Auto Layout | 48px gutter; 32px grid gap; 96px section space; local exceptions retained |
| Corners and controls | Actual card and button instances | 16px cards, 32px panels, pill controls; 32/44/56px button heights |
| Effects | Original blur/shadow paints | 6px tag/18px glass CSS blur; 32px chat blur; measured shadows and alpha |

Actual values remain in the source JSON; only values needed by this page are exposed as tokens. For example, FAQ's 64/160px vertical padding and CTA's 64px padding are local source measurements, not normalized to the 96px section default. The recurring color/typography roles are shared; miniature dropdown illustration colors remain scoped to that illustration.

## Material conflicts preserved

- Brand website theme uses cream as page background, solid forest green as muted text and stone borders. The live homepage uses paper, deep green at 60% and alpha hairlines.
- Brand static PP fonts are 400/500. The homepage uses a real variable font at 425/475. The installed original `PPNeueMontreal-Variable.ttf` supports the exact axes, including unusual upright `ital 100`; it is packaged locally. Founders remains static 400, except original 500 badges. Font metadata and SHA256 values are in [brand-audit.md](brand-audit.md). Figma does not expose its local font checksum, so exact binary identity cannot be proved.
- Brand iris tint is D8CDE5; live Figma iris tint is F0EBF5. The homepage value wins.
- The generated Preview code's F0F0EC fallback is stale. Original node 214:13457 resolves FAFAFA; the implementation follows the original node.
- Customer-stat cards inherit cream foreground and cream at 10% surfaces over paper in the source. Following the user's readability correction on 26 October 2026, the cards use the existing light-theme foreground/surface roles; previous values use the solid surface-muted-foreground role. Original arrow geometry is retained as a current-color mask. This intentionally corrects the source's low contrast without changing the card layout.
- Source copy includes “rateon” without a space in one statistic. Following the same correction, the card now reads “rate on.”

## Assets, glass and fonts

Original SVGs are used for logos, icons and the hero's dot artwork. The seven original gradient-pattern placements use the procedural WebGL2 components, preserving the original instance colors, count, crop, resize effects and rotation. The user's hover-state clarification adds distinct patterns to the other three application circles; their assignments and GSAP transitions are [documented implementation decisions](../patterns/application-hover/README.md). Raster pattern exports are retained only as comparison evidence. All text, cards, buttons, menus and miniature UI previews are real HTML. See [homepage shader integration](../patterns/homepage/README.md).

Five large photographs have full-resolution lossless WebP delivery copies. Decoded RGB equality is verified against the original PNGs, with ICC metadata retained. Smaller 512/1024px derivatives are used below 1200px; originals are retained. Reproduce with `node scripts/optimize-assets.mjs`; checksums and sizes are in `optimized-assets.json`.

The chat has no Figma lens/refraction effect. Its original black 20% `LINEAR_BURN` paint subtracts 0.2 from each sRGB channel after the measured blur. A single SVG color matrix implements that math without intermediate clipping. Tested WebKit 27.2 accepts the backdrop SVG syntax without rendering it. Its compatibility branch now repeats the same procedural Concentric canvas at full-widget coordinates, with standard blur and native `plus-darker` compositing. It keeps all text and controls as HTML and no longer requests a pattern image. Historical glass calibration and original source parameters are retained in `brand-audit.md`; current browser evidence is in the visual and homepage pattern reports.

PP font metrics use a documented browser calibration: ascent 99.8% / descent 20.2%, preserving the original 120% total em box while shifting baseline 4% of an em. This is an inferred rendering adjustment, not a Figma token. It corrects the small-body baseline difference without altering line boxes, weights, size or tracking. Both `wght` and `ital` are explicit: tested WebKit otherwise ignored the CSS weight when only the unusual `ital` axis was supplied. Font rasterization still differs slightly between engines.

## Responsive and functional assumptions

Only the 1600px homepage and its desktop dropdown states are supplied. The second Homepage section is empty; older mobile components elsewhere are not this page's variants. Breakpoints and mobile arrangements are therefore **inferred**: 32px gutters below 1200, 20px below 768; offer cards stack; applications progress 4→2→1 columns; previews and stories stack; the compact menu replaces desktop navigation; type sizes reduce with hierarchy intact. The content is centered above 1600px.

The industry carousel uses **Embla 8.6** with one fixed-size circle per slide. Its clipping windows open and close continuously with scroll position, preserving the source's 20%/40%/100%/40%/20% resting geometry. Two cycles of the four categories provide seamless looping; the far-right placeholder consequently follows the category order instead of repeating Figma's Healthcare placeholder. Insurance remains the initial state. Swipe, buttons and chooser use Embla's API; reduced motion settles immediately. The source has no carousel transition reactions; interpolation follows the requested kinetic reveal. See the [carousel correction and validation](../visual/kinetic-carousel/README.md). Other industry labels follow the photos and verified page routes; additional descriptive claims are not invented. Story pagination is decorative because only one story was supplied.

The Applications dropdown implements all four supplied previews, accessible by pointer and keyboard focus. Its source “All Applications” action erroneously points to CallPage; this now targets the local Applications section. Other unsupplied menu contents use simple navigation. FAQ initially opens the supplied second answer; the other answers provide navigation/contact guidance. The property preview discloses its scripted nature before accepting input and does not claim live listings. Voice buttons open the original PyAI playground destination. Read Story presents only the supplied quote and statistics.

Link audit found four 404s among routes inferred from Figma layer names: applications, infrastructure, services and help-center. They now point to the local section, PyAI, local offerings and FAQ respectively. Original explicit product/contact/playground links were verified 200. Footer Terms and Privacy and the FAQ Trust Center use verified live [Terms](https://atomsai.com/legal/terms), [Privacy](https://atomsai.com/legal/privacy) and [Trust Center](https://atomsai.com/trust) destinations. Cookie Preferences stays inactive: this page sets no optional cookies. Remaining destination pages are outside this homepage scope. `link-audit.json` records the original audit, including the routes that were subsequently corrected.

Public font-license grants were not present in the source materials; existing commercial originals are used locally. Public deployment licensing remains unverified. No deployment was performed.
