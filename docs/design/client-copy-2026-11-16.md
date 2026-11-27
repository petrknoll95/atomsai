# Client homepage copy — 16 November 2026

Source: https://claude.ai/artifact/Nx6KHU8N75nh6NkWmSwhTk

Selected configuration, verified in the live artifact and supplied screenshot:
- Hero V1 · Exploded (operating-model narrative)
- Hero copy B · Works today
- Now it’s your turn V1 · Product UI

## Implementation

Applied the selected copy to the existing homepage components, typography, palette, buttons, illustration shapes, and product UI compositions. No artifact CSS, animation code, grid background, review controls, or alternate DNA copy was imported.

Hero: “AI that works today. Built to get better tomorrow.” The existing animated background is retained. Operating-model intro: “The problem decides the pieces,” with the client’s goals/product/custom-model/person-in-the-loop paragraph. Four existing illustrated cards carry the supplied layer names and descriptions.

The figures now follow the supplied client copy: 7,000+ customers, 20+ countries, 1B+ conversations/year, ~$56M raised from Peak XV, Eight Roads and Base10. These replace the narrower public-source figures used on 11 November; this is client-supplied marketing copy, not a new independent verification of the metrics. Added Helpwise to the product-family strip.

Updated POV, product headings/descriptions, four trust pillars, proof intro, integrations headline, notes labels, closing CTA and homepage footer. Moved integrations after industries to follow the artifact sequence. Existing FAQ remains because the site’s shared navigation links to it.

## Content and functional exceptions

- User confirmed use of the supplied testimonials and article titles on 16 November. Homepage now shows Pinegrove Realty, Brightline Plumbing and Kestrel Freight, with the supplied quotes, attribution and metrics. Notes from the field uses the three supplied article titles, categories, dates and reading times. Article cards have no links until actual article destinations/bodies are provided; existing blog pages remain unchanged. No customer film or article bodies were fabricated.
- Superseded 17 November: at the user’s request, “Have the agent call me” starts the artifact’s scripted JustCall conversation inside the existing card, with pause/replay, language switching, handoff and SMS outcomes.
- Superseded 17 November: ServiceAgent’s three supplied call scripts now play with ElevenLabs recordings, synchronized to the existing workflow cards. See `scripted-demos-2026-11-17.md` for sources and verification.
- PyAI’s playground and API links use actual product destinations. Browse all integrations opens the published JustCall integration directory; the artifact’s placeholder #talk destination was not used.
- Existing navigation architecture is retained. Homepage footer uses Products / Platform / Industries / Company / Legal with working existing destinations. No unconnected newsletter form, nonexistent newsroom page, or unsupported status link was added.

## Validation

Production build and TypeScript passed. ESLint: no errors, three pre-existing warnings. Reviewed in Chrome at the default desktop viewport (1728px) and 390px mobile. Confirmed selected copy, product accordion keyboard navigation, API/playground destinations, proof/footer anchors and no horizontal overflow. Browser diagnostics contained only extension warnings, with no application errors. The original illustration geometry and brand palette were not edited in this pass. Preview screenshot: `/tmp/atoms-client-copy-2026-11-16/homepage.jpg`.

## Original design restored — 16 November follow-up

Restored the existing `Stories` carousel instead of the replacement three-column testimonials. The supplied Pinegrove, Brightline and Kestrel copy now fills its original portrait, large quote, attribution, company row and metric-card layout. Portrait slit transitions, autoplay/pause, navigation, pagination and the existing detail dialog are retained. Added only the supplied proof introduction above the carousel. Product attribution links point to the corresponding product or approach page.

Restored the original `Industries` circular carousel with the four approved industry descriptions. Existing footer anchors select the corresponding industry. Its geometry, hover treatment, controls and animations are unchanged. New trust content directly reuses the Trust Center control-grid styles; the field notes reuse the blog archive row and card-copy styles. Removed the discarded testimonial columns and industry-row implementation and styles.

Existing portrait images are illustrative placeholders, not verified photographs of the newly named customers. Existing industry imagery is retained pending category-specific replacements, especially home services and education. Client logos, photography, films and article bodies were not supplied.

Checked desktop (1728px) and mobile (390px), with no horizontal overflow. Verified story selection, pause, dialog open/close, industry controls and footer deep links. Production build and TypeScript passed; lint has no errors and the same three pre-existing warnings.

## Connected operating model — 16 November

Replaced the repeated layer index and four offering cards with one connected operating-model section, as requested in the follow-up screenshot. The approved introduction and four descriptions are unchanged. A new three-level isometric drawing uses forest linework and Iris surfaces on the existing light page; a surrounding build/learn circuit represents custom engineering. The other existing illustration assets and shapes were not changed.

The four accordion controls synchronize with the drawing. Up/down and Home/End keys support keyboard exploration; hidden descriptions are inert. Decorative circuit motion pauses offscreen and is disabled for reduced-motion preferences. Layout uses three desktop columns, two tablet columns and a single mobile column. The section retains the existing `#offerings` destination and all four product/approach/contact links.

Drawing source: https://app.quiver.ai/library/01a1e3f8-d568-74fd-a3a2-0b3ab147a2fd . Local artwork is grouped for interaction, has no scripts or external resources, and has been normalized to the published brand palette. Checked at 1728px and 390px with no horizontal overflow; production build, TypeScript and targeted ESLint pass.

## Refinement and public copy cleanup — 16 November

Reworked the operating-model artwork into three circular decks on one axis, with a shared enclosing circuit, tighter framing, stronger layer contrast and a connector from the chosen layer to its explanation. The connector tracks accordion size changes and is omitted on smaller screens. The three-layer assembly remains a new illustration; existing illustrations elsewhere are unchanged.

Removed the added illustrative/demo/placeholder notices from the homepage, PyAI visual, voice page, healthcare page and workflow, and approval-flow label. Removed the scripted-sample badge and equivalent screen-reader wording. Client copy and working product links remain. Source limitations stay in internal documentation, not the public page.

## Three.js simplification — 16 November

Replaced the detailed generated SVG with a genuine Three.js WebGL scene: three thin circular surfaces and one enclosing circuit. Removed the ribbing, application tiles, workflow nodes, crossing lines and separate SVG connector. The selected surface receives an Iris edge fade and a small lift. Clicking a surface selects its matching description; the existing accordion remains keyboard accessible.

Three.js loads only when the scene approaches the viewport. Rendering is capped at 30 fps and pauses offscreen or in a hidden tab. Reduced motion renders a still frame and changes selection immediately. Pixel density is capped at 2. Geometry, materials, observers and the WebGL context are cleaned up on unmount. A simple CSS stack remains if WebGL is unavailable; there is no generated SVG dependency.

Validated direct canvas selection, accordion selection, desktop and 390px mobile sizing, with no horizontal overflow or Three.js errors. Build, TypeScript and targeted ESLint pass. Added three and @types/three 0.187.0.
