'use client';

import { useEffect, useRef, useState } from 'react';
import voiceAudio from './voice-audio.json';
import { ButtonLink } from '../ui';
import styles from './voice-preview.module.css';

const playground = 'https://pyai.com/playground';

/** One continuous dialogue and two speaker envelopes on the same timeline. */
export function VoicePreview() {
  const rows = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const shouldPlay = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(false);

  const pause = () => {
    shouldPlay.current = false;
    audio.current?.pause();
    setPlaying(false);
  };

  useEffect(() => {
    const player = audio.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) pause();
    });
    if (rows.current) observer.observe(rows.current);
    const onHidden = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      shouldPlay.current = false;
      player?.pause();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, []);

  useEffect(() => {
    const waves = Array.from(rows.current?.querySelectorAll<HTMLElement>('[data-wave]') ?? []);
    let frame = 0;
    const draw = () => {
      const time = audio.current?.currentTime ?? 0;
      const progress = Math.min(100, time / voiceAudio.duration * 100);
      waves.forEach((wave, index) => {
        wave.style.setProperty('--played', `${progress}%`);
        wave.parentElement!.dataset.speaking = String(playing && voiceAudio.turns.some(
          turn => turn.speaker === index && time >= turn.start && time < turn.end));
      });
      if (playing) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const toggle = async () => {
    const player = audio.current;
    if (!player) return;
    if (shouldPlay.current) { pause(); return; }
    if (player.ended) { player.currentTime = 0; setElapsed(0); }
    setError(false);
    shouldPlay.current = true;
    setPlaying(true);
    try {
      await player.play();
      if (!shouldPlay.current) player.pause();
    } catch {
      if (shouldPlay.current) { pause(); setError(true); }
    }
  };
  const duration = voiceAudio.duration;
  const remaining = Math.max(0, Math.ceil(duration - elapsed));
  const timeLabel = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

  return <div className={styles.capsule}>
    <audio ref={audio} src={voiceAudio.src} preload="none"
      onEnded={() => { shouldPlay.current = false; setPlaying(false); setElapsed(voiceAudio.duration); }}
      onTimeUpdate={() => setElapsed(audio.current?.currentTime ?? 0)}
      onError={() => { pause(); setError(true); }} />
    <div className={styles.labels}>
      <ButtonLink href={playground} target="_blank" rel="noopener noreferrer" size="small">PyAI</ButtonLink>
      <ButtonLink href={playground} target="_blank" rel="noopener noreferrer" size="small" className={styles.voiceType}>Voice Assistant</ButtonLink>
    </div>
    <div ref={rows} className={styles.rows} aria-hidden="true">
      {voiceAudio.speakers.map((clip, row) => <div className={styles.row} key={row}>
        <img className={styles.avatar} src={`/assets/pyai/${row ? 'assistant.svg' : 'speaker.png'}`} width="48" height="48" alt="" loading="lazy" />
        <div className={styles.wave} data-wave>
          {[false, true].map(played => <div key={String(played)} className={played ? styles.playedBars : styles.bars}>
            {clip.heights.map((height, index) => <span key={index} style={{ height }} />)}
          </div>)}
        </div>
      </div>)}
    </div>
    <div className={styles.playback}>
      <button type="button" className={styles.play} onClick={toggle} aria-label={playing ? 'Pause PyAI demo' : 'Play PyAI demo'} aria-pressed={playing}>
        {playing ? <span className={styles.pause} aria-hidden="true" /> : <img src="/assets/pyai/play.svg" width="40" height="40" alt="" />}
      </button>
      <div className={styles.caption}><span>PyAI Demo</span><span className={styles.duration}>{timeLabel}</span></div>
    </div>
    {error && <span role="status" className={styles.error}>Audio unavailable. Please try again.</span>}
  </div>;
}
