# Voice — design and implementation notes

Route: `/capabilities/voice`. Built 28 October 2026. Source content: [live voice extract](source/capabilities--voice.txt); visual baseline: [live page](source/live-voice-overview.png). Uses the existing homepage's Founders Grotesk, variable PP Neue Montreal, P3 role tokens and 48/32/20px gutters.

## Direction

Conversation-led editorial utility. Start with a plain promise, let someone hear a short example, then show where the conversation leads. The sample is the visual anchor: a forest field, a complete audio envelope, three restrained dotted rings and an oversized “Hello.” Its adjacent text makes the idea understandable without playing sound.

This page removes the live site's large purple orb, multiple black/gradient color shifts, dense bento feature section and unsupported latency headlines. It replaces them with one demonstration, an outcome explorer, three operational requirements and a compact launch sequence. Shared foundations stay consistent; content sections are newly designed for Voice.

## Mobbin references inspected

- [ElevenLabs interactive speech section](https://mobbin.com/sites/sections/d5210522-e682-4c78-91b1-e58e80a102d4): small navigation opposite a concrete example. Adopted the explanatory relationship; not the card styling.
- [ElevenLabs audio API demonstration](https://mobbin.com/sites/sections/81b76dd7-5da7-4ac6-9292-c87381d07dc0): short introduction followed by a focused, generous demonstration surface. This informed the hero-to-sample transition.
- [ElevenLabs hero with voice selection](https://mobbin.com/sites/sections/495e17c2-16b4-4441-99a7-ff12b562e1b6): the product is usable in the page instead of being an abstract claim. AtomsAI's sample is explicitly scripted rather than presented as a live agent.
- [Kastle process introduction](https://mobbin.com/sites/sections/a14eaef1-524c-4927-bc6f-ab54dd2aecff): inspected during iteration; generous space and one clear process promise. No decorative 3D assets borrowed.
- [Granola how-it-works](https://mobbin.com/sites/sections/55058dfa-e6bf-460a-9584-02bd4c41e91a): concrete tasks make features understandable. Used real next-step descriptions; avoided repeating its six-card grid.

## Functional details and content integrity

- Existing `/assets/pyai/conversation.mp3` is reused as a **scripted sample**, with a disclosure that no call or booking occurs.
- Audio uses `preload="none"`, so loading begins only when requested. Play/pause, seeking, readable six-turn transcript, and playback failure feedback are available. Audio pauses when scrolled out of view or the document becomes hidden.
- The wave uses the maximum envelope of the two recorded speaker tracks across the entire sample; highlight tracks actual playback time. There is no animation loop or decorative canvas.
- Three workflow tabs support Left/Right/Home/End, roving tabindex, tab/panel relationships, and a keyboard-focusable panel.
- All scenarios are illustrative. Lending decisions explicitly remain with the team. No outcome metrics, compliance certifications, fictional customers, or latency guarantees are introduced.
- Calls to action point to local Contact, Approach and Trust routes; PyAI remains its real external destination.

## Iteration and verification

First desktop/mobile renders found no overflow at 1440, 768, 390 and 320px. Iteration refined the waveform to cover the whole file, narrowed bar gaps for 320px, styled the seeking control with cream/forest roles, and reported footer clipping to the coordinator (fixed in the shared shell).

Reproducible check: `node docs/redesign/voice/check.mjs`. It tests Chromium and WebKit at those four widths, checking one h1, loaded font family, no horizontal overflow, no audio requests before play, tab keyboard behavior, transcript content, actual playback, pause, seeking, pause on scroll, and page errors. Results and final screenshots are stored in `docs/redesign/voice/`.

Scoped ESLint command: `npx eslint src/app/capabilities/voice/page.tsx src/components/pages/voice-page.tsx src/components/pages/voice-interactions.tsx`.
