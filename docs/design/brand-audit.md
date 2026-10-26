# Brand source audit

Inspected 26 October 2026. Brand repository: `/Users/petrknoll/Documents/GitHub/atoms-ai-brand`. Homepage target: Figma file `pLyUMYhdCUYzwz0UXPtGY8`, node `294:6299`. The brand repository was inspected without modifications; its existing local modifications were preserved. No `AGENTS.md` was found inside it.

## Source precedence and observed differences

The linked homepage is the visual target. The brand repository supplies shared palette values, original artwork and font assets. Its website theme is a useful historical mapping, not a replacement for current Figma values. `docs/website/tailwind-theme.css:4–11` says it mirrors the website's Library – Design System, but this file was untracked at audit time and differs materially from the live design.

| Role | Live homepage / current Figma inspection | Brand repository website theme | Implementation interpretation |
| --- | --- | --- | --- |
| Background | Paper `#FAFAFA` | Cream `#F6F1E8`, `docs/website/tailwind-theme.css:51` | Preserve the homepage's paper surface. Both are established brand primitives. |
| Muted foreground | Deep green at 60% opacity | Solid forest green `#42665A`, line 53 | Preserve the live alpha value; do not substitute a visually similar solid palette step. |
| Border / subtle border | Deep green at 10% / 5% opacity | Stone / stone at 50%, lines 54–57 | Preserve the live hairlines. |
| Body/interface weights | Normal 425; medium 475; upright `ital` axis 100 | Static normal 400 / medium 500, lines 81–84 | Use the matching variable PP Neue Montreal source where verified below. Merely assigning 425/475 to the static 400/500 files would not interpolate outlines. |
| Display typography | Founders Grotesk Regular | Founders Grotesk Regular and Medium available | Keep the actual regular display face; PP variable weight choices do not imply a variable Founders face. |

The live color/alpha observations above are from the coordinating agent's original Figma variable inspection. Saved original section outputs under `docs/design/source/` independently retain the 425/475 bindings and `fontVariationSettings: '"ital" 100'` on PP Neue Montreal text, for example `source/hero.txt:94`, `source/hero.txt:106`, `source/footer.txt:45`. Figma code fallbacks sometimes omit paint opacity; they must not override the resolved variables.

Other differences requiring care:

- `src/styles/global.css:3–22` defines the **guidelines site's own UI chrome**: white surface, 32px display and 14px annotation text. These are not homepage tokens.
- `src/pages/typography.astro:84–106` describes display at 100% and lead at 130%, but its actual specimens use 80px/90% and 32px/120%. Current homepage text styles take precedence over this generic prose.
- The older `hero-prototype` explicitly targets Concept A `127:5111`, not `294:6299`. Its 60px hero, asymmetric 40/28px gutters, nebula animation and responsive choices are not evidence for the current frame.
- `hero-prototype/src/styles/global.css:47–55` deliberately uses deep green `#27433B` for its dark section; the historical website `forest-dark` mode uses forest shade `#10231E`. Do not conflate those surfaces.
- `docs/website/copy-review.md` contains proposed copy edits. It is not approved replacement text for the linked homepage.

## Measured palette and typography foundations

Canonical palette is `src/data/colors.ts:15–34`; its comment identifies the Brand colors Figma collection. `src/pages/tokens.css.ts` exposes generated variables from this source.

| Group | Primitive values |
| --- | --- |
| Forest | Forest shade `#10231E`; deep green `#27433B`; forest green `#42665A`; sage `#668978`; sage tint `#94AC96`; stone `#C7CDBA`; cream `#F6F1E8` |
| Neutral | Charcoal `#33413D`; graphite `#58625F`; slate `#7E8583`; ash `#A7AAA9`; mist `#D0D1D1`; paper `#FAFAFA` |
| Accent | Iris shade `#493F58`; iris `#8C78B0`; iris tint `#D8CDE5` |
| Monochrome | Black `#000000`; white `#FFFFFF` |

