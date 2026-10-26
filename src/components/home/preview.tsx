'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ButtonLink, Eyebrow } from '../ui';
import { MotionPattern } from '@/components/patterns/motion-pattern';
import { HomePattern, homePatternPlacements } from '@/components/patterns/home-pattern';
import styles from './products.module.css';

const playground = 'https://pyai.com/playground';

function PropertyPreview() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState('');
  const [visitor, setVisitor] = useState('I’m looking for a two-bedroom home near a park.');
  const [reply, setReply] = useState('');

  function startPreview() {
    setStarted(true);
    inputRef.current?.focus();
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (!value) {
      startPreview();
      return;
    }
    setStarted(true);
    setVisitor(value);
    setReply('Which area would you like to live in, and what matters most to you in a home?');
    setQuestion('');
  }

  return (
    <article className={styles.previewColumn}>
      <svg className={styles.effectDefinitions} aria-hidden="true" focusable="false">
        <defs>
          <filter id="property-linear-burn" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 -0.2 0 1 0 0 -0.2 0 0 1 0 -0.2 0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
      <div className={styles.chatWidget} id="property-preview">
        <HomePattern application="preview-concentric" className={styles.chatPattern} />
        <div className={`${styles.chatGlass} ${started ? styles.chatStarted : ''}`}>
          <div className={styles.chatGlassBackdrop} aria-hidden="true">
            <HomePattern application="preview-concentric" className={styles.chatPattern} />
          </div>
          <div className={styles.chatIntro}>
            <div className={styles.advisorAvatar} aria-hidden="true">
              <img src="/assets/figma/preview-Image4.png" alt="" loading="lazy" />
            </div>
            <p>What are you looking for in your next home?</p>
          </div>
          <div className={`${styles.messageGroup} ${styles.visitorGroup}`}>
            <p className={styles.messageLabel}>Visitor</p>
            <p className={styles.messageBubble}>{visitor}</p>
          </div>
          <div className={styles.messageGroup}>
            <p className={styles.messageLabel}>AI Property Advisor</p>
            <p className={`${styles.messageBubble} ${reply ? '' : styles.initialReply}`} aria-live="polite" aria-atomic="true">
              {reply || <>What’s your budget, and when would<br className={styles.advisorBreak} /> you like to move?</>}
            </p>
          </div>
          <form className={styles.questionForm} data-focus-surface onSubmit={submitQuestion}>
            <label className="sr-only" htmlFor="property-question">Message the property advisor</label>
            <input ref={inputRef} id="property-question" type="text" value={question} onChange={(event) => setQuestion(event.target.value)} onFocus={() => setStarted(true)} placeholder="Start typing..." maxLength={200} autoComplete="off" />
            <button type="submit" aria-label="Send message">
              <img src="/assets/figma/preview-IconArtwork.svg" alt="" width="24" height="24" />
            </button>
          </form>
        </div>
      </div>
      <Eyebrow>Property Advisor</Eyebrow>
      <div className={styles.previewCopy}>
        <h3 className={`display ${styles.productTitle}`}>Find a home. &nbsp;Start with a chat.</h3>
        <p>Tell the property advisor what you’re looking for. Find your next home through a conversation.</p>
      </div>
      <button className="button button-small button-primary" type="button" onClick={startPreview}>Try the property advisor</button>
    </article>
  );
}

export function Preview() {
  return (
    <section id="technology" className={`page-container ${styles.preview}`} aria-labelledby="preview-title">
      <div className={styles.sectionHeading}>
        <Eyebrow>Try the technology</Eyebrow>
        <h2 id="preview-title" className={`display ${styles.previewTitle}`}>Go ahead. Put it to the test.</h2>
      </div>
      <div className={styles.previewGrid}>
        <article className={styles.previewColumn}>
          <div className={styles.voiceWidget}>
            <HomePattern id="voice-preview-pattern" application="preview-drift" className={styles.voicePattern} />
            <div className={styles.voiceGlass}>
              <img className={styles.voiceLine} src="/assets/figma/preview-waveform.svg" width="736" height="320" alt="" />
              <div className={styles.voiceLabels}>
                <ButtonLink href={playground} target="_blank" rel="noopener noreferrer" size="small">PyAI</ButtonLink>
                <ButtonLink href={playground} target="_blank" rel="noopener noreferrer" size="small" className={styles.voiceType}>Voice Assistant</ButtonLink>
              </div>
              <a href={playground} target="_blank" rel="noopener noreferrer" className={`button button-large ${styles.startTalking}`} aria-label="Start talking in the PyAI playground (opens in a new tab)">
                <span className={styles.voiceButtonBackdrop} data-voice-button-backdrop aria-hidden="true">
                  <span className={styles.voiceButtonPattern} data-voice-blur-layer><MotionPattern {...homePatternPlacements['preview-drift'].options} motion="tide" duration={12} intensity={0.7} syncWith="#voice-preview-pattern canvas" /></span>
                  <span className={styles.voiceButtonGlass} />
                  <img data-voice-blur-layer className={styles.voiceButtonLine} src="/assets/figma/preview-waveform.svg" width="736" height="320" alt="" />
                </span>
                <img className={styles.voiceWave} src="/assets/figma/preview-voice-icon.svg" width="24" height="24" alt="" />
                Start Talking
              </a>
              <p className={styles.voiceHint}>Enable microphone access to start talking.</p>
            </div>
          </div>
          <Eyebrow>PyAI</Eyebrow>
          <div className={styles.previewCopy}>
            <h3 className={`display ${styles.productTitle}`}>Hear what PyAI can do.</h3>
            <p>Ask a question and hear PyAI respond.<br />Try a voice conversation for yourself.</p>
          </div>
          <ButtonLink href={playground} target="_blank" rel="noopener noreferrer" size="small">Learn more about PyAI</ButtonLink>
        </article>
        <PropertyPreview />
      </div>
    </section>
  );
}
