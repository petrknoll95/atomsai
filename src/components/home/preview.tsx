'use client';

import { AnimatedLogo } from '@/components/animated-logo';
import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eyebrow } from '../ui';
import { HomePattern } from '@/components/patterns/home-pattern';
import styles from './products.module.css';
import propertyStyles from './property-preview.module.css';
import { VoicePreview } from './voice-preview';

const playground = 'https://pyai.com/playground';
const propertyChoices = ['Buy a house', 'Sell a house', 'Start a new franchise'] as const;
const propertyReplies: Record<string, string> = {
  'Buy a house': 'Which area are you looking to buy in?',
  'Sell a house': 'Where is the property you’d like to sell?',
  'Start a new franchise': 'Which area are you interested in opening a Havenline franchise in?',
};

type PropertyMessage = { speaker: string; text: string; phase?: 'thinking' | 'typing' };

function PropertyPreview() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [messages, setMessages] = useState<PropertyMessage[]>([
    { speaker: 'Nora', text: "Hi, I'm Nora. I can find the Havenline office that covers your area, walk you through selling privately, or book you a free consultation — what brings you in today?" },
  ]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages]);

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);

  function startPreview() {
    inputRef.current?.focus();
  }

  function appendMessage(value: string) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setAnnouncement('Nora is thinking.');
    const reply = propertyReplies[value] ?? 'Which area are you interested in, and are you looking to buy, sell, or start a franchise?';
    setMessages(previous => [
      ...previous,
      { speaker: 'You', text: value },
      { speaker: 'Nora', text: '', phase: 'thinking' },
    ]);
    setQuestion('');

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const words = reply.match(/\S+\s*/g) ?? [reply];
    let wordCount = 0;
    function revealReply() {
      wordCount = motion.matches ? words.length : wordCount + 1;
      const complete = wordCount >= words.length;
      setMessages(previous => [
        ...previous.slice(0, -1),
        { speaker: 'Nora', text: words.slice(0, wordCount).join(''), phase: complete ? undefined : 'typing' },
      ]);
      if (complete) {
        pendingRef.current = false;
        setPending(false);
        setAnnouncement(`Nora: ${reply}`);
        replyTimer.current = null;
      } else {
        replyTimer.current = setTimeout(revealReply, 85);
      }
    }
    replyTimer.current = setTimeout(revealReply, motion.matches ? 300 : 1000);
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (!value) {
      startPreview();
      return;
    }
    appendMessage(value);
  }

  return (
    <article className={styles.previewColumn}>
      <div className={propertyStyles.widget} id="property-preview" data-header-theme="light">
        <div className={propertyStyles.scene}>
          <div className={propertyStyles.card}>
            <div className={propertyStyles.intro}>
              <img className={propertyStyles.avatar} src="/assets/nora-avatar.png" alt="" width="40" height="40" />
              <div className={propertyStyles.identity}>
                <p className={propertyStyles.name}>Nora</p>
                <p className={propertyStyles.role}>Property Advisor</p>
              </div>
            </div>
            <div ref={transcriptRef} className={propertyStyles.transcript} role="log" aria-label="Conversation with Nora" aria-live="off" tabIndex={0}>
              {messages.map((message, index) => (
                <div key={index} className={propertyStyles.message} data-speaker={message.speaker === 'You' ? 'user' : 'advisor'} data-phase={message.phase} data-animated={index > 0 ? '' : undefined}>
                  <span className="sr-only">{message.speaker}: </span>
                  {message.phase === 'thinking' ? (
                    <span className={propertyStyles.thinking} aria-label="Nora is thinking">
                      <span /><span /><span />
                    </span>
                  ) : <p>{message.text}</p>}
                </div>
              ))}
              {messages.length === 1 && (
                <div className={propertyStyles.choices} role="group" aria-label="What brings you in today?">
                  {propertyChoices.map(choice => (
                    <button key={choice} type="button" className={`button ${propertyStyles.choice}`} onClick={() => { appendMessage(choice); startPreview(); }}>{choice}</button>
                  ))}
                </div>
              )}
            </div>
            <form className={propertyStyles.form} data-focus-surface onSubmit={submitQuestion}>
              <label className="sr-only" htmlFor="property-question">Message Nora</label>
              <input ref={inputRef} id="property-question" type="text" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Start typing..." maxLength={200} autoComplete="off" />
              <button className={`button ${propertyStyles.send}`} type="submit" aria-label="Send message" disabled={pending}>
                <ArrowIcon direction="up" size={20} />
              </button>
            </form>
          </div>
          <p className={propertyStyles.credit}><AnimatedLogo className={propertyStyles.creditMark} playOnHover /><span>Powered by AtomsAI</span></p>
          <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
        </div>
      </div>
      <div className={styles.previewCopy}>
        <h3 className={`display ${styles.productTitle}`}>Find a home. &nbsp;Start with a chat.</h3>
        <p>Tell the property advisor what you’re looking for. Find your next home through a conversation.</p>
      </div>
      <Eyebrow href={playground}>Property Advisor</Eyebrow>
    </article>
  );
}

export function Preview() {
  return (
    <section id="technology" className={`page-container ${styles.preview}`} aria-labelledby="preview-title">
      <div className={styles.sectionHeading}>
        <Eyebrow href={playground}>Try the technology</Eyebrow>
        <h2 id="preview-title" className={`display ${styles.previewTitle}`}>See our AI in action.</h2>
      </div>
      <div className={styles.previewGrid}>
        <article className={styles.previewColumn}>
          <div className={styles.voiceWidget} data-header-theme="dark">
            <HomePattern id="voice-preview-pattern" application="preview-drift" className={styles.voicePattern} />
            <VoicePreview />
          </div>
          <div className={styles.previewCopy}>
            <h3 className={`display ${styles.productTitle}`}>Hear what PyAI can do.</h3>
            <p>Ask a question and hear PyAI respond.<br />Try a voice conversation for yourself.</p>
          </div>
          <Eyebrow href="https://pyai.com/">PyAI</Eyebrow>
        </article>
        <PropertyPreview />
      </div>
    </section>
  );
}
