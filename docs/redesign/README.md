# AtomsAI secondary-page redesign

28 October 2026. Implementation lives only in the website repository. Existing homepage work was preserved; the brand repository was read for reference only.

## Deliverables

- [Full remaining-page map and prioritization](remaining-pages.md): every published sitemap route and discoverable linked content page, implementation priorities and follow-on work.
- Five bespoke pages, integrated with the homepage's navigation/footer and original design tokens.
- Page-specific Mobbin references, design rationale and iteration records.
- Independent performance, style, responsiveness, copy and overall-quality reviews, plus integrated production verification.

| Page | Local preview | Design notes |
| --- | --- | --- |
| AI Services / How we work | http://localhost:3001/approach | [Approach](approach-design.md) |
| Voice | http://localhost:3001/capabilities/voice | [Voice](voice-design.md) |
| Healthcare | http://localhost:3001/industries/healthcare | [Healthcare](healthcare-design.md) |
| Trust Center | http://localhost:3001/trust | [Trust](trust-design.md) |
| Contact | http://localhost:3001/company/contact | [Contact](contact-design.md) |

## Deliberate differences

Approach uses a five-stage process and inspectable outputs. Voice is built around real sample audio with a transcript and contextual workflow selector. Healthcare follows a practice morning and scheduling/handoff tasks. Trust uses reference rows, a deployment comparison and a document index. Contact combines a short invitation with a validated email composer and a direct contact directory. Shared foundations are typography, palette, gutters, controls and rhythm—not repeated homepage sections.

The page map found 53 secondary pages before implementation. Five are implemented here; 48 existing pages remain in the migration backlog. Product sites and PyAI remain external destinations. Unmigrated routes still point to their verified live pages.

## Functional boundaries

Contact prepares a message for the visitor's email app; the website does not send it or book a meeting. The review, copy fallback and no-JavaScript direct-email path make that boundary explicit. Voice playback is a scripted, locally hosted sample. Healthcare examples do not connect to patient systems. Security documents are requested by email; no document download or unpublished assurance scope is invented.

## Validation

All five independent QA reviews passed. [Consolidated QA and completion audit](qa/README.md) links the individual reports and evidence. The final production build statically prerenders all five routes; repository lint and typecheck passed. Final integration covers 40 page/browser/width combinations plus compact-menu journeys; the independent responsive matrix covers 60 combinations. Overall QA verified 21 production journey/checkpoints.

QA fixes include deferred menu artwork, disabled speculative homepage prefetch, 12px minimum detail labels, a 44px Voice seek target, clearer assurance links and contextual enquiry subjects. Initial resource transfer fell 29–31% across the five routes, and initial JavaScript roughly halved in local production measurements. These are lab results, not field Web Vitals.

No public deployment was performed. The development preview remains available on port 3001.
