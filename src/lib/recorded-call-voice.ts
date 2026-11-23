import type { CallVoice } from './scripted-call-player';

/** Reuse one media element so every turn shares the initial user playback gesture. */
export function recordedCallVoice(audio: HTMLAudioElement): CallVoice {
  let request = 0;
  let paused = false;
  let finished = false;
  let failed: (() => void) | undefined;
  const play = () => {
    const current = ++request;
    audio.play().catch(() => {
      // pause/load reject outstanding play promises; these are not playback errors.
      if (current === request && !paused) failed?.();
    });
  };
  return {
    speak(line, ended, onError, progress) {
      request++;
      audio.onended = audio.onerror = audio.ontimeupdate = null;
      audio.pause();
      failed = onError;
      paused = finished = false;
      if (!line.audio) { onError(); return; }
      audio.src = line.audio;
      const source = audio.src;
      const reportProgress = () => { if (audio.currentSrc === source) progress?.(audio.currentTime); };
      audio.ontimeupdate = reportProgress;
      audio.onended = () => { finished = true; reportProgress(); ended(); };
      audio.onerror = onError;
      play();
    },
    pause() { paused = true; request++; audio.pause(); },
    resume() { paused = false; if (!finished && audio.getAttribute('src')) play(); },
    cancel() {
      request++;
      paused = true;
      failed = undefined;
      audio.onended = audio.onerror = audio.ontimeupdate = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
