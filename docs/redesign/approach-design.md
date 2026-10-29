# AI Services / Approach — design and verification

28 October 2026. Route: `/approach`.

## Direction

Restrained editorial utility. A broad Founders Grotesk headline introduces the engagement, followed by a five-stop process rail. The process itself is an open sequence of numbered rows, each separating the work from its inspectable output. Client inputs are native disclosure controls. A single approval-flow diagram gives the governance story a concrete shape, followed by a forest-green repository inventory that makes ownership tangible.

Uses the homepage's PP Neue Montreal body face, Founders Grotesk display face, original P3 tokens, 1600px maximum width and 48/32/20px gutters. Section rhythm uses 96px desktop / 64px mobile spacing. No new dependency, media, canvas, animation loop or client component is introduced by the page. The shared header remains interactive.

## Mobbin research

- [The Performance Lab process](https://mobbin.com/sites/sections/6478449d-7cb6-4686-9294-d44c0912ace0): inspected image. Its asymmetric introduction and ordered right-hand content informed the strong separation between stage labels and working detail.
- [Trawelt services](https://mobbin.com/sites/sections/629aae31-4a94-46df-a97f-3180a6ae22e0): inspected image. Oversized sequential numerals and hairlines inspired the simple five-stage reading order. Numbers are deliberately much quieter here to preserve AtomsAI's scale.
- [Daydream approach](https://mobbin.com/sites/sections/c93f0730-2be5-4d34-b6e6-c7ae4da069b7): inspected image. Clear stage titles are useful; the brightly colored card grid was not appropriate for this page's rhythm.
- Iteration search: [Tines workflow](https://mobbin.com/sites/sections/ecd72311-88aa-4fd3-bcfe-cec7946fa8dc) and [GitHub security](https://mobbin.com/sites/sections/e13b3db1-e2f8-454a-ad67-dc3516dbcd45), both images inspected. These reinforce putting a specific workflow artifact beside the explanation. The implementation uses readable HTML decisions and records rather than decorative pseudo-screens or floating screenshots.

No Mobbin artwork copied into the site; references inform composition only.

## Content

Based on the current live Approach main-content extract in `source/approach.txt`. Preserves five stages: teardown, blueprint, build/integrate, evaluations/hardening, handover/scale. Preserves repository ownership, measurable acceptance, agreed permissions, human approvals and operation after handover. Shortens repeated copy and avoids carrying over unverified certification banners or quantitative sample metrics. The approval flow is explicitly illustrative.

## Iteration and checks

Desktop screenshot inspected at 1440px, then full mobile screenshot at 390px. Increased mobile diagram labels and notes from 10–11px to 12px for readable detail. Native details were verified with Enter, including the per-stage inputs and FAQ. Cross-browser report is `approach/checks.json`, with screenshot evidence for Chromium and WebKit at 1440, 768, 390 and 320px.

Targeted ESLint passed for both TSX files. Repository TypeScript check passed at this implementation stage. The parent task owns full integrated build and independent QA.

## Files

- `src/app/approach/page.tsx`: page metadata and shared shell.
- `src/components/pages/approach-page.tsx`: server-rendered page content.
- `src/components/pages/approach.module.css`: page-scoped responsive design.
