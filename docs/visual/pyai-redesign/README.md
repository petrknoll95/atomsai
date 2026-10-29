# PyAI voice preview

Source: Figma file pLyUMYhdCUYzwz0UXPtGY8, section 298:6484, capsule 298:6513.

Measured: 736×360 capsule, 32px top/bottom offsets, 80px waveform rows with an 8px gap, 48px speaker images, 18px backdrop blur, white 10% glass. Both waveforms retain the 106-bar design density; their heights now come from the RMS amplitude of each individual recording. Portrait, assistant mark, and play icon are original Figma exports in public/assets/pyai. Existing green shader and site palette remain shared foundations.

Responsive assumption: below 560px container width, capsule corners become 32–64px, row padding/gaps compress, and waveform bars fit available width. No mobile source variant was supplied.

Audio: regenerated with ElevenLabs eleven_v4, Jeremy B. — Casual, Warm, Natural (`btaSeNTVh1pGx4pjFzub`, caller) and Jessica (`cgSgspJ2msm6clMCkdW9`, assistant), 2026-10-28. Six alternating conversational turns, assembled into one 27.58-second mono 96kbps MP3 (`conversation.mp3`). Each turn is normalized to -18 LUFS, outer silence trimmed with a short breath preserved, and separated by 220ms. A single player preserves gapless playback, pause/resume, and replay without per-turn network requests. This is a scripted sample, not a live backend conversation. Audio downloads only on play.

Each speaker's 106-bin RMS envelope spans the full 27.58-second conversation, with zero amplitude (3px flat bars) while the other speaker talks. Both playback sweeps advance together using the same audio clock; each avatar gets a subtle ring during its speaker's turn. The UI retains the two-row design. `voice-audio.json` records the exact turn timings, transcript and source generation IDs.

Transcript:
- Caller: Hi, uh, I'm calling about the two-bedroom apartment near the station. Is it still available?
- Assistant: Yes, it is! What sort of budget did you have in mind?
- Caller: Around twenty-five hundred a month. And, ideally, somewhere with a balcony.
- Assistant: Then the place on Maple Street could be a good fit. Would you like to see it on Saturday at ten?
- Caller: Yeah, that works. Can you text me the address?
- Assistant: Of course. I'll send the address and viewing details to this number. See you Saturday!

Verification: run `node scripts/pyai-preview-check.mjs` with dev running on port 3001. Chromium and WebKit checks cover real playback, all six speaker handoffs, equal playback sweep positions, silent bins during the other speaker’s turns, pause, resume, end/replay, and no page overflow at 1598, 1024, and 390px. Screenshots are captured alongside this file. Typecheck and lint passed for the dialogue update.

Comparison: figma-capsule.png is the original export; chromium-capsule.png is the browser capture at the reference viewport. overlay.png is a 50% aligned overlay at 736×360. Geometry and bars align; backdrop appearance differs because the isolated Figma export cannot reproduce the live animated shader. Duration intentionally differs; fonts have normal browser rasterization differences.

Organization: VoicePreview owns playback and scoped glass styles; voice-waveforms.ts preserves the source geometry for reference; voice-audio.json stores the shared recording, speaker turn timings, and measured waveform heights. No global token changes were needed.

Rebuilding: `python3 scripts/build-pyai-audio.py /path/to/takes` takes a script.json manifest and numbered turn-N.mp3 files. It normalizes and assembles audio and computes both aligned speaker envelopes. The caller was replaced with a voice selected for natural cadence and disfluencies; the assistant takes were preserved.
