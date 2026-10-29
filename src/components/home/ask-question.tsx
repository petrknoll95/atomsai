'use client';

import { ArrowIcon } from '@/components/arrow-icon';
import { useCallback, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { scrollToTarget } from '@/lib/page-scroll';
import { slitMotion } from '@/lib/slit-logo';
import { AnimatedLogo } from '../animated-logo';
import styles from './lower.module.css';

// Deliberately local: this prototype makes no model request or product promises.
const sampleAnswer = 'A useful starting point is the workflow you want to improve. Pick one repetitive task, identify the information it needs, and decide what a good result would look like. From there, explore an existing application or discuss a custom approach with the team. Start small, keep a person involved in important decisions, and use what you learn to shape the next step.';
const thinkingDuration = slitMotion.seconds * 3;

function GeneratedQuestion({ question, onComplete }: { question: string; onComplete: () => void }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [complete, setComplete] = useState(false);

  useLayoutEffect(() => {
    const root = wrapper.current!;
    const thinking = root.querySelector<HTMLElement>('[data-thinking]')!;
    const slot = root.querySelector<HTMLElement>('[data-generated-slot]')!;
    const body = root.querySelector<HTMLElement>('[data-generated-body]')!;
    const words = root.querySelectorAll('[data-answer-word]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: () => { setComplete(true); onComplete(); } });
      gsap.set(slot, { height: 0, opacity: 0 });
      gsap.set(words, { opacity: 0, y: 3 });
      timeline.fromTo(root, { height: 0, opacity: 0, y: 8 }, {
        height: 'auto', opacity: 1, y: 0, duration: .55, ease: 'power3.out',
        onComplete: () => {
          gsap.set(root, { clearProps: 'height,overflow,transform' });
          const bounds = root.getBoundingClientRect();
          if (bounds.top < 112 || bounds.bottom > innerHeight - 32) scrollToTarget(root);
        },
      });
      // Hold for three complete brand-mark cycles after the card has appeared.
      timeline.to(thinking, { opacity: 0, height: 0, marginTop: 0, duration: .3 }, `+=${thinkingDuration}`)
        .to(slot, { height: () => body.offsetHeight, opacity: 1, duration: .5, ease: 'power2.inOut', onComplete: () => { gsap.set(slot, { height: 'auto' }); } }, '<')
        .to(words, { opacity: 1, y: 0, duration: .3, stagger: .035, ease: 'power2.out' }, '<.12');
      const finish = () => { if (motion.matches) timeline.progress(1); };
      finish();
      motion.addEventListener('change', finish);
      return () => motion.removeEventListener('change', finish);
    }, root);
    return () => context.revert();
  }, [onComplete]);

  return <div ref={wrapper} className={styles.generatedQuestion} data-generated-question>
    <details className={styles.question} name="home-faq" open>
      <summary>
        <span>{question}</span>
        <span className={styles.questionIcon} aria-hidden="true">
          <img className={styles.openIcon} src="/assets/figma/faq-IconArtwork.svg" width="24" height="24" alt="" />
          <img className={styles.closeIcon} src="/assets/figma/faq-IconArtwork1.svg" width="24" height="24" alt="" />
        </span>
      </summary>
      <div className={styles.answerClip} aria-busy={!complete}>
        <div data-thinking className={styles.thinking} aria-hidden="true">
          {!complete && <AnimatedLogo className={styles.thinkingLogo} />}
          Putting an answer together
        </div>
        <div data-generated-slot className={styles.generatedSlot} aria-hidden={!complete}>
          <div data-generated-body className={styles.generatedBody}>
            <p className={`${styles.answer} ${styles.generatedAnswer}`}>
              {sampleAnswer.split(' ').map((word, index) => <span key={index}><span data-answer-word>{word}</span>{' '}</span>)}
            </p>
          </div>
        </div>
      </div>
    </details>
  </div>;
}

export function AskQuestion() {
  const [questions, setQuestions] = useState<{ id: number; text: string }[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const pending = useRef(false);
  const nextId = useRef(0);
  const finish = useCallback(() => {
    pending.current = false;
    setBusy(false);
    setAnnouncement(`Sample answer ready. ${sampleAnswer}`);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || pending.current) return;
    pending.current = true;
    setBusy(true);
    event.currentTarget.closest('#faq')?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(item => { item.open = false; });
    const entry = { id: nextId.current++, text: question };
    setQuestions(items => [...items, entry]);
    setDraft('');
    setAnnouncement('Question added. Preparing a sample answer.');
  }

  return <>
    {questions.map(question => <GeneratedQuestion key={question.id} question={question.text} onComplete={finish} />)}
    <form className={styles.customQuestionWrap} onSubmit={submit} aria-label="Ask a question">
      <div className={styles.customQuestion} data-focus-surface>
        <input type="text" name="question" aria-label="Ask a question" maxLength={500} autoComplete="off"
          placeholder="Can’t find your question? Ask it here..." value={draft} onChange={event => setDraft(event.target.value)} />
        <button className={styles.questionSubmit} type="submit" aria-label={busy ? 'Preparing answer' : 'Submit question'} disabled={busy || !draft.trim()}>
          <ArrowIcon direction="up" size={24} />
        </button>
      </div>
    </form>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </>;
}
