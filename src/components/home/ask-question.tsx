'use client';

import { ArrowIcon } from '@/components/arrow-icon';
import { assetPath, withBasePath } from '@/lib/base-path';
import { scrollToTarget } from '@/lib/page-scroll';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import styles from './lower.module.css';

export type FaqEntry = {
  question: string;
  answer: ReactNode;
  keywords?: readonly string[];
};

function normalize(value: string) {
  return value.toLowerCase().match(/[a-z0-9]+/g)?.join(' ') ?? '';
}

function findAnswer(question: string, entries: readonly FaqEntry[]) {
  const query = normalize(question);
  const exact = entries.find(entry => normalize(entry.question) === query);
  if (exact) return exact;

  const paddedQuery = ` ${query} `;
  let bestMatch: FaqEntry | undefined;
  let bestScore = 0;
  for (const entry of entries) {
    const score = (entry.keywords ?? []).reduce((total, phrase) => {
      const keyword = normalize(phrase);
      return paddedQuery.includes(` ${keyword} `) ? total + keyword.split(' ').length ** 2 : total;
    }, 0);
    if (score <= bestScore) continue;
    bestMatch = entry;
    bestScore = score;
  }
  return bestMatch;
}

function QuestionResult({ question, answer, group }: { question: string; answer: ReactNode; group: string }) {
  const result = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const element = result.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.top < 112 || bounds.bottom > innerHeight - 32) scrollToTarget(element);
  }, []);

  return <div className={styles.generatedQuestion} data-generated-question>
    <details ref={result} className={styles.question} name={group} open>
      <summary>
        <span>{question}</span>
        <span className={styles.questionIcon} aria-hidden="true">
          <img className={styles.openIcon} src={assetPath('/assets/figma/faq-IconArtwork.svg')} width="24" height="24" alt="" />
          <img className={styles.closeIcon} src={assetPath('/assets/figma/faq-IconArtwork1.svg')} width="24" height="24" alt="" />
        </span>
      </summary>
      <div className={styles.answerClip}>
        <p className={`${styles.answer} ${styles.generatedAnswer}`} data-faq-answer>{answer}</p>
      </div>
    </details>
  </div>;
}

const noAnswer = <>We don’t have a published answer for that question. <a className="link-underline" href={withBasePath('/company/contact')}>Ask the AtomsAI team</a>.</>;

export function AskQuestion({ entries, group }: { entries: readonly FaqEntry[]; group: string }) {
  const [questions, setQuestions] = useState<{ id: number; text: string; match?: FaqEntry }[]>([]);
  const [draft, setDraft] = useState('');
  const nextId = useRef(0);
  const latest = questions.at(-1);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    event.currentTarget.closest('section')?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(item => { item.open = false; });
    const entry = { id: nextId.current++, text: question, match: findAnswer(question, entries) };
    setQuestions(items => [...items, entry]);
    setDraft('');
  }

  return <>
    {questions.map(({ id, text, match }) => <QuestionResult key={id} question={text} answer={match?.answer ?? noAnswer} group={group} />)}
    <form className={styles.customQuestionWrap} onSubmit={submit} aria-label="Ask a question">
      <div className={styles.customQuestion} data-focus-surface>
        <input type="text" name="question" aria-label="Ask a question" maxLength={500} autoComplete="off"
          placeholder="Can’t find your question? Ask it here..." value={draft} onChange={event => setDraft(event.target.value)} />
        <button className={styles.questionSubmit} type="submit" aria-label="Submit question" disabled={!draft.trim()}>
          <ArrowIcon direction="up" size={24} />
        </button>
      </div>
    </form>
    <p className="sr-only" role="status" aria-atomic="true">{latest && (latest.match
      ? `Found an answer for “${latest.text}”.`
      : `No published answer found for “${latest.text}”. You can contact the AtomsAI team.`)}</p>
  </>;
}
