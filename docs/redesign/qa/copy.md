# Independent copy QA

Reviewed 28 October 2026. Scope: `/approach`, `/capabilities/voice`, `/industries/healthcare`, `/trust`, `/company/contact`, plus shared footer copy. Implementation was not edited by this reviewer.

**Final verdict: pass.** No blocking claim, grammar, CTA-expectation or sample-disclosure issue was found in the new page content. The coordinator corrected all three minor findings below; this reviewer verified the rendered fixes. No open copy findings remain.

## Findings

| Severity | Location | Evidence | Recommended correction |
| --- | --- | --- | --- |
| P3 — inherited shared copy | `src/components/home/site-footer.tsx`, assurance badges | The footer reads “SOC II”; the Trust Center and saved live source correctly name “SOC 2 Type II.” The inherited abbreviation is ambiguous and now appears across all five secondary pages. | Use visible “SOC 2”; give the full label in accessible text or a link to `/trust#scope` so report scope is easy to find. |
| P3 — inherited context | `src/components/home/site-footer.tsx`, inactive Cookie Preferences title | Tooltip says “This homepage does not use optional cookies” on Contact, Trust and other secondary pages. | Make the wording page-neutral, e.g. “This site does not use optional cookies,” provided it remains consistent with actual tracking behavior. |
| P3 — conditional state | `src/components/pages/contact-form.tsx`, topic introduction | `?topic=services` renders “Let’s talk about ai services.” because all topic labels are lowercased. “AI Services” is the established offer name used by the homepage and navigation. | Preserve “AI Services” in this sentence; use sentence-ready labels rather than lowercasing acronyms. |

No request to change the established tone or add more copy is necessary.

## Remediation verified

The current preview now shows “SOC 2,” with “SOC 2 Type II — review scope and documentation” as the accessible label. All three footer assurance topics link to `/trust#scope`. The cookie tooltip now reads “This page does not use optional cookies.” The services-topic introduction preserves “AI Services.” The security-topic review correctly creates a draft addressed to security@atomsai.com without sending it. Evidence: [copy/remediation.json](copy/remediation.json).

Page-specific contact links now pass the appropriate topic, preserving context from Voice, Healthcare, Approach and Trust. This is consistent with the existing composer behavior.

## Evidence and method

- Read all page markup and client-state copy, plus `site-footer.tsx` and the homepage’s shared wording.
- Compared service ownership/delivery, voice workflows, healthcare connections and controls, Trust disclosures and contact addresses with the saved live main-content extracts in `docs/redesign/source/`.
- Inspected actual rendered text on the current development preview with Chromium: all five default pages; all Approach/Healthcare disclosures; all three Voice workflows; the full voice transcript and failed-audio message; all three Healthcare scenarios; all three deployment modes; Contact prepared-review, copy-failure, retained-edit and services-topic states.
- Saved the rendered strings and state evidence in [copy/rendered-states.json](copy/rendered-states.json). Fictional QA form inputs were used; no email was sent and no mail application was opened.
- Source support means consistency with the company's current public content, not independent certification or contractual verification. The redesigned copy correctly directs readers to the actual reports and agreements.

## Page-by-page assessment

### Approach

The five-step sequence preserves teardown, blueprint, build/integration, evaluation/hardening and handover. Inspectable outputs are clear, with practical client inputs behind native disclosures. Repository ownership and license wording are supported by the live Approach source. The approval diagram is explicitly illustrative. There are no fabricated completion times, cost savings, client outcomes or certification banners. The softer, practical invitation matches the new homepage more closely than the live page’s confrontational copy.

### Voice

The headline, call-to-action and sample card describe the same activity. The displayed excerpts match the supplied transcript. “Scripted sample” and “No call is placed and no viewing is booked” distinguish playback from a live agent. The rounded 28-second label is consistent with the 27.58-second audio metadata. The workflow panels remain illustrative; the lending panel expressly leaves lending decisions with the team. The audio error offers a real alternative: retry or read the transcript. PyAI attribution is supported by the live source. No latency or capacity claims were imported without context.

### Healthcare

The morning timeline and changed appointment are labelled illustrative, and the explorer clearly states that no patient data or live system is connected. The integration list is qualified by access, APIs and engagement scope. Medical advice remains with the care team; clinical questions use agreed escalation rules. The redesigned page avoids the live page’s absolute first-ring/no-missed-call outcomes and illustrative before/after statistics. BAA and deployment review are described accurately rather than treating HIPAA as a blanket certification. Questions and CTAs are concrete and approachable.

### Trust Center

SOC 2 report availability, unpublished audit scope, HIPAA BAA, DPA/SCCs, penetration-test summary, absent ISO 27001 status and per-engagement continuity targets all match the saved Trust Center source. The hosted-pilot panel distinguishes ownership and control from the default customer-cloud modes. Training, retention, deletion and access statements are source-backed. Documents are explicitly email requests, with NDA/engagement conditions; nothing is presented as an immediate download. Public status availability matches the source. Technical terms are appropriate to the intended security-review audience, and important abbreviations are expanded in the surrounding copy.

### Contact

“Prepare email” accurately names the first action. The review states that nothing has been sent and requires the visitor to finish in their email app. Recipient, subject and reply address are visible. Clipboard success/failure messages give usable next actions, and editing preserves the draft. The direct-email/no-JavaScript fallback is explained. All required fields are identified by a concise note. Department addresses match the live Contact source. No invented response-time guarantee or calendar reservation is promised.

## Shared tone and consistency

The pages use the homepage’s short, concrete statements and consistent offer names: AtomsAI, PyAI and AI Services. Enquiry/organise/authorisation wording is internally coherent. Illustrations are framed as examples rather than customer evidence. Primary CTAs lead to an enquiry, not a claimed booking. The copy varies with the page format and does not repeat entire homepage sections.
