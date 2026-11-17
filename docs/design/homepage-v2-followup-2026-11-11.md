# Homepage V2 follow-up — 11 November 2026

Local changes on `codex/copy-edits-11-11-2026`. Existing brand illustration shapes and geometry are unchanged in this pass.

## Implemented

- Early company/product strip with JustCall, ServiceAgent and PyAI marks; sourced proof with product attribution.
- SaaS Labs → AtomsAI announcement in the hero.
- A quiet four-step connection above the existing layer cards.
- Scenario selectors update the existing JustCall and ServiceAgent compositions. PyAI field selectors highlight the example JSON and explain each field. All are labeled illustrative; no calls are placed, recordings played, or live inference implied.
- Replaced the homepage’s unsubstantiated testimonial carousel with one published JustCall case study and explicitly labeled ServiceAgent/custom engineering workflow examples. The shared legacy carousel remains available elsewhere.
- Three existing articles under Notes from the field.
- Closing Explore products CTA and footer industry links matching the V2 audience. Links use existing local sections rather than unimplemented industry routes.

## Public sources checked

- https://justcall.io/customer-stories/ — 6,000+ businesses. This is attributed to JustCall, not to the full AtomsAI group.
- https://justcall.io/product/ai-voice-agent/ — powering over a billion conversations. The homepage does not add an unsupported annual timeframe.
- https://atomsai.com/ — team behind JustCall, backed by Peak XV and Base10.
- https://justcall.io/customer-stories/how-drivesavers-captures-urgent-inquiries-across-europe-and-asia-pacific/ — five AI Voice Agents; more than 1,000 calls in the first three months. The new card paraphrases this story and links directly to it.
- https://pyai.com/playground — live audio/transcription/voice demos; linked as the route to live product output.
- https://serviceagent.ai/ — describes booking, CRM and front-office workflows. Its public testimonials contain fictional names and were not used as evidence.

## Still requires approved material

- JustCall live-call endpoint/embed and its consent flow. Current CTA opens the official demo booking page.
- ServiceAgent sample call recordings. The supplied V2 prototype uses speech synthesis for scripted examples, not product recordings; no synthetic substitute is presented as product performance.
- Approved customer evidence for ServiceAgent and custom engineering. Their cards are labeled workflow examples until that is available.
- Confirmation of V2’s group-level 7,000 customers, 20 countries, 1B conversations/year and ~$56M funding. Current proof intentionally uses narrower public claims instead.

## Validation

Production build and TypeScript passed. ESLint had no errors (three pre-existing warnings). Chromium desktop/mobile checks passed with motion enabled: keyboard navigation, scenario updates, PyAI field selection, article links, closing CTA, page overflow and runtime errors. WebKit desktop/mobile checks passed with reduced motion. The motion-enabled WebKit automation could not stabilize a click target while the existing smooth-scroll system was active; that run is not recorded as a pass. Screenshots saved under `/tmp/atoms-v2-followup/`.
