# Local page QA — 2026-11-17

Read-only Playwright Chromium review of `http://127.0.0.1:3001/blog` and all seven canonical article routes, at widths 1440, 390 and 320, followed by targeted index/article checks at 768 and 1101; device scale factor 1 and reduced motion. This is the local development preview, not a deployed build.

All 24 page/viewport combinations returned HTTP 200. Every inspected main-content image decoded successfully. All 105 inspected image instances used `/assets/blog/illustrations/` assets; no earlier abstract artwork appeared. There were no page errors and no document horizontal overflow. Article tables remain horizontally scrollable inside their containers.

The migrated index obtains `posts` from `blog-data.ts`, which applies `editorial-artwork.json`; article heroes and recommendation cards use those same posts. Browser results confirm the index lists exactly seven canonical articles and that every article renders its own hero plus three recommendations. Technical and Insights filters both returned the expected three non-featured articles and loaded artwork at all three widths. The featured article remains visible outside the filters.

| Placement | 1440 px screen | 390 px screen | 320 px screen |
| --- | --- | --- | --- |
| Index featured | 848 × 477 | 350 × 350 | 280 × 280 |
| Index cards | 413.33 × 413.33 | 350 × 350 | 280 × 280 |
| Article hero | 675 × 379.6875 | 350 × 350 | 280 × 280 |
| Article recommendations | 424 × 318 | 350 × 350 | 280 × 280 |

Inspected the full index screenshots at all three widths, plus the after-hours article hero and recommendations. Centered square crops retain the complete illustrated objects, and category labels do not overlap the objects. Wide covers also retain all geometry. Forest/Paper/Iris treatment is consistent across the set; no broken images or unexpected raster borders appeared.

The initial small-line placement issue is resolved. After responsive framing changes, the full 24-page audit was rerun and the screenshots/results replaced with final evidence. Inspected the new 390 and 320 px square article covers and the desktop 4:3 recommendations: complete geometry remains visible with sufficient margin, while the outlines are materially clearer.

Nominal source stroke is 3.6 pixels in the 1600 × 900 master; final stroke is `max(display width / 1600, display height / 900) × 3.6`. All inspected placements meet the skill's 1 px minimum. Mobile squares yield 1.40 px at 390 and 1.12 px at 320; desktop recommendations yield 1.272 px. The boundary checks also pass: at 768, the 448 × 252 index feature yields 1.008 px and the full-row 704 × 396 recommendations yield 1.584 px; at 1101, the 335 × 251.25 recommendations yield 1.005 px. All breakpoint images decoded and both pages had no document overflow. `breakpoints.json` records these additional measurements. No more-story rows are present in the final seven-article index, so that unused layout was not exercised.

Evidence: `results.json` contains actual image paths, decoded dimensions, layout boxes, link destinations and filter contents. `blog-{1440,390,320}.png` shows the complete index; `after-hours-{hero,cover,recommendations}-{1440,390,320}.png` records representative article placements. `check.mjs` reproduces this inspection.
