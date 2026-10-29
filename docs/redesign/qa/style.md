# Independent QA — Style

Reviewed 28 October 2026. Scope: `/approach`, `/capabilities/voice`, `/industries/healthcare`, `/trust`, `/company/contact` against the established homepage and the current live page captures.

**Verdict: Pass after caption-size remediation.** No blocking style findings. The five pages visibly belong to the homepage's design system while using page-specific compositions. This is a visual review, not a substitute for the separate performance, responsiveness, copy and functional reviews.

## Evidence

Fresh Chromium renders at 1440 × 1000 and 390 × 1000 were captured from the current development preview. Full pages and 600px desktop overviews are in [style/](style/); mobile opening crops provide native-scale detail. The homepage was also captured and inspected. [Computed typography and layout](style/render-data.json) confirms all five pages use Founders Grotesk at weight 400, PP Neue Montreal at weight 425, and 48px / 20px gutters at the tested desktop / mobile sizes. Sources reviewed: `src/styles/tokens.css`, global display rules, and the five page CSS modules.

Compared each new page with the saved live screenshots in `../source/live-{approach,voice,healthcare,trust,contact}-overview.png`. The live versions use more black/purple changes of ground, repeated boxed layouts and ornamental hero elements. The new pages use paper, forest and restrained neutral surfaces, clearer typographic hierarchy and fewer competing focal points.

## Findings, by severity

### P3 — A handful of new labels are smaller than the shared caption scale

- `src/components/pages/voice.module.css`: `.sampleLabel`; mobile `.playerTop` and `.playerProgress > div` are 11px.
- `src/components/pages/contact.module.css`: mobile `.formProgress` is 11px.
- `src/components/pages/approach.module.css`: desktop `.outcomeLabel` is 11px (already 12px on mobile).

These labels remain readable in the captures, but they are noticeably finer than the homepage's 12px caption role. Set them to `var(--text-caption)` or 12px, then confirm the player's time row and the contact progress row still fit at 320px. This is a limited polish recommendation, not a reason to enlarge other supporting text or change the compositions.

Evidence: [Voice mobile opening](style/voice-390-opening.png), [Contact mobile opening](style/contact-390-opening.png), [Approach desktop](style/approach-1440.png).

No P0, P1 or P2 style findings.

## Per-page assessment

| Page | What works | Comparison with the live page |
| --- | --- | --- |
| Approach | The process rail gives an overview, the five open rows distinguish the work from its output, and the approval diagram and repository inventory make two different ideas concrete. Mobile turns the rail vertical and gives outputs a quiet surface. | Replaces a long sequence of purple cards with a legible process. The regular repetition belongs to the five-stage subject, rather than being a generic marketing template. |
| Voice | The real waveform, “Hello” focal point and adjoining transcript establish the subject immediately. The workflow selector, open numbered context list and short launch sequence provide different reading speeds. Iris is used sparingly; the page is recognizably in the forest/paper family. | Moves the focus from a decorative purple orb and many colored feature tiles to an actual conversation and its next action. |
| Healthcare | The broad photograph and morning timeline give the page a human setting. The request/check/result scheduling example is specific to a practice. The integrations directory and dark human-boundaries section change rhythm without adding visual noise. | Reduces the original page's competing gradients, metrics cards and dashboard fragments while keeping an operational story. |
| Trust | The section index, open assurance rows, deployment boundary, data controls and numbered request index suit a reference page. One dark section separates architecture from documentation. The large title and understated rows are appropriately different in scale. | Replaces a decorative orb, many boxed assurances and repeated dark panels with a clear reference hierarchy. |
| Contact | Introduction and composer share the desktop opening; the form comes before preparation notes on mobile. Inputs are quiet and clearly labelled, the primary action has a strong contrast, and the department directory is distinct from the form. | Removes the long route to the form and the heavy section switching. The page is materially shorter and has one obvious job. |

## Cohesion and detail

- All five use the original typefaces and their intended roles. Headlines have the homepage's compact leading and normal weight; body copy remains restrained.
- Shared page width, gutters, pill actions and footer connect the pages. Section spacing is generally 96px desktop / 64px mobile, with purposeful local adjustments rather than mechanically identical sections.
- Page-specific hero treatments are clear: process rail, voice player, photograph/timeline, trust index and contact composer.
- The same light/dark language is maintained without requiring every page to include the same dark section. Contact stays light until the footer; Trust gives its architecture a dark ground; Healthcare uses dark to focus attention on human boundaries.
- The shared footer now has adequate top inset on secondary pages; the earlier clipped-title appearance is resolved in current renders.
- No need for another Mobbin-led structural rewrite emerged from this review. Existing documented references were translated into distinct compositions, rather than copied as identical card patterns.

## Capture note

A few development screenshots initially showed a blank fixed-header paint region despite visible DOM geometry. A fresh production capture of Contact at 390px displayed the correct logo and menu, and hit testing confirmed the menu was topmost. This was not reproduced as a production defect and is not counted as a finding. [Production evidence](style/contact-production.png).

The coordinator is separately splitting shared imports and deferring menu pattern code for performance. This report evaluates visual output before that nonvisual refactor; final integrated screenshots should confirm it remains unchanged.

## Remediation verification

The coordinator raised the reported 11px rules to the 12px caption token. A fresh 320px Chromium check confirms Contact's progress row, Approach's outcome labels and Voice's playback progress row compute to 12px without horizontal overflow. Evidence: [remediation.json](style/remediation.json) and the three `*-320-remediated.png` captures.

One narrower Voice override still computes `.playerTop` and `.sampleLabel` to 10px at 320px. This was immediately reported to the coordinator for the same correction before the final integrated pass. The entire page still fits the viewport; this is the same P3 item, not a new layout defect.

## Final coordinator verification

The remaining narrow overrides, Voice flow indices and Healthcare calendar labels now use the shared 12px caption role. Fresh production Chromium and WebKit checks at 320px confirm 12px computed text, a 44px Voice seek target, and no horizontal overflow. [Final evidence](final-caption-touch-check.json); final screenshots are in [integration/](integration/). The P3 typography item is resolved.
