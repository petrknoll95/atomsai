# Header dot → pill

Reference: the user's 6.96-second screen recording, supplied 2026-10-28. Reviewed the complete sequence at quarter-second intervals, then consecutive source frames around the Product → Solutions handoff (2.72–3.32 seconds). `reference-frames.png` is the cropped frame sequence in reading order.

Observed: each inactive link has a leading dot; the dot stays anchored on its left edge while growing horizontally and vertically into a pill. The previous selection contracts concurrently. The reference changes the label color during the expansion.

Implementation: each header link has a 6px cream marker that expands into its 32px-high link pill over 520ms with GSAP `power3.inOut`. These dimensions and duration are adaptations for this header, not claimed source measurements. A clipped duplicate of the label supplies green ink precisely inside the growing cream silhouette, without a low-contrast interval or duplicate accessible name. Both ink layers shift 3px left together. Following the user’s follow-up, arrow indicators are removed. Dropdowns open on pointer entry and close after a 240ms leave delay, allowing travel into their panels. Click, Enter/Space and Escape remain available. Dropdowns retain the pill while open; keyboard focus uses the same state. Reduced motion resolves instantly. Fast pointer reversals continue from the current progress.

Reproduce with the development preview on port 3001:

```sh
node scripts/header-hover-check.mjs
node scripts/header-dot-pill-check.mjs
```

The first checks intermediate/end states, exit, rapid reversals, dropdown persistence, keyboard focus, reduced motion, and browser errors in Chromium and WebKit. The hover check also checks header fit at ten widths from 320px to 1920px. The older split-hero test is superseded by subsequent hero changes and is not required for these header checks. Browser captures and sampled clip geometry are saved alongside this file.
