# AtomsAI redesign — remaining page map

Reviewed 28 October 2026, before design delegation.

## Evidence and scope

The website repository is /Users/petrknoll/Documents/GitHub/atomsai. Only this repository is modified. The brand repository was inspected read-only. The Next.js route inventory contains the homepage plus pattern, hero and integration previews; none of the secondary marketing routes exist yet. Existing uncommitted homepage work is preserved.

The live site was crawled from its navigation and followed through three link levels until no new pages remained. robots.txt identifies /sitemap-index.xml and /sitemap-0.xml; the [saved sitemap](source/sitemap.xml) has 53 pages, all covered by the crawl, plus the linked /brand page omitted from that sitemap. [Raw route/status inventory](source/live-inventory.json) and individual main-content extracts are saved in source/. All listed content routes returned HTTP 200. This covers every published sitemap route and discoverable linked page; unlinked, unlisted pages cannot be inferred. 54 content pages were found including the homepage; **53 secondary pages remain to migrate at review time**. RSS and webmanifest are supporting endpoints, excluded from the page count.

## Five selected pages

| Priority | Page | Why it matters | Bespoke design direction |
| --- | --- | --- | --- |
| 1 | Contact — /company/contact | Every primary conversion path ends here. | Compact editorial invitation beside a useful enquiry composer; clear email handoff, preparation notes, contact directory. |
| 2 | AI Services / How we work — /approach | Explains the custom-build offer and ownership that the homepage introduces. | A numbered process with tangible outputs, one workflow diagram and a handover inventory. |
| 3 | Voice — /capabilities/voice | A core capability visitors can understand and experience. | A conversation-led hero, an interactive call-to-action example, and restrained integration story. |
| 4 | Healthcare — /industries/healthcare | A concrete, high-value industry journey linked from the homepage. | A front-desk day told through scheduling and handoff examples; human photography and operational detail. |
| 5 | Trust Center — /trust | Resolves deployment, data and review questions for enterprise buyers. | A calm reference page with a deployment comparison, exact disclosures and a document request index. |

Selection balances conversion, offer clarity, product understanding, vertical relevance and enterprise review. This task implements these five; the remaining inventory is a follow-on backlog, not implicitly in this build.

## Complete migration backlog

The review found 53 secondary pages. The five selected routes are now implemented and have passed independent QA, leaving **48 existing secondary pages** for subsequent migration. Existing live URLs are retained to avoid unnecessary redirects.

| Route | Page | Review status |
| --- | --- | --- |
| /agents | Agents | Remaining |
| /agents/collections | Collections agents | Remaining |
| /agents/crm | CRM agent | Remaining |
| /agents/customer-health | Customer health | Remaining |
| /agents/dispatch | Dispatch and delivery agents | Remaining |
| /agents/document-intake | Document intake agents | Remaining |
| /agents/front-desk | Front desk agents | Remaining |
| /agents/intelligence | Intelligence | Remaining |
| /agents/knowledge | Knowledge agent | Remaining |
| /agents/patient-access | Patient access agents | Remaining |
| /agents/quote | Quote agent | Remaining |
| /agents/rep-assist | Rep assist | Remaining |
| /agents/sales | Sales agents | Remaining |
| /agents/support | Support agents | Remaining |
| /agents/ticket | Ticket agent | Remaining |
| /approach | Our approach | Built — QA passed |
| /brand | Brand system | Remaining |
| /capabilities | Capabilities | Remaining |
| /capabilities/chat | Chat agents | Remaining |
| /capabilities/voice | Voice agents | Built — QA passed |
| /changelog | Changelog | Remaining |
| /company | Company | Remaining |
| /company/about | About | Remaining |
| /company/careers | Careers | Remaining |
| /company/contact | Contact | Built — QA passed |
| /industries | Industries — AI workflows built around your business | Remaining |
| /industries/auto-dealers | AI agents for auto dealers: sales leads, service and BDC | Remaining |
| /industries/healthcare | AI agents for healthcare groups: front desk, scheduling and billing | Built — QA passed |
| /industries/insurance | AI agents for insurance agencies: quotes, service and renewals | Remaining |
| /industries/lending | AI agents for lenders: loan inquiries, documents and payments | Remaining |
| /industries/logistics | AI agents for logistics: shipment updates, exceptions and billing | Remaining |
| /industries/manufacturing | AI agents for manufacturing: RFQs, order status and warranty | Remaining |
| /industries/real-estate | AI agents for real estate: leads, showings and residents | Remaining |
| /industries/retail | AI agents for retail and e-commerce: guided selling and support | Remaining |
| /legal/privacy | Privacy Notice | Remaining |
| /legal/terms | Terms and Conditions | Remaining |
| /resources | Resources | Remaining |
| /resources/blog | Blog | Remaining |
| /resources/blog/how-much-autonomy-should-an-agent-have | How much autonomy should an AI agent have? Set approval rules | Remaining |
| /resources/blog/no-shows | Why people no-show after a reminder, and how to rebook them | Remaining |
| /resources/blog/quotes-go-quiet | How to follow up on unsigned quotes and estimates, on every channel | Remaining |
| /resources/blog/speed-to-lead | Speed to lead: how fast to answer new leads on every channel | Remaining |
| /resources/blog/subscribe | Subscribe to the blog | Remaining |
| /resources/blog/the-demo-was-never-the-hard-part | Why AI pilots stall before production, and how to fix it | Remaining |
| /resources/blog/who-answers-at-7pm | After-hours customer messages: how to answer every channel | Remaining |
| /resources/blog/write-the-evals-before-the-prompt | How to test an AI agent before launch: write the evals first | Remaining |
| /resources/case-studies | Case studies | Remaining |
| /resources/case-studies/kestrel-underwriting-intelligence | Underwriting in hours, with the reasoning | Remaining |
| /resources/case-studies/meridian-health-support-knowledge | Support answers that cost twelve minutes less | Remaining |
| /resources/case-studies/northwind-invoice-compound-system | Invoices that match themselves | Remaining |
| /solutions | Solutions | Remaining |
| /solutions/ai-front-desk-for-dental-groups | AI front desk for dental groups, built around your practice software | Remaining |
| /trust | Trust Center | Built — QA passed |

