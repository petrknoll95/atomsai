# Integrations — variant B

Preview: http://127.0.0.1:3001/integration-variants/marquee#integrations

The original static grid remains at `/#integrations`. B follows the supplied rounded-panel reference: centered pill, heading and supporting copy, then one continuous row of icon tiles with fading edges. It uses the existing AtomsAI font and forest/cream tokens; layout and gradient values are inferred from the supplied screenshot.

The marquee uses Embla 8.6 with its Auto Scroll plugin. It loops continuously, supports dragging, pauses on hover and through an explicit control, and stops when offscreen or the tab is hidden. Reduced-motion preferences disable automatic movement. Icons are the same locally stored Composio assets used by version A; their sources and license are in `public/assets/integrations/`.

Reproduce browser checks and captures:

```sh
node scripts/integrations-marquee-check.mjs
```

Captures cover Chromium and WebKit at 1600, 1024, 390 and 320 CSS pixels. The script checks overflow, icon loading, continuous movement, hover pause/resume, manual pause/resume and reduced-motion handling. Screenshots use reduced motion to stabilize comparison. Type checking, lint and production build also passed.
