<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Local preview and build checks

Use `npm run dev -- --port 3001` for the editing preview. It writes to
`.next-preview/`, separately from production `.next/`. Never rebuild `.next/`
while a `next start` process is serving it: missing CSS chunks previously let
a decorative shader cover the whole page. Stop production preview processes
before rebuilding; keep the development preview running for the user.
