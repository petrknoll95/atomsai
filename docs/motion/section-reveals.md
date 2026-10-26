# Section reveal system

The homepage uses one shared GSAP controller in [SectionReveals](../../src/components/motion/section-reveals.tsx), wrapping the existing page root without adding another layout wrapper. Page sections remain server-composed.

The controller discovers the nine outer `section`/`footer` elements. Each below-fold section fades from 0 to 1 once, over **700ms** with **power2.out**, when it enters the upper **85% of the viewport**. Native IntersectionObserver detects entry and automatically accounts for font loading, FAQ expansion and layout changes; GSAP performs the opacity tween. Viewport resizing updates the entry boundary. No scrolling, pinning or movement is introduced.

The duration, easing and entry point are implementation choices centralized in `sectionRevealSettings`. Add `data-reveal="off"` to a section to opt it out. Nested sections are excluded to prevent double fades. Other component animations, including application hover and Embla, keep their own independent state.

Content already visible on initial load, or above a restored scroll position, stays visible. A section is never hidden again after its reveal starts. Focus and hash navigation reveal their target immediately. The final tween clears its inline opacity, preserving the original rendering and stacking behavior.

Server HTML remains visible without JavaScript or IntersectionObserver. Initial and live reduced-motion preferences bypass fades without changing scroll position. Print styles show all sections. A scoped GSAP context, observers, resize scheduling and event listeners are cleaned up on unmount and preference changes; no global animation cleanup affects other components.

## Verification

```sh
npm run typecheck
npm run lint
npm run build
# With a server containing the latest source running:
VISUAL_URL=http://127.0.0.1:3000 node scripts/section-reveal-check.mjs
```

The browser check covers Chromium and WebKit: intermediate fade frames, unchanged geometry, one-time reveals, focus, hash navigation, printing, initial/live reduced motion, preserved scroll position, responsive widths, the footer, and the no-JavaScript fallback. Evidence is saved in [results.json](section-reveals/results.json), with [Chromium](section-reveals/chromium-revealed.png) and [WebKit](section-reveals/webkit-revealed.png) full-page captures.

Verified on 26 October 2026: both browsers passed all eight check groups with no page errors, including widths of 1600, 1200, 768, 390 and 320px. Type checking, lint and the production build passed. The test waits for actual shader readiness before checking the final fade state, so software WebGL compilation is not mistaken for an animation failure.

Validation uses a separate production snapshot on port 3042 so the existing preview and other ongoing work are not interrupted. That snapshot was built with Next's supported Webpack build option; the repository's build configuration is unchanged.
