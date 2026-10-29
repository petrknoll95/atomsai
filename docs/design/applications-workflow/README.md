# Applications workflow variant

Implemented 29 October 2026. This version replaces the homepage's circular application cards while retaining the original component and styles.

- New homepage: http://localhost:3001/#applications
- Preserved original: http://localhost:3001/application-variants/original#applications
- Reference: https://www.amperos.com/ — “What if claims actually kept moving?”

## Reference investigation

Inspected the live DOM, clicked each accordion item, captured every micro-UI scene, and read the site's published browser bundle:
`https://www.amperos.com/_next/static/chunks/0.f64vp-eti.o.js?dpl=dpl_FKngTGG7A2gRGX7y3M9WzSGxnhvk`.

The reference uses four Rive assets (connect.riv, prioritize.riv, work.riv, recover.riv), a React active index, and an 8,400ms interval enabled when the section is at least 20% in view. Manual selection resets its interval. Framer Motion animates accordion positions over 350ms; scenes fade out over 300ms and in over 500ms. Description transitions are 350ms in and 180ms out. The right illustration has a 680:720 aspect ratio; the left text aligns to the bottom. Mobile puts the headline above the scene and accordion below it.

Reference screenshots (each captured after selecting its actual control):

- [Connect](reference/01-connect.png): pale stacked integration cards with light separators and tiny sync indicators.
- [Prioritize](reference/02-prioritize.png): nested metric tiles, a sparse status row, and restrained accent chips.
- [Work](reference/03-work.png): a grid of activity cards; generous white space; simple call, confirmation, and field states.
- [Recover](reference/04-recover.png): small metric cards above a restrained progress chart.

Screenshots include the live site's sticky navigation. They are research artifacts, not production assets.

## Adaptation

Direction: refined editorial product demonstration. DFII 14 (impact 4, fit 5, feasibility 5, performance 4, consistency risk 4).

The original header micro-UI markup, copy, icon assets and internal layout are preserved verbatim: JustCall's conversation and AI summary; Helpwise's shared inbox and internal note; ServiceAgent's conversation and confirmed appointment; CallPage's original browser and callback form. No third-party Rive files or Amperos artwork ship with the implementation.

The visual system uses AtomsAI's existing Founders Grotesk and PP Neue Montreal, forest background, paper outer wrappers, cream interior surfaces and fine green borders. There are no glass effects, shaders or drop shadows in these scenes. A large inset demonstration, a product-logo selector and a single expanded description distinguish the new version from the original product-card grid.

## Interaction and accessibility

- Scene selection is manual only; there is no autoplay timer.
- Crossfades the complete original compositions; their internal structure is unchanged.
- Accordion descriptions expand smoothly and reveal the appropriate real product link.
- Only activating a product trigger changes the scene; hover, focus, scrolling and elapsed time do not.
- Arrow Up/Down and Home/End move focus. Click, Enter and Space activate the focused native button.
- Hidden descriptions are inert and excluded from the accessibility tree. Decorative scenes are aria-hidden.
- Reduced-motion preferences disable CSS motion.
- All selector buttons have 44px touch targets.

The figure deliberately contains only the micro UI: no playback controls, counter, progress bar, product-name heading or illustrative-workflow label. Normalized existing product SVGs replace the original numbered selectors.

## Validation

Targeted ESLint and TypeScript checks passed. Verified the implementation in the in-app browser at 1440px, 1024px, 390px and 320px: no horizontal page or illustration overflow; single expanded panel; product links; pointer selection; keyboard selection. Autoplay was subsequently removed at user request. The original compositions use a fixed 360px design canvas and scale uniformly to their wrapper, preserving the relative layout at small sizes. All four function bodies were checked against the original header previews: only their exported names and stylesheet import differ.

Reduced-motion behavior is implemented in CSS and the media-query subscription; it was not emulated in this browser session. No production build was run; this task was validated against the running development preview. No dependency changes.

Final desktop captures:

- [JustCall](justcall-desktop.png)
- [Helpwise](helpwise-desktop.png)
- [ServiceAgent](serviceagent-desktop.png)
- [CallPage](callpage-desktop.png)

Implementation: `applications-workflow.tsx`, `application-scenes.tsx`, `application-scenes.module.css`, and `applications-workflow.module.css`. The homepage chooses the new component by default. `applications.tsx`, `application-card.tsx`, and the original product styles remain intact; the comparison route passes `applicationsVariant="original"`.

### JustCall reference update

JustCall now follows the supplied AI Voice Agent dashboard reference: a background agent table, an overlapping inbound-call metrics card and a foreground transcript/live-call panel. Its standalone `justcall-scene` component uses only em geometry and three text sizes (1em, 1.25em, 2.5em). Colors resolve directly from the main palette: paper dashboard, cream surfaces and green typography. The host sets one container-responsive font size; this scene bypasses the legacy ResizeObserver/transform scaler used by the other three previews.
