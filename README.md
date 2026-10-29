# AtomsAI homepage

Next.js App Router, React, TypeScript, Tailwind CSS v4, Embla Carousel and GSAP. The implementation targets the original 1600px Figma homepage, with restrained responsive layouts.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production: `npm run build && npm start`.

Use `npm run dev -- --port 3001` for the live editing preview. Development uses
`.next-preview/`; production builds use `.next/`, so running build checks cannot
remove chunks being served by the preview. Stop a production server before
rebuilding its output. See [reload failure regression evidence](docs/visual/reload/README.md).

## Structure

- `src/app/`: page composition, metadata, fonts and global styles.
- `src/components/home/`: meaningful page sections and their scoped styles. The Applications dropdown stays with the header; the industry carousel uses Embla.
- `src/components/ui.tsx`: the two demonstrated shared elements, `ButtonLink` and `Eyebrow`.
- `src/styles/tokens.css`: source palette primitives (`--palette-*`), semantic roles (`--color-*`), type sizes, spacing, radii and effects. Tailwind v4 exposes the same roles as utilities. Section-specific measurements stay beside their section.
- `public/assets/figma/`, `public/assets/brand/`, `public/fonts/`: local original assets and verified delivery derivatives. Runtime has no dependency on temporary Figma URLs.
- `docs/design/`: source inspection, provenance, source conflicts and inferred decisions.
- `docs/visual/`: original exports, browser captures, aligned overlays, differences and machine-readable results.

## Verify

```sh
npm run typecheck
npm run lint
npm run build
# With the app running in another terminal:
npm run test:interactions
npm run test:browsers
npm run test:fullscreen-menu
npm run test:smooth-scroll
npm run visual
npm run visual:header
```

Install browser runtimes if necessary: `npx playwright install chromium webkit`. Set `VISUAL_URL` to check a production server instead of port 3000.

Read [design provenance and decisions](docs/design/README.md) and [visual verification](docs/visual/README.md), or open the [offline comparison viewer](docs/visual/index.html). The property chat uses a local response; microphone conversation opens the verified PyAI playground. No backend, analytics or optional cookies are included.

The circular header button opens a full-screen menu with GSAP transitions, keyboard focus containment, scroll locking and reduced-motion support. Read its [layout decisions and browser evidence](docs/visual/fullscreen-menu/README.md).

GSAP ScrollSmoother provides desktop page scrolling while the header stays visible. Touch scrolling remains native; reduced motion disables smoothing. See the [scrolling behavior and browser evidence](docs/visual/smooth-scroll/README.md).

## Procedural patterns

All homepage pattern placements use the configurable WebGL2 components, including the separate WebKit chat-glass backdrop. The four application cards each reveal a different pattern through a GSAP hover/focus transition. They render from numerical geometry and gradient data; original pattern images are used only for comparison. Open `/patterns` for the studio and an original-Figma overlay.

Read [component usage, source provenance and limitations](docs/patterns/README.md), or open the [pattern comparison viewer](docs/patterns/index.html). Run `npm run visual:patterns` and `npm run test:patterns` with the app running; both accept `VISUAL_URL`.

Read the [homepage integration notes](docs/patterns/homepage/README.md) and [homepage pattern comparisons](docs/patterns/homepage/index.html). Reproduce with `npm run visual:home-patterns` and `npm run test:home-patterns`.

Read the [application hover decisions and evidence](docs/patterns/application-hover/README.md). Reproduce its pointer, keyboard, reduced-motion, touch and visual checks with `npm run test:application-hover`.

Explore four subtle, palette-preserving loops at `/patterns/motion`. The isolated page includes pause, scrub, intensity, duration and still-comparison controls. See [motion implementation and evidence](docs/patterns/motion/README.md); reproduce with `npm run test:pattern-motion`.

## GitHub Pages

The site is published at https://petrknoll95.github.io/atomsai/ by
`.github/workflows/pages.yml` on every push to `main` (or manual workflow run).
The workflow builds a static export with `GITHUB_PAGES=true` and
`NEXT_PUBLIC_BASE_PATH=/atomsai`, then deploys `out/` using GitHub Pages.
Local development continues to run at `/`. Public asset references and native
links use `src/lib/base-path.ts`; CSS assets are bundled from relative paths.
The pattern render tool reads query parameters in the browser so it also works
without a Next.js server.
