# Homepage implementation contract

Reference: Figma pLyUMYhdCUYzwz0UXPtGY8, frame185:3428, 1600×7965.0908203125. Section294:6299 includes unrelated adjacent variants. Original context responses in source/*.txt. Parent owns foundation and integration.

## Shared interfaces and names

- `src/components/ui.tsx` exports `ButtonLink` (href, size?: small|medium|large, variant?: primary|secondary|outline, className?, children) and `Eyebrow` (children,className?). Parent owns.
- `src/styles/tokens.css` maps primitives `--palette-*` to semantic Tailwind v4 `--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-surface`, `--color-surface-muted-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-secondary-foreground`, `--color-border`, `--color-border-subtle`, `--color-control-border`, `--color-ring`.
- Typography: `font-display`, `font-sans`; font-weight-normal425 and medium475; local fonts (exact availability being audited). Display uses `letter-spacing:-.015em; text-box:trim-both cap alphabetic` and regular display file. Shared `.display` class provides family/tracking/trim. Body line-height1.4. Text uses measured size and line height from source.
- `.page-container`: 100% width, horizontal gutter48px at1600, max-width1600px centered. Gutter32 at<=1199px,20 at<=767px. `--page-gutter`, `--section-space`96px desktop/64px narrow, `--grid-gap`32px desktop/24px narrow. Width breakpoints are inferred unless further Figma sources found.
- `.theme-dark`: background#10231e; text#f6f1e8, muted cream60%; primary cream/deep-green; surface cream10%. Default background#fafafa, foreground#27433b, muted green60%, borders green10% and5%, surface#f0f0ec. `.theme-forest`: background#f0f0ec. Do not assume every child matches parent's theme: see Figma overrides.
- Assets: originals downloaded to `public/assets/figma/{section}-{constantNameWithoutImg}.ext` (camel name retained) via parent script. Supplementary full decorative pattern exports will be named descriptively. NEVER render whole UI sections as images. SVG roots retain source dimensions; CSS may scale wrappers when responsive but preserve ratios.
- `.button` sizes: small32px/12px padding/14px type; medium44px/20px/14px; large56px/28px/16px. Gap8 (small6); pill. Keyboard focus 2px+2px offset.
- All section exports named PascalCase, no required props. Semantic section/headings. Use functional details/summary for FAQ; navigation uses verified Figma external URLs or local section anchors; no dead '#' links or fabricated backend. Demo behavior must disclose local preview/no backend where needed.

## Ownership

Coordinator: project config, app/, styles/tokens.css and globals.css, ui.tsx, Hero, Offerings, source/asset downloads, integration and visual scripts.
Assigned lower sections: src/components/home/faq.tsx, closing.tsx and lower.module.css only. Export Faq, Closing (CTA+footer).
Further assignments will specify explicit file ownership; do not modify shared files.

Reference heights: hero960; offerings701; applications903; preview1173; industries1181.09082; stories884; FAQ854; CTA528; footer781. Exact dimensions are verification targets; use natural layout and documented reference sizing where intentional whitespace exceeds content.
