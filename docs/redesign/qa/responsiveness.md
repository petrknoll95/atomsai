# Independent QA — responsiveness

Reviewed 28 October 2026 against the current development preview at `http://127.0.0.1:3001`. Scope: Approach, Voice, Healthcare, Trust Center and Contact, including their shared navigation and footer. No implementation files were edited by this reviewer. Final shared-header/menu regression passed in the four narrow interaction cases after the coordinator split the module graph.

## Verdict

Pass for responsive layout and operation, with one touch-comfort improvement found and corrected by the coordinator. No clipping, inaccessible content or horizontal overflow was found in the 60-case viewport/browser matrix.

## Findings and resolution

### P3 — Voice seek control had a small vertical hit area — corrected

`src/components/pages/voice.module.css`, `.playerProgress input`, originally rendered at 184 × 20px on a 320px screen. The visible 2px track was suitable; the interactive area could be more forgiving on touch. The coordinator increased the input height to 44px without thickening the visible track. Rechecked in Chromium and WebKit at 320px: 44px hit area, document width exactly 320px. Evidence: [touch-fix.json](responsiveness/touch-fix.json) and `voice-touch-fixed-*.png`.

### Narrow-screen microcopy observation — corrected in source

The 320px recheck still found 10px `.playerTop` text because the `max-width:359px` rule overrides the 12px base treatment. The same narrow rule applies 10px to `.sampleLabel`. The coordinator subsequently raised both narrow overrides to 12px, along with the flow indices and Healthcare calendar labels. This was a readability refinement, not an overflow or operation defect. The final production regression is coordinated by the root agent.

## Coverage and evidence

- **60 layouts:** five routes × Chromium and WebKit × 320, 390, 768, 1024, 1440 and 1920 CSS pixels. Every page had matching viewport/document widths, no nondecorative content extending beyond the viewport, no browser page errors and no missing images. [Matrix](responsiveness/matrix.json).
- **Visual inspection:** fresh screenshots at 320, 768, 1024 and 1920px. Contact remains usable at the tight 768px two-column breakpoint; its fields stack. Voice keeps usable controls and readable separate conversation/flow content. Healthcare changes its internal process/results arrangement without losing context. Approach and Trust retain the sequence and disclosures rather than clipping a desktop diagram. The 1600px content cap works at 1920px.
- **Reflow:** 320 CSS pixels covers the layout width of a 1280px viewport at 400% browser zoom. This tests the CSS reflow condition, not OS magnification or physical-device browser zoom controls. Inputs use 16px text, avoiding the usual small-input automatic zoom issue on mobile Safari.
- **Short viewport:** compact menu at 320 × 568px fits Company links and legal navigation, supports scrolling when needed, and returns to the previous 800px page scroll position after Escape.
- **Interactive states:** normal and reduced motion in both engines at 320 × 568px. Voice End-key selection, actual playback/pause, keyboard seeking and complete transcript; Healthcare End-key scenario selection; Trust hosted deployment state; Contact long draft review with bounded vertically scrollable message and a focused review heading. No messages were sent. All four cases passed, including focus containment, restored scroll/focus and no review-state overflow. [Interaction evidence](responsiveness/interactions.json).
- **Keyboard navigation preference:** this macOS WebKit instance follows Safari's default preference that plain Tab skips links/buttons. Option+Tab correctly traverses all controls, including the intentionally active header logo and close button, and stays within the header/menu focus scope. Chromium uses ordinary Tab. The initial test's narrower dialog-only focus condition and wrong first-`details` transcript locator were corrected; these were test errors, not page defects.

Reproduction scripts: [matrix check](responsiveness/check.mjs) and [interaction checks](responsiveness/interactions.mjs). Screenshots and JSON are stored in `responsiveness/`.

## Limits

Browser-engine emulation does not establish physical iOS/Android device behavior, virtual-keyboard safe-area behavior, or every OS text-size preference. No such device testing is claimed. Inline text links shorter than 24px are isolated with surrounding space; the principal page controls are appropriately sized, and the identified continuous audio control has been enlarged.

## Final coordinator verification

[Production caption/touch checks](final-caption-touch-check.json) confirm the last narrow-screen overrides compute to 12px in both Chromium and WebKit at 320px. Voice seeking remains 44px tall and all rechecked pages remain exactly 320px wide. This closes the source-only verification note above.
