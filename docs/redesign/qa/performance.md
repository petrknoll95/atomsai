# Performance QA — five-page redesign

Independent review on 28 October 2026. **PASS after correcting the unnecessary shared-menu download.** No implementation files were changed by this reviewer.

## Scope and method

Production build served by next start at http://127.0.0.1:3002. Chromium 156.0.8078.4, normal-motion browser contexts, cold HTTP cache. Desktop: 1440×960, DPR1, native local connection. Mobile simulation: 390×844, DPR2, touch/mobile mode, 150ms network latency, 1.6Mbps download, 750Kbps upload and 4× CPU slowdown through CDP. Each route had its own context; a single browser process was reused, so this is not a fully cold operating-system or V8 cache test.

Buffered PerformanceObservers captured LCP, layout shifts, long tasks and event timing. Resource timing captured actual transferred and decoded bytes. Timing read after network idle, loaded fonts and 1.5 seconds settling. A separate 1.5-second idle window measured CPU task/script duration. Then one real local interaction per page was exercised (disclosure, workflow tab, deployment selection or local email draft preparation). No email was sent.

Other agents were running browser QA during the first pass. The final timing run began after the large integration and responsiveness matrices finished, with the overall reviewer holding their browser work until timing completed. Treat all timings as local lab observations, not a Lighthouse score, a field percentile or a deployment SLA. No field INP is claimed. Resource sizes and request counts are the more deterministic evidence.

## Final measurements

| Page | Mode | LCP ms | CLS | Load complete ms | Resource transfer KiB | Reduction vs baseline | JS transfer KiB |
|---|---|---:|---:|---:|---:|---:|---:|
| /approach | desktop | 348 | 0.00000 | 302 | 492.0 | 30.7% | 199.8 |
| /capabilities/voice | desktop | 312 | 0.00000 | 289 | 496.1 | 30.8% | 203.9 |
| /industries/healthcare | desktop | 320 | 0.00000 | 289 | 525.2 | 29.3% | 207.3 |
| /trust | desktop | 316 | 0.00000 | 291 | 493.5 | 30.6% | 201.2 |
| /company/contact | desktop | 324 | 0.00000 | 299 | 494.4 | 30.5% | 202.1 |
| /approach | mobile | 872 | 0.00005 | 2812 | 492.0 | 30.7% | 199.8 |
| /capabilities/voice | mobile | 892 | 0.00055 | 2847 | 496.1 | 30.8% | 203.9 |
| /industries/healthcare | mobile | 988 | 0.00004 | 2967 | 522.4 | 29.4% | 207.3 |
| /trust | mobile | 876 | 0.00002 | 2819 | 493.5 | 30.6% | 201.2 |
| /company/contact | mobile | 868 | 0.03123 | 2827 | 494.4 | 30.5% | 202.1 |

The change removed roughly **217–221 KiB** of unnecessary initial resource transfer per route: **29–31% less total transfer** and approximately **half the initial JavaScript**. Under the specified mobile profile, load completion moved from 3.65–3.82s to 2.81–2.97s. LCP remained below 1s in the final mobile samples; it was already fast because the headline/font rendered before all the unused scripts finished.

Final resources exclude the navigation HTML. Unlike the baseline, they no longer include speculative homepage RSC, artwork scripts and related styles. Each table row is one observed run, not a statistical percentile.

## Baseline measurements

| Page | Mode | LCP ms | CLS | Load complete ms | Resource transfer KiB | JS transfer KiB |
|---|---|---:|---:|---:|---:|---:|
| /approach | desktop | 320 | 0.00000 | 289 | 709.6 | 401.2 |
| /capabilities/voice | desktop | 348 | 0.00000 | 311 | 716.8 | 405.1 |
| /industries/healthcare | desktop | 328 | 0.00000 | 297 | 742.6 | 408.5 |
| /trust | desktop | 328 | 0.00000 | 302 | 710.9 | 402.5 |
| /company/contact | desktop | 320 | 0.00000 | 297 | 711.8 | 403.4 |
| /approach | mobile | 904 | 0.00005 | 3655 | 709.6 | 401.2 |
| /capabilities/voice | mobile | 944 | 0.00054 | 3708 | 716.8 | 405.1 |
| /industries/healthcare | mobile | 1008 | 0.00004 | 3820 | 739.8 | 408.5 |
| /trust | mobile | 900 | 0.00002 | 3665 | 710.9 | 402.5 |
| /company/contact | mobile | 892 | 0.03123 | 3669 | 711.8 | 403.4 |

