# Homepage scripted demos — 17 November 2026

Requested scope: replicate the client artifact’s scripted demos while keeping the existing homepage design. The user explicitly requested ElevenLabs for any audio.

Source: https://claude.ai/artifact/Nx6KHU8N75nh6NkWmSwhTk . The published artifact’s inline scripts supply the JustCall interrupt/language/follow-up conversations and ServiceAgent repair/reschedule/billing calls. JustCall keeps the existing Steven Carter identity in place of the artifact’s Ava. Its transcript is timed, as in the artifact; ServiceAgent uses recorded audio.

Existing product accordion, desktop composition, cream cards, dark visual surface, scenario pills and ghost buttons are retained. Playback controls occupy the existing call bar and workflow header. At narrow widths, the JustCall conversation uses the available column at a readable 14px instead of shrinking the entire decorative illustration; the cream card styling stays the same. The workflow steps follow the spoken conversation. An expandable transcript supports silent reading. Audio only starts from an explicit click, pauses on product changes, when the section leaves view and when the page is hidden, and is disposed on navigation. Scenario changes cancel the previous playback.

## ElevenLabs assets

Generated using the connected ElevenLabs plugin and `eleven_v4` from the exact six caller and six agent turns. Long pauses separated turns, then recordings were split at detected silence boundaries into twelve 96 kbps mono MP3s. Total audio payload is approximately 712 KB and loads only during playback. No runtime voice API or key is required.

- Caller: Jessica — voice `cgSgspJ2msm6clMCkdW9`; generation `6yIii7Ma8SHrgJCeMVH4`.
- Agent: Danny — voice `W93ubvztnBbrUnasPBDG`; generation `Fd5wT0ID9CMANZxkPyGc`.
- Flow: https://elevenlabs.io/app/flows/dHKYvzGH7VEt2GWivpwH .
- Files: `public/assets/demos/serviceagent/{repair,reschedule,billing}-{1,2,3,4}.mp3`.

These implement the artifact’s scripted experiences; no real telephone, SMS, CRM or dispatch integration is added. This implementation note is internal, not public-facing page copy.

## Validation

- Production build, TypeScript and targeted ESLint pass.
- Eight player tests cover pause/resume timing, stale callbacks on scenario changes, unmount cleanup, failure/retry, stalled playback, media promise cancellation, turn-boundary resume and handoff.
- Audio files are valid, independently decodable MP3s with full spoken turns. Browser checks confirm actual local MP3 playback and advancing workflow steps.
- Desktop and 390px mobile checks confirm pause/resume, replay, changing scenarios, product-switch and offscreen pausing, completed call outcomes, transcript expansion, JustCall SMS and handoff outcomes, and no horizontal overflow.
