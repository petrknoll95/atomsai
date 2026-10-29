# Healthcare page — design and implementation

Route: `/industries/healthcare` · 28 October 2026

## Direction

The page follows the homepage's Founders Grotesk / PP Neue Montreal pairing, original P3 palette, 1600px container, 48/32/20px gutters and 96/64px section rhythm. Its own subject is the practice's front desk: one changed appointment moves through verification, availability and confirmation before the freed slot returns to the waitlist.

The hero is a broad editorial headline above a photograph and a small morning timeline. The original healthcare photograph is reused from the homepage's packaged assets, with a responsive crop, intrinsic dimensions and high fetch priority. The subsequent workflow explorer is intentionally quieter than a full dashboard: request, checks, result, next action. Three examples expose the different boundaries of scheduling, billing and clinical handoff. The integration directory is typography on hairlines, followed by one forest-green section defining what people retain control over.

## Mobbin references inspected

- [Ease — EHR feature overview](https://mobbin.com/sites/sections/062cf0bb-d802-4621-9c6d-d78fc288fb70): left-side topic selection paired with one focused demonstration. This informed the workflow selector, but AtomsAI's example uses its own request-to-result anatomy and restrained neutral palette.
- [Ease — patient record feature](https://mobbin.com/sites/sections/5a0b10db-4029-4d40-9eec-d3f3a58d9aa5): an explanatory interface can carry the feature story without illustration clutter. The healthcare page uses a compact appointment confirmation instead of a generic decorative dashboard.
- [Ease — revenue cycle section](https://mobbin.com/sites/sections/f6247ce1-a81c-4011-b10c-4e3d2dc42e5c): inspected for sparse content grouping; its feature grid and decorative corner lines were not carried over.
- [Amigo — healthcare FAQ](https://mobbin.com/sites/sections/b24bb61d-a3fa-4e1e-a6b3-cd55f0461b91): the second research pass reinforced a simple question index with enough space for complete answers.
- [Superpower — grouped FAQ](https://mobbin.com/sites/sections/8eaf961f-6352-4edb-9a6b-7064307693f5): inspected but category navigation is unnecessary for this short set of five questions.

## Copy decisions

The live healthcare page and Trust Center extracts are the content references. Absolute first-ring/zero-missed-call outcomes and invented before/after metrics were omitted. The sample morning is labelled illustrative. No patient data or live practice system is connected to the explorer, and that is stated beside it. The clinical example gives no medical advice. HIPAA is not presented as a certification; covered workloads require review of the applicable BAA and deployment scope. Connections are explicitly scoped and depend on access, rather than suggesting every integration is plug-and-play.

Contact routes to the redesigned `/company/contact`. Trust and implementation questions link locally to `/trust` and `/approach`; the unbuilt industry index remains on its verified live destination.

## Iteration

Initial rendered review covered 1440, 768, 390 and 320px. The initial workflow result was too generic, so the scheduling result now uses a legible time card, previous slot and confirmation context. Process checks have a connecting line to clarify sequence. Mobile collapses to one column without horizontal scroll; the vertical tablist keeps large hit targets. Native FAQ details expose full answers without additional JavaScript. Tabs implement arrow keys, Home, End, roving focus, selected state and labelled panels.

Desktop/mobile Chromium and WebKit evidence is in `healthcare/`. `checks.json` records console errors, page width, image loading, unique H1, tab keyboard operation and FAQ operation. Page-specific ESLint passed. Final repository build/typechecking and independent QA are coordinated by the root agent.

A final image pass switched the healthcare hero to `next/image` with responsive sizes and eager/high-priority loading. At DPR 1 the actual image transfer was 26,248 bytes at 1440px and 10,686 bytes at 390px (the packaged lossless source is 774,198 bytes). Both decoded successfully and the desktop visual was re-inspected. Evidence: `healthcare/image-checks.json` and `optimized-*-hero.png`.
