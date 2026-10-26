# Customer-story card correction

On 26 October 2026, the user reported nearly invisible statistics in desktop and narrow screenshots. The cards explicitly used cream foreground and a 10% cream surface on the paper page. This followed a low-contrast source combination and is now intentionally corrected.

The three cards use the existing semantic `--color-foreground` and `--color-surface` tokens. Previous values use solid `--color-surface-muted-foreground`, avoiding the low contrast of opacity-based muted text. Original arrow geometry is reused as a `currentColor` CSS mask. “rateon” is corrected to “rate on.” No card, portrait, quotation, or pagination geometry was changed.

Only `src/components/home/stories.tsx` and the customer-story rules in `proof.module.css` changed. The related design/visual notes were updated to record the intentional difference from Figma.

## Validation

The correction was applied to an isolated copy of the existing kinetic preview so ongoing homepage-pattern integration was not rebuilt or restarted. TypeScript, ESLint and its production build passed.

Playwright checked Chromium and WebKit at 1600, 1100, 700, 390 and 320 pixels. All three surfaces are opaque, every checked statistic/label has at least **5.67:1** foreground/background contrast, arrows retain 20×20 geometry and their original mask, and there is no horizontal page overflow. Enter opens Read Story; Escape closes the dialog and restores trigger focus. No browser errors occurred.

The contrast calculation converts the computed Display P3 CSS colors through an sRGB canvas and applies relative luminance to the resulting channels. This is a focused check of these cards, not a whole-page accessibility certification.

- [Desktop / tablet capture](chromium-1100.png)
- [Full desktop capture](chromium-1600.png)
- [Narrow WebKit capture](webkit-390.png)
- [320px capture](chromium-320.png)
- [Measurements and geometry](results.json)

To review again, run the app and open `/#customer-stories` at those viewport widths. The original full-page comparison metrics in the parent report predate this requested correction and should not be treated as measurements of these new card colors.
