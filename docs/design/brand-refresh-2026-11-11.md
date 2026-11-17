# Homepage brand alignment — 11 November 2026

Source: `atoms-ai-brand` commit `3f1b08b`, checked against origin/main.

- Screen palette comes from `src/data/colors.ts` (sRGB). Existing surface aliases remain derived tints; Iris aliases resolve to the updated Iris family.
- Patterns retain their existing masks and motion. `brand-colors.ts` maps the original palette into updated sRGB colors expressed in the renderer’s encoded P3 space.
- Illustration paths and motion modules in `public/assets/hairline` are unchanged. The appearance layer adds silhouette-following Iris fades, monochrome outlines and a single 35% occlusion pass. Static homepage fallbacks were exported from the same rendered paths.
- PyAI’s logo is the official icon from `https://pyai.com/favicon.svg`, retrieved 11 November 2026. The playground composition is illustrative, not a connected live console.

Validated: production build, TypeScript, changed-file lint, desktop/mobile rendering, no hydration errors or horizontal overflow. Existing geometry modules have no diff.
