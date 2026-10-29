# Split hero and pill header

The user-supplied split-layout screenshot is the composition reference for this revision. The existing AtomsAI copy, fonts, colors, original logo, and animated green slit shader are reused. This replaces the earlier centered particle hero; historical particle-hero captures no longer describe the homepage.

Desktop uses equal panels, with the headline low on the green left panel and supporting copy aligned on the light right panel. The bottom row holds the short introduction on the left and the two existing actions on the right. The inset dark-green pill header persists while scrolling and shares its geometry with the open full-screen menu header.

Responsive choices are inferred from the supplied desktop screenshot: below 768px, the artwork/headline panel stacks above the copy/actions panel. Navigation collapses below 1200px. Existing reduced-motion behavior and keyboard interactions remain supported.

Shared header geometry lives in `src/styles/tokens.css`: `--header-inset`, `--header-top`, `--header-height`, and `--header-padding`. Hero-specific layout stays in `src/components/home/hero.module.css`; menu styling stays in `fullscreen-menu.module.css`.

## Reproduce

Run the development preview on port 3001, then:

```sh
node scripts/split-hero-check.mjs
```

This checks Chromium and WebKit at 13 widths from 320px to 1920px, headline bounds, panel alignment, horizontal overflow, dropdown previews, matching open/closed header controls, Escape focus restoration, normal-motion loading, and fixed-header scrolling. `checks.json` records the measurements; the PNGs capture desktop, mobile, dropdown, and full-screen menu states. Captures use reduced motion for a stable shader frame. These are browser verification captures, not a pixel-exact Figma comparison: this revision is based on the user's composition screenshot.