`src/data/colors.ts:114–143` defines Forest, Neutral and Iris conceptual themes. Historical website theme modes are Forest Light/Mid/Dark, Neutral Light/Dark, Iris Light/Dark; not every conceptual theme has a website mode. Only modes used by the homepage should be implemented.

`src/data/fonts.ts:6–17` declares Founders Grotesk and PP Neue Montreal, both Regular 400 and Medium 500, with `font-display: swap`. `src/pages/typography.astro:25–30` assigns Founders to display and PP to running text, captions and interface copy. `src/pages/typography.astro:111–147` specifies sentence case, 90–100% headline leading and −1.5% tracking. These broad rules support, but do not replace, measured homepage styles.

The historical website theme's typography scale (`docs/website/tailwind-theme.css:89–124`) is 12/14/16/18/20px at 140%, 24px at 130%, 30px at 120%, 36px at 100%, 48/60px at 95%, and 72/96/128px at 90%. Its layout comment at lines 126–127 says spacing, radii, containers and breakpoints mirror Tailwind v4 defaults. This is provenance for a naming approach, not permission to guess frame dimensions.

## Font metadata verification

FontTools inspection verified that **all four brand WOFF2 files are static** (`fvar` absent). OS/2 weight classes are exactly 400 and 500. These files therefore cannot render genuine intermediate weights. Their SHA-256 values are:

| File under brand `public/fonts/` | SHA-256 |
| --- | --- |
| `FoundersGrotesk-Regular.woff2` | `d7a5b2e0221f4a9a43c5e60896af3bd9ff8b8c3948f124627600a4190c6cd3a0` |
| `FoundersGrotesk-Medium.woff2` | `e919ac3813007a470022c51ebb6d7c6273359e5b81ec28844ba1a6c8bb0e7f26` |
| `PPNeueMontreal-Regular.woff2` | `5908af4c274bc55f9cdf731629fc71958dc7aa44a0c8efc9e878c91374ef68f8` |
| `PPNeueMontreal-Medium.woff2` | `edd098c9469355613834a4efecd302c4de6002900734eecb8c0b199d74ecb5ba` |

An original variable font is installed at `/Users/petrknoll/Library/Fonts/PPNeueMontreal-Variable.ttf` (403,264 bytes; SHA-256 `7150cc654cb15a7689e58d9d0349c0b1fb89948743df517fedecf3ae204990ff`). Metadata measured from this file:

- Family: PP Neue Montreal; PostScript name: `PPNeueMontreal-Variable`; version `2.200; internal build`.
- `wght` axis: 200–800, default 200. It directly supports the live design's 425 and 475 values.
- `ital` axis: 100–900, default 100. Named upright instances use 100; italic instances use 900. This unusual upright value matches the saved Figma source exactly.
- Named Regular is `wght=450`, Medium is `wght=530`. These names must not be confused with the CSS weight classes of the older static files.
- Units per em 1000; ascender 958, descender −242, line gap 0; cap height 715, x-height 510.

The installed static PP Regular is version 2.000, so the variable is not merely a repackaging of that file. Metrics differ: the variable's `A` advance is 641 at weight425, versus 659 in installed static Regular; `m` is 797 versus791. Matching body line wrapping requires the variable source and a browser comparison, not a blanket font-rasterization allowance.

No variable Founders Grotesk was found in `~/Library/Fonts` or `/Library/Fonts`. Installed Founders Regular/Medium and the brand WOFF2 files are static400/500. Keep Founders Regular where the Figma node specifies Regular. A numeric variable bound elsewhere must not be described as a genuine intermediate Founders outline without source evidence.

Reproduce installed variable inspection with FontTools:

