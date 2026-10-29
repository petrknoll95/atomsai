# Section-aware header theme

Use `data-theme="light"` or `data-theme="dark"` on full-width page sections. These attributes map to the existing semantic color roles in `src/styles/tokens.css`; legacy `.theme-light` / `.theme-dark` remain supported for component-local surfaces.

The main content declares light, and the closing CTA/footer wrapper declares dark. The header follows the explicit section under the center of its navigation row, using rendered bounds from the existing GSAP ticker so ScrollSmoother, pinned sections, resizing, and restored scroll positions agree. Nested regions override outer ones. Local dark cards/dropdowns do not inadvertently switch the page header.

Header position and theme freeze while the fullscreen menu is open. The header surface stays transparent; separate eased light/dark tint layers crossfade above the progressive blur. All header controls inherit semantic foreground, primary, and focus colors.

Verified in Chromium and WebKit at desktop and 390px widths: footer inversion, returning to light content, fullscreen-menu open/close preserves underlying theme. Captures are in this directory. Typecheck and lint pass.
