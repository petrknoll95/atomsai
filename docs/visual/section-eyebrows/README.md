# Clickable section eyebrows

The shared `Eyebrow` component now requires an explicit destination and renders a pill anchor with a circular arrow inset. Its arrow path is the original right-arrow artwork used by the industry controls. Colors inherit the existing light/dark semantic tokens; hover uses primary fill, and keyboard focus retains the shared subtle 4px ring.

Applied to the homepage section and preview labels and the integrations B variant. Existing alignments are retained. Industries links to its overview, Customer Stories to case studies, and technology/preview labels to PyAI or its playground.

Destination checks on 2026-10-28: `/applications`, `/faq`, `/help-center`, and `/integrations` on atomsai.com returned 404. Applications retains the existing local section destination; FAQ and Integrations use the existing contact page pending dedicated overview pages.

Run `node scripts/section-eyebrows-check.mjs` with the development server on port 3001 to regenerate Chromium/WebKit captures and check links, focus rings and 320/390px overflow. Typecheck, lint and production build passed.
