# Full-screen site menu

The header's circular menu button opens a full-viewport navigation dialog on desktop and mobile. The native modal puts the rest of the page out of reach until dismissal; its content can scroll independently on short screens.

## Source and inferred layout

The [captured Figma structure](../../design/figma-structure.json) lists only `Dropdown=None` and `Dropdown=Applications` in header component set `225:15821`. It does not provide a full-screen menu reference. This expanded layout is an implementation decision following the user's request, rather than a measured Figma state.

- Reused foundations: the original logo, arrow and menu artwork; local Founders Grotesk and PP Neue Montreal fonts; existing background, foreground, primary, border and focus-ring tokens. No new palette or global tokens were introduced.
- Reused dimensions: the 44px circular trigger and 135.84 × 24px logo from the header, plus the existing 96px desktop / 80px mobile header heights and page gutters. The mobile header height and gutters remain the homepage's documented responsive decisions.
- Reused content: five primary navigation categories and contact destination, plus the four original application links and descriptions from the Applications dropdown.
- Inferred arrangement: large main links beside an application list on desktop; one column with a compact two-column application list below 768px. Descriptions are omitted at this narrow breakpoint; destinations and product names remain available. The close control stays at the top during internal scrolling.
- Inferred motion: GSAP fades the surface in over 280ms and moves its content 12px into place over 360ms. Dismissal reverses the timeline at twice its opening speed. Reduced-motion preferences settle immediately, including when changed while the menu is open.

The component lives in `src/components/home/fullscreen-menu.tsx`, with section-specific layout measurements in `fullscreen-menu.module.css`. `Hero` owns the navigation data and passes it to the component; no parallel menu-content configuration is maintained.

## Behavior and evidence

Opening focuses the close button. Tab and Shift+Tab wrap inside the menu, with native modal inertness protecting background controls. Escape and the close button restore the trigger and the previous page scroll position. Local section links close the menu, unlock the page, and move keyboard focus to the destination heading. The menu remains open when the viewport changes and starts at its top on reopening.

Reproduce against a production server:

```sh
npm run typecheck
npm run lint
npm run build
npm run start -- --port 3001
# In another terminal:
VISUAL_URL=http://127.0.0.1:3001 npm run test:fullscreen-menu
VISUAL_URL=http://127.0.0.1:3001 npm run test:interactions
VISUAL_URL=http://127.0.0.1:3001 node scripts/header-motion-check.mjs
```

The [machine-readable report](results.json) covers Chromium and WebKit at 1600 × 960, 768 × 960, 390 × 844, 320 × 568 and 568 × 320. All 10 cases passed with no browser errors on 2026-10-26. It checks full-viewport bounds, overflow, keyboard containment, unobscured keyboard focus through a complete Tab cycle, focus restoration, internal scrolling, resize behavior, navigation, actual intermediate animation frames, and live reduced-motion changes. Type checking, lint, production build, existing page interactions, and desktop header motion checks also passed. Browser captures are saved alongside the report:

- [Desktop](menu-chromium-1600x960.png)
- [Mobile](menu-chromium-390x844.png)
- [Narrow mobile](menu-chromium-320x568.png)

Equivalent `menu-webkit-*.png` captures provide the second browser comparison. There is no original full-screen Figma frame for an aligned image difference. The existing desktop dropdown's original Figma comparison remains covered by the header motion check.
