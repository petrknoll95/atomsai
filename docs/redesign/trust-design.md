# Trust Center — design review and refinement

Route: `/trust` · 28 October 2026

## Format and direction

This is a security review reference, so the layout uses an opening section index, evidence rows, a deployment comparison, a data/access summary and a document request directory. It deliberately avoids a wall of certification logos or repeated feature cards. The typography, P3 forest/paper palette and whitespace rhythm come from the existing homepage.

The original live Trust Center is the claim source (`source/trust.txt`). The redesigned page keeps its material limitations: scope/auditor/window are not published; the SOC 2 report and penetration summary are requested under NDA; covered HIPAA workloads require an applicable BAA; GDPR details require the DPA/SCCs and deployment agreement; ISO 27001 is not held; business continuity targets are engagement-specific; there is no public status page. No new certification or performance claim was introduced.

## References

The coordinator's initial Mobbin review is documented in `references.md`:

- [Miro Trust Center](https://mobbin.com/sites/sections/e7f37059-a386-4dd1-b4e5-d41d830ad449)
- [Canva trust hero](https://mobbin.com/sites/sections/573de197-4e3c-43c0-a53c-11a7494d46b1)
- [Maze security](https://mobbin.com/sites/sections/b07657a6-9166-45b2-bdc3-3fc8e29e4534)

An additional Mobbin search during iteration inspected:

- [Clay security and privacy reference](https://mobbin.com/sites/sections/f6b99489-51e8-4c71-b48c-3d752496629f): the content index helps a reviewer locate a specific question without reading everything. The AtomsAI page already uses this principle in its four-part opening navigation.
- [mymind data security](https://mobbin.com/sites/sections/e28ccedd-81eb-490b-9080-26a18395379e): short, direct paragraphs explain implementation details better than decorative assurance badges.
- [Framer security policy](https://mobbin.com/sites/sections/f5d87df7-a5fe-4a58-9ea0-34d5fb07b9b1): numbered information sections support review and cross-reference. The document index now gives each request a quiet ordinal.

## Iteration decisions

Rendered the initial page at desktop and phone widths. Kept the existing calm hierarchy because it already matched the homepage and the page's purpose. Refined the deployment boundary marker into a small outlined security symbol rather than a font glyph. Added an explicit network-egress row to all three deployment states, preserving the important distinction between the customer-controlled cloud and AtomsAI-hosted pilots. Numbered the document request index while retaining the name and availability at reading size. Avoided adding architecture imagery that could falsely place an external model provider within the customer's perimeter.

## Verification

`trust/check.mjs` and `trust/checks.json` cover Chromium and WebKit at 1440, 768, 390 and 320px. Checks include no page errors/horizontal overflow, one H1, keyboard activation of managed deployment, hosted-account and egress changes, nine correctly encoded security email requests, and the primary CTA's document-section navigation. Screenshots are saved in `trust/`. Page-specific ESLint passed. These checks inspect link configuration only; they do not send emails or request any documents.
