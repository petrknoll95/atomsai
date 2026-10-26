# Smooth scrolling and persistent header

The homepage uses [GSAP ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/) with ScrollTrigger, both from the existing GSAP dependency. The catch-up duration is 0.8 seconds; no parallax or scroll-speed multiplier is applied. Touch-only devices retain native scrolling. Reduced motion disables ScrollSmoother, including preference changes while the page is open.

`src/components/motion/smooth-scroll.tsx` owns the wrapper, plugin lifecycle, local-anchor handling and dialog coordination. `src/lib/page-scroll.ts` centralizes section offsets. The existing header is exported as `SiteHeader` from `hero.tsx` and rendered outside the transformed content so its fixed positioning remains relative to the viewport.

The header keeps its existing 96px desktop / 80px mobile dimensions and has a 90% paper background with the existing blur for legibility over every section. The hero reserves the same height, retaining the original content position. Section destinations leave 16px below the header. These scrolling and header treatments are requested additions, not a new supplied Figma state.

Native modal dialogs pause smoothing and keep their own internal scrolling. The full-screen menu restores the page position on dismissal; menu links use the shared section-navigation function. No carousel behavior is replaced: the existing carousels continue to use Embla.

## Reproduce

```sh
npm run typecheck
npm run lint
npm run build
npm run start -- --port 3001
# In another terminal:
VISUAL_URL=http://127.0.0.1:3001 npm run test:smooth-scroll
VISUAL_URL=http://127.0.0.1:3001 npm run test:fullscreen-menu
VISUAL_URL=http://127.0.0.1:3001 npm run test:interactions
```

[Results](results.json) record actual rendered movement against native scroll position, settled positions, persistent-header geometry, modal scroll locking/restoration, section focus and offsets, deep links, and dynamic reduced motion. Captures alongside the report show the header after scrolling 1200px down the page in Chromium and WebKit at desktop and narrow widths.

All six scrolling cases passed on 2026-10-26: each browser at 1600px, 390px, and 390px with touch emulation. The ten full-screen menu cases and existing page-interaction checks also passed. Type checking, lint, and the production build passed. Touch checks use browser emulation, not physical-device testing.

- [Desktop header after scrolling](chromium-1600-header.png)
- [Narrow header after scrolling](chromium-390-header.png)
- [WebKit touch viewport](webkit-390-touch-header.png)
