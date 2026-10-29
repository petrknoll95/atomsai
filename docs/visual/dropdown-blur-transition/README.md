# Continuous glass blur during preview transitions

The previous GSAP opacity fade was on the entire product figure. While that ancestor had opacity below 1, it created a backdrop root between the glass and the sibling shader. The blur appeared only when the wrapper returned to full opacity.

Figures and glass surfaces now remain at opacity 1. GSAP independently fades the translucent cream tint (`--preview-reveal`) and foreground content while preserving the existing 300ms motion and visibility cleanup. Reduced motion resolves immediately; interrupted transitions retain their current values.

Run `node scripts/dropdown-blur-transition-check.mjs` against the development preview on port 3001. It samples frames through five product switches in Chromium and WebKit, confirming opaque wrappers and intermediate glass-tint values. It also freezes a surface at half reveal and compares rendered pixels with blur enabled and disabled.

Chromium passes the pixel check. This environment's headless WebKit does not rasterize backdrop blur even in a standalone striped test fixture; the script explicitly probes and records that limitation. WebKit's frame/style and interaction checks pass, but its screenshots cannot verify optical blur. The initial zero-difference result was an engine limitation, not evidence of a Safari-specific product bug.

Additional checks: `node scripts/dropdown-glass-check.mjs`, `node scripts/header-hover-check.mjs`, lint, typecheck, and production build.
