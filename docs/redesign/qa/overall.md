# Independent QA — overall quality

Reviewed 28 October 2026. Scope: the five selected pages, their integration with the homepage, and the requested redesign deliverables. Final browser journeys ran against the optimized production build at `http://127.0.0.1:3002` after the shared-header/footer split and logo prefetch correction.

## Verdict

**Pass. No outstanding blocking or material overall-quality findings.** The selected pages form a coherent, usable extension of the homepage. The implementation is ready for local design review; this is not a claim that the remaining 48-page migration or a public deployment has happened.

The separate style, responsiveness, performance and copy reviews found small issues that the coordinator addressed. This review did not find an additional implementation defect requiring a change.

## End-to-end evidence

[Production journey results](overall/results.json) record 21 successful assertions/checkpoints, with no browser runtime errors. [Reproduction script](overall/check.mjs) uses Chromium at desktop and compact-menu widths. The broader two-engine viewport matrices are covered by the integrated and responsiveness reports.

Verified journeys:

- Homepage **AI Services** opens the local Approach route.
- Approach's primary CTA opens Contact with the appropriate topic. Empty required fields prevent review. A fictional enquiry preserves its text, ampersand and topic in the encoded mailto draft. Focus moves to the review heading, and editing retains the entered fields. The script inspects the mailto link; it does not open an email application or send a message.
- Footer **Voice** opens the local Voice route. **Hear a sample** reaches the sample section, and the native transcript opens.
- The desktop **Industries → Healthcare** menu opens the local industry page. Its Trust Center action reaches the local Trust route.
- Trust's **Hosted pilot** control changes the deployment description. The document index has nine named, encoded email-request links and a direct security email address.
- A secondary-page footer **Applications** link reaches the homepage's Applications section, positioned at the 112px scroll inset rather than hidden behind the fixed header.
- Compact **Company → Trust Center** navigation works from Contact and closes into the destination page. [Final mobile Trust capture](overall/trust-mobile.png) was visually inspected: header, section hierarchy, comparison and document index remain intact.

The final route metadata check covers all five pages: unique, appropriate titles and descriptions; exact `https://atomsai.com` canonical URLs; one main landmark; one H1; English document language; no visibly unnamed controls in the simple naming scan.

## Goal and deliverable audit

| Requirement | Evidence | Assessment |
| --- | --- | --- |
| Review the website repo and list remaining pages in Markdown | [remaining-pages.md](../remaining-pages.md), saved live inventory and sitemap | Complete inventory of all 53 sitemap pages plus the linked Brand page, with homepage excluded from the 53-page secondary backlog. |
| Select five high-impact pages after review | Priority table and rationale in the page map; implementation routes | Contact, Approach, Voice, Healthcare and Trust are explicitly selected and implemented. |
| Use homepage style with page-specific sections | Five design notes, scoped CSS, style review and page renders | Shared fonts, tokens and rhythm; distinct process, conversation, practice-workflow, security-reference and enquiry formats. |
| Consult Mobbin throughout design/iteration | [references.md](../references.md) and five page-specific design notes | Each page has inspected references and documented adaptation/iteration decisions. |
| Preserve task boundaries | Source structure and route mapping | New work is in the website repository; brand material is referenced. Unmigrated routes retain live destinations. |
| Deploy the five QA perspectives | Performance, style, responsiveness, copy and this overall report | All five separate reviews are finalized. The coordinator’s consolidated audit is in qa/README.md. |
| Validate working implementation | Production build log, lint/typecheck logs, browser matrices, this journey report | Five routes statically prerender; navigation and interactive page flows work. |

## Implementation quality

- Page content and metadata remain server-rendered. Client code is limited to the shared navigation and the actual audio, tabs, deployment selector and enquiry composer.
- Shared identity is centralized in `PageShell`, `SiteHeader` and `SiteFooter`; page structure is not forced through a single generic marketing template. Deferring menu artwork preserves usable navigation before decorative code loads.
- Controls use native links, buttons, inputs and disclosures where appropriate. Voice and Healthcare selectors provide selected state and keyboard handling; Contact's review and clipboard fallback deliberately manage focus.
- The inquiry path accurately describes its email handoff. Scripted audio and workflow examples are identified. Trust's document requests and assurance limitations are explicit; there are no fake downloads or booking confirmations.
- Relative links in the redesign's top-level deliverable Markdown files resolve. The new page files contain no TODO/FIXME markers or placeholder `href="#"` actions.

## Limits and retained follow-on work

This is practical overall QA, not a formal screen-reader certification or physical-device test. The test does not send real email, validate a private security document, connect a patient system or verify third-party product services. Existing live destinations are retained according to the source inventory; this review does not claim a fresh exhaustive external-network link crawl.

Public deployment, the remaining 48 existing pages, publication sitemap/404 work, and any future backend form integration are outside the five-page implementation. Those boundaries are recorded in the map and README. The coordinator has updated the page map to “Built — QA passed” and consolidated the final reports in qa/README.md.

One earlier test run used an exact Contact URL without the new topic query, and another used an exact transcript text locator that included a decorative plus sign. These harness assumptions were corrected; neither was a product failure. The linked final result is the successful production run.
