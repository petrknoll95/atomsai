# Contact — design and verification

28 October 2026. Route: `/company/contact`.

## Design

A quiet invitation and a short enquiry composer share the opening desktop view. The headline uses the homepage's Founders Grotesk; form labels and body use PP Neue Montreal, with original paper, cream and forest tokens. A restrained directory provides direct routes to security, partnerships, press and careers. No repeated hero CTA band is added at the end.

The first visual iteration placed preparation notes above the form on mobile. The final layout moves those notes after the composer on narrow screens, keeping all information while letting visitors reach the form sooner. Desktop retains the notes beneath the invitation. The directory uses hairlines and whitespace rather than a grid of filled cards.

## Mobbin references

All referenced section previews were visually inspected.

- [Webflow contact](https://mobbin.com/sites/sections/fb3e819a-5e40-48d3-ac97-6bd97e4c09b0): useful simultaneous value proposition/form composition; AtomsAI reduces the qualification fields to four.
- [ElevenLabs contact](https://mobbin.com/sites/sections/1fcc9815-5a83-43b1-ae79-4058e07bdd52): a clear first action in an otherwise spacious page. AtomsAI's two steps explain the real email handoff, not lead qualification.
- [Framer contact](https://mobbin.com/sites/sections/914df681-c24d-4800-bd11-9c144d0175fb): proximity of invitation and enquiry informed the opening layout. Its gradient and longer field set were not carried over.
- Refinement: [Kinfolk contact directory](https://mobbin.com/sites/sections/6cb3e00e-8b20-4b10-a2c0-bcae37320da1) uses hairlines and concise routing information; [Kalstore contact](https://mobbin.com/sites/sections/237ef7b5-9b93-4a84-be17-6cbc039c873e) makes email destinations direct and scannable.

## Actual delivery behavior

There is no submission backend. Visitors fill name, company, email and message; native validation and whitespace checks run before review. Review shows recipient, subject, reply address and the message. “Open email app” is an encoded mailto link; nothing is sent by the website. “Copy email details” handles clipboard rejection by exposing and selecting a manual-copy textarea. “Edit message” preserves values. Inputs stay only in component memory, with no storage or external request.

Known `?topic=` values personalize the subject. Security/trust routes use security@atomsai.com; other topics use hello@atomsai.com. Unknown topics are ignored. Department email addresses come from the current live Contact page. No response-time guarantee or invented calendar availability is added.

Server-rendered form controls are disabled until hydration, preventing accidental fallback GET submission of enquiry data. A noscript direct-email link is present. No message was sent during testing.

## Verification

`contact/checks.json`: Chromium and WebKit, 1440/768/390/320px. All return 200, one h1, no page errors and no horizontal overflow. Verified empty required fields block review, prepared content is encoded correctly, focus moves to the review heading, clipboard failures have an accessible fallback, and edit retains inputs. JavaScript-disabled submit controls and email fallback verified in both engines. Final captures refreshed after the mobile order adjustment.

Targeted ESLint and repository typecheck passed. Parent owns final production build and independent QA. Screenshots are in `contact/` and include initial/review states; review evidence contains fictional QA inputs only.

## Files

- `src/app/company/contact/page.tsx`
- `src/components/pages/contact-form.tsx`
- `src/components/pages/contact.module.css`