```python
from fontTools.ttLib import TTFont
font = TTFont('/Users/petrknoll/Library/Fonts/PPNeueMontreal-Variable.ttf')
print(font['name'].getDebugName(5))
for axis in font['fvar'].axes:
    print(axis.axisTag, axis.minValue, axis.defaultValue, axis.maxValue)
for instance in font['fvar'].instances:
    print(font['name'].getDebugName(instance.subfamilyNameID), instance.coordinates)
```

Font license grants were not found. `README.md:105–107` identifies both families as commercial and calls for web licenses before public self-hosting. The Founders metadata also contains a foundry-use license string. Local implementation uses available original files; this audit does not verify public deployment licensing.

## Original asset inventory

Paths below are relative to the brand repository.

| Source | Verified use / geometry |
| --- | --- |
| `src/assets/brand/logo/logotype.svg` | Original `currentColor` master; 1132×200 viewBox. |
| `src/assets/brand/logo/mark.svg` | Original symbol; 440×400 viewBox. |
| `src/data/logos.ts:14–25` | Lockup provenance: Figma `1330:27629`; mark220×200, wordmark begins `(280,20)`, cap baseline180. Preserve geometry rather than recreating the wordmark as text. |
| `public/logos/{logotype,symbol}/svg/` | Ready transparent deep-green/cream/black/white exports; `public/logos/manifest.json` records dimensions and checksums. |
| `src/assets/brand/icons/` | 15 original 24px icons: arrows, chevrons, filter, plus, minus, search, close, info. CurrentColor, 1.5px regular stroke, miter joins and butt caps. `src/data/icons.ts:30–34` specifies medium2px. |
| `icon-proposals/svg/` | Additional regular/medium phone, chat, calendar, sparkle, lock, inbox, menu and other icons. `icon-proposals/README.md:3–5` says these are not yet the official brand library; six exist in website Figma. Verify the actual current component before choosing one. |
| `src/assets/brand/illustration/` | Full visibility, built in your stack, compounding outcomes, scale, focus, modular, always on, insight and momentum. Preserve aspect ratio and nonzero viewBox origins. |
| `public/pattern-masks/`, `src/data/patterns.ts` | Original Figma ring masks and measured pattern gradient transforms. Use only if the linked frame actually contains that pattern. |
| `hero-prototype/public/images/` | Original older website Figma logo/menu/chevron-down exports. |
| `hero-prototype/src/data/nebula-01.json` | 3,830 measured points from Concept A node127:4887, center `(1045,439)`, stride `[x,y,angle,anisotropy]`; not the current homepage image. |

## Unverified or inferred decisions

Original palette, artwork geometry, file metadata and the installed variable font axes are measured. The conclusion that the installed PP variable is the appropriate web source is supported by the exact family and unusual `ital=100` match, but Figma does not expose the local font file checksum; browser-to-Figma comparisons remain the final validation. Any responsive behavior absent from the linked frame is an implementation assumption and should be recorded separately. No old prototype behavior, generic brand-site spacing or proposed copy revisions should silently become current homepage requirements.

Follow-up verification: the saved `figma-structure.json` includes actual PP font variation settings `{wght:425, ital:100}` and `{wght:475, ital:100}`, confirming that the original text uses variable outlines. It also confirms Founders Grotesk actual weight400. Preview section `214:13457` resolves to paper `#FAFAFA`, despite the older cream-tint fallback in generated code.

The sound-wave artwork in `public/assets/brand/sound-wave.svg` is copied unchanged from the brand repository's `icon-proposals/svg/atomsai-icon-sound-wave-regular.svg`. A direct read of Figma instance `I273:11009;33:462` confirmed main component `214:13962`, `Icon/24/Regular/sound-wave`; its vector is at `(4,4)`, size16×16, stroke1.5, with paths `M0 5L0 11 M4 2L4 14 M8 0L8 16 M12 3L12 13 M16 6L16 10`. Translating those paths by `(4,4)` matches the packaged original exactly. CSS masking applies the instance's white color without redrawing its geometry.

## Preview glass and responsive verification