## New information architecture and supporting work

- Applications: homepage currently links to its section and to JustCall, Helpwise, ServiceAgent and CallPage. A future /applications index would help comparison; do not invent duplicate product-detail pages for these external products.
- Infrastructure: PyAI remains an external destination. A future /infrastructure introduction is optional, not an existing route to migrate.
- AI Services: use /approach for this release; a future /services index needs its own distinct purpose before adding it.
- Knowledge and Integrations are sections of /capabilities, not discoverable separate pages.
- Help center currently points to the homepage FAQ. A help hub needs a content/support decision before adding a route.
- Brand remains a separate guidelines destination; /brand can ultimately redirect to the maintained brand site.
- Preserve RSS subscriptions when migrating the seven blog articles and subscription page. Add an authored 404 and generated sitemap as launch work.
- Preserve legal copy through review rather than creatively rewriting it. Cookie preferences must match actual tracking behavior.
- The three case studies are explicitly illustrative on the live site. Do not promote sample metrics or names into customer evidence.
- Some current homepage links are absolute to the live site or local hashes. Connect the five completed routes locally and make homepage-only hashes work from secondary pages. Keep the rest on their verified live destinations.

## Design contract

**Direction: restrained editorial utility.** The page should help a visitor understand a specific decision, using the homepage's precise typography and generous rhythm. DFII: impact 4 + fit 5 + feasibility 4 + performance 5 − consistency risk 3 = **15**.

Founders Grotesk display / PP Neue Montreal body; original P3 paper, cream, forest and iris tokens; 1600px maximum width; 48/32/20px gutters; 96px desktop and 64px mobile section rhythm; 16/32px corners; pill controls. Existing homepage values override older brand-site differences. Use hairlines and whitespace, limited tinted panels, and one memorable explanatory composition per page. Share navigation and footer, not whole homepage content sections. No new stock UI kit or font. No fabricated metrics, client proof, uptime, compliance scope or calendar bookings.

Reference files: src/styles/tokens.css, src/app/globals.css, docs/design/README.md and the existing homepage components. Brand read-only references: src/data/fonts.ts and src/data/colors.ts in atoms-ai-brand.

## Mobbin and review plan

Initial section research inspected [Tines](https://mobbin.com/sites/sections/da5302c8-e58d-4d5f-b2f0-79089c5674bc), [ClickUp](https://mobbin.com/sites/sections/edaded65-c9b9-42df-8e5d-dc12d802c6e3) and [V7](https://mobbin.com/sites/sections/ca187f4d-5cf3-415f-958f-aa8205c36f6d). Tines uses asymmetric hierarchy and task illustrations; V7 pairs short headings with concrete UI details. Adopt the explanatory specificity, not their repeated card grids. Additional page-specific Mobbin searches are required during design and iteration, with reference notes saved beside the implementation.

After the five pages are integrated and visually iterated, delegate separate QA reviews for performance, style, responsiveness, copy and overall quality. Fix actionable findings and verify changes. Capture desktop and mobile renders, interaction outcomes, build/lint/typecheck results and any limitations in docs/redesign/qa/.

## Delivery status

All five selected pages passed implementation, visual iteration and independent QA. [Delivery overview](README.md) and [consolidated QA](qa/README.md) contain preview links, evidence and the resolved findings. The 48 remaining existing routes in the table are follow-on migration work.