Resource totals exclude the HTML navigation response and include speculative homepage RSC prefetch from the shared logo link. This is network delivery observed in the local production server, which compresses JS/CSS/TTF.

## Finding

**Resolved P2 — Shared menu artwork shipped before it was needed.** Every new route requests /_next/static/chunks/2-lq1k8mx3z1g.js directly from its initial HTML. The baseline chunk is ~600 KiB decoded /163 KiB transferred and contains the procedural pattern renderer/data. The /approach client-reference manifest traces it through src/components/home/hero.tsx and the pattern modules; hero.tsx exports SiteHeader while statically importing PrototypeHero and MotionPattern. FullscreenMenu also statically imports MotionPattern despite mounting the artwork only when opened. Thus the quiet secondary pages pay the pattern-code transfer cost even with all menus closed.

Implemented by the root agent: split SiteHeader and SiteFooter from homepage composition modules, import those directly in PageShell, and dynamically load menu MotionPattern artwork. An intermediate retest caught the logo’s automatic homepage prefetch pulling the same code back into the page; prefetch={false} on the logo link closed that path. Final network captures prove the renderer is absent before interaction.

Deferred-menu verification on the throttled mobile profile: menu and AI Services link were visible 142ms after the test began its click; artwork reached its ready state at 1.12s, with navigation available during loading. The rendered screenshot was inspected and the AI Services link successfully navigated to /approach. No errors occurred.

**P3 — Shared variable font delivery remains the largest single asset.** PPNeueMontreal-Variable.ttf is 393.8 KiB decoded /194.4 KiB transferred. Together with the two Founders faces, font resources total ~256.7 KiB transferred. This is inherited typography, not a new page-specific regression. A lossless WOFF2 version retaining original glyphs and axes could reduce transfer in future; no font substitution or metrics change is recommended. It is not a blocker in the measured pages.

## Positive checks

- All five routes loaded without page errors.
- No MP3, WAV or OGG request occurred before playback. Voice uses preload=none and pauses outside the viewport or in a hidden document.
- Healthcare uses next/image, explicit sizing and a responsive srcset; the desktop request was about 25.6 KiB, and the DPR2 mobile request about 22.8 KiB. It does not download the 774 KiB original image.
- No new-page background animation loop or extra dependency was introduced. Native process/FAQ disclosures remain server-rendered. Shared-header idle costs were small in the sampled window (roughly 3–24ms total tasks per 1.5s in the final run, no idle layouts).
- Desktop CLS was 0. Mobile CLS was below 0.001 on four pages and 0.0312 on Contact, with no material content jump found.
- Sample interaction event durations were below 100ms in these runs, including preparing the local enquiry draft. These are event timing observations, not field INP.

## Evidence

- [Reproducible measurement script](performance/measure.mjs)
- [Full baseline](performance/baseline.json)
- [Baseline summary](performance/summary-baseline.json)
- [Intermediate prefetch finding](performance/intermediate-prefetch.json)
- [Final measurements](performance/final.json) and [summary](performance/summary-final.json)
- [Deferred-menu check](performance/menu-check.json), [script](performance/menu-check.mjs), and [rendered evidence](performance/deferred-menu.png)

**Final verdict:** No remaining performance blocker found across the five routes in the tested production build. The variable-font format is an optional shared-site optimization; it does not prevent acceptance of this redesign. Real hosting/CDN performance, real phones and field Web Vitals remain outside this local QA measurement.