A second direct, read-only Figma inspection confirmed the following effects. These nodes do **not** contain a Glass/Lens effect, refraction or depth parameters.

| Original node | Measured appearance | Browser implementation |
| --- | --- | --- |
| Voice pill `214:13601` | 736×320, radius9999, white10%, background blur radius36 | Live HTML over original pattern; white10% and CSS `backdrop-filter: blur(18px)`, matching Figma's generated CSS mapping. |
| Start button `273:11009` | 173×56, radius9999, white10%, background blur radius36 | Original icon and live link; white10%, blur18px. |
| Chat panel `215:14861` | 440×520, radius40, black20% paint with `LINEAR_BURN`, background blur radius64 | Blur32px followed by an SVG color matrix subtracting0.2 from each RGB channel in sRGB. Normal black20% compositing remains the fallback if the filter syntax is unsupported. |
| Message bubbles `215:14519` / `215:14523` | Radius26; paper20%; inner shadow18px, offset0/0, spread0, paper30% | Same measured fill, radius and inset shadow values in CSS. |

Chromium rejects `linear-burn` and `plus-darker` as CSS blend modes. Initial normal black20% compositing made the panel visibly too flat. An isolated browser comparison first confirmed the blur mapping: blur32 had the lowest error among blur0/8/16/24/32/48/64. Further source-based compositing tests established that the Figma paint applies its20% before the burn operation: `output = max(0, backdrop + 0.8 - 1)`, or `max(0, backdrop - 0.2)` per RGB channel. The implementation uses that exact arithmetic with `feColorMatrix`, `color-interpolation-filters="sRGB"`, leaving alpha unchanged. The matrix operates on the backdrop only; text, controls and original avatar remain live HTML/images.

At1600px, mean absolute channel differences in blank panel regions were15.721 for normal black20%,3.258 for the equivalent CSS contrast/brightness chain,0.644 for SVG subtraction in sRGB and13.314 for subtraction in linearRGB. The contrast/brightness chain clips highlights between stages, which the single matrix avoids. The sampled region is x1150–1470, with preview-relative y311–326,478–495,584–603 and712–731; reference pixels are those coordinates plus the section's2564px top. Both comparison inputs were read using Sharp `removeAlpha().raw()`, matching the repository visual-check pipeline. These measurements support the arithmetic and color-interpolation choice, rather than a hand-tuned substitute color. The repository's full-page comparison is the final integrated evidence; no complete UI screenshot is used as a runtime substitute.

The `@supports` condition checks filter syntax, not rendering correctness. Chromium rendering was exercised at desktop and narrow widths; Safari's handling of an SVG URL inside `backdrop-filter` remains unverified. Browsers that reject the syntax retain an ordinary black20% fill and32px blur; they can show a lighter, less saturated panel.

At the 1600px reference width, the Preview section measures exactly1173px: Figma's rounded trimmed heading bounds30px/19px and body22px lines are preserved. At widths1600/1200/768/390/320 the integrated browser showed no horizontal overflow. At320px, a longer submitted message, the scripted-response disclosure, reply, input and send control remain visible inside the panel; the input retains keyboard focus. The send artwork remains24px, with a44px pointer target. Below900px the two demo columns stack, and below600px the application cards stack; these breakpoint decisions are inferred because no matching responsive Figma frame was provided.


## Final compatibility verification (supersedes earlier unverified Safari notes)

The coordinator installed and tested WebKit 27.2. It accepted backdrop-filter syntax but did not render the SVG or standard backdrop effect. The final WebKit branch uses a separately blurred copy of the **original decorative pattern only**, and native plus-darker blending of opaque0.8 gray, with live text/form above it. The same sample regions have0.8563 mean channel error. Responsive pattern dimensions follow the actual widget container. Chromium retains the original backdrop matrix. Both engines explicitly receive `wght` and `ital` font axes because WebKit otherwise rendered the default200 weight when only `ital100` was supplied.
