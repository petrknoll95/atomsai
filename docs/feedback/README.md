# Shared website feedback

Open Feedback to pin comments anywhere, reply, or resolve threads without signing
in. The dark bottom-right launcher opens Pindrop.js; pins remain clickable in
pointer mode. Comments are shared with other visitors, not private messages.

The integration reuses the `atomsai-guideline-feedback` Firebase project and its
existing Firestore rules. Website scopes are `atomsai-site:<pathname>`; local
preview scopes are `preview:atomsai-site:<pathname>`. Neither shares threads with
the guidelines. Route changes destroy the old overlay and subscriptions.
Firebase and Pindrop are loaded only after opening feedback.

`src/components/feedback/firebase.ts` contains public web-app identifiers, not an
admin credential. The key is restricted to Firestore, Identity Toolkit, and
Token Service. Data authorization is enforced by the existing Firestore rules:
guests can edit/delete only their own entries, and payloads are validated.
App Check is not enabled. No Firebase setup or billing upgrade is required.

Run `npm run test:feedback` against the development preview on port 3001. It checks
two independent guests, replies, persistence, pointer-mode pins, close/reopen,
page isolation, client navigation cleanup, and mobile. Verification notes are
created in the local-preview scope. Use Node 24.12+ for Firebase's declared
package engine support.

## Submission context

New top-level website comments store `meta.context` containing a best-effort
browser name/version, layout viewport width/height in CSS pixels, device pixel
ratio, and page origin/path. Query strings and fragments are omitted. Capture is
synchronous on first submit, retained on retries, and immutable on later edits.
Replies do not overwrite the original context. Older comments remain supported.
Browser information is client-reported diagnostic context, not trusted identity.

Open a thread and expand **Browser & viewport** to see its submission context.
The shared rules in `firebase/firestore.rules` were published on 2026-10-28;
they validate the optional metadata and prohibit changes to it. The same rules
source is mirrored in the guidelines repository. UI deployment does not publish
rules automatically. Run `node scripts/feedback-rules-check.mjs` to verify live
validation and ownership using temporary records that are cleaned up afterward.

## Smooth scrolling

While feedback is open, `track-smooth-pins.ts` updates pin coordinates after GSAP
renders each frame. This follows ScrollSmoother's transformed content even after
native scroll events stop, without rebuilding comment threads. Dragged pins stay
under Pindrop's control; native/reduced-motion scrolling uses Pindrop's normal
tracker. The ticker callback is removed on route changes/unmount.
Run `node scripts/feedback-scroll-check.mjs` to measure attachment throughout
scroll catch-up in both directions (2px tolerance). Temporary test data is removed.

## Menus and screenshot attachments

The feedback controls follow the active native dialog into its top layer, so the
site menu cannot cover or make them inert. Comments retain their page and screen
in immutable metadata. Menu groups are separate screens: their pins reappear when
that group is reopened, without appearing on the underlying page. Older comments
default to the page screen.

New comments attempt to capture a crop around their anchor at submission
(maximum 480 × 320 pixels). The compressed JPEG is stored with the comment and
shown inside **Browser & viewport**. Feedback controls, embedded frames, video,
form fields, editable content, and elements marked `data-feedback-private` are
excluded. This is a best-effort DOM rendering; cross-origin images and dynamic
graphics may differ or be missing. Capture failure or an eight-second timeout
does not prevent saving the comment. Attachments are capped at 120,000 characters
and validated by Firestore rules; no separate Storage service is required.

Run `node scripts/feedback-menu-check.mjs` for desktop/mobile menu pinning,
screenshot persistence after reload, page isolation, and opening feedback while
the menu is already open.
