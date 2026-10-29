'use client';

import { withBasePath } from '@/lib/base-path';

import { ArrowIcon } from '@/components/arrow-icon';
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import styles from './contact.module.css';

type Draft = { name: string; company: string; email: string; message: string };
const topics: Record<string, string> = { voice: 'Voice', healthcare: 'Healthcare', security: 'Security & compliance', services: 'AI Services', approach: 'AI Services', 'custom-build': 'A custom build', trust: 'Security & compliance' };

function subscribeToLocation(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}
function readTopic() {
  const requested = new URLSearchParams(window.location.search).get('topic')?.toLowerCase() ?? '';
  return topics[requested] ?? '';
}

export function ContactForm() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const topic = useSyncExternalStore(subscribeToLocation, readTopic, () => '');
  const ready = useSyncExternalStore(subscribeToLocation, () => true, () => false);
  const [copyStatus, setCopyStatus] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (draft) reviewRef.current?.focus(); }, [draft]);
  useEffect(() => { if (manualCopy) { fallbackRef.current?.focus(); fallbackRef.current?.select(); } }, [manualCopy]);

  const recipient = topic === 'Security & compliance' ? 'security@atomsai.com' : 'hello@atomsai.com';
  const subject = draft ? `${topic || 'An introduction'} — ${draft.company}` : '';
  const body = draft ? `Hi AtomsAI,\n\n${draft.message}\n\n${draft.name}\n${draft.company}\nReply to: ${draft.email}` : '';
  const copyText = `To: ${recipient}\nSubject: ${subject}\n\n${body}`;
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    // Native field validation also catches whitespace-only drafts before review.
    for (const field of Array.from(form.elements)) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue;
      field.setCustomValidity(field.required && !field.value.trim() ? 'Please complete this field.' : '');
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setDraft({ name: String(data.get('name')).trim(), company: String(data.get('company')).trim(), email: String(data.get('email')).trim(), message: String(data.get('message')).trim() });
    setCopyStatus('');
    setManualCopy(false);
  }

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(copyText);
      setCopyStatus('Email details copied. Paste them into your email app to send.');
      setManualCopy(false);
    } catch {
      setManualCopy(true);
      setCopyStatus('Automatic copy is unavailable. Select and copy the email details below.');
    }
  }

  return <div className={styles.formPanel}>
    <div className={styles.formProgress} aria-label={draft ? 'Step 2 of 2: Review email' : 'Step 1 of 2: Your message'}><span data-active={!draft}>01 · Your message</span><span className={styles.progressLine} /><span data-active={!!draft}>02 · Review email</span></div>
    <form ref={formRef} onSubmit={prepare} hidden={!!draft} className={styles.form} onInput={event => { const input = event.target; if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.setCustomValidity(''); }}>
      <h2 className={`display ${styles.formTitle}`}>What’s on your mind?</h2>
      {topic && <p className={styles.topic}>Let’s talk about {topic === 'AI Services' ? topic : topic.toLowerCase()}.</p>}
      <fieldset disabled={!ready}>
      <div className={styles.fieldPair}>
        <div className={styles.field}><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" autoComplete="name" required maxLength={80} /></div>
        <div className={styles.field}><label htmlFor="contact-company">Company</label><input id="contact-company" name="company" autoComplete="organization" required maxLength={120} /></div>
      </div>
      <div className={styles.field}><label htmlFor="contact-email">Business email</label><input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={160} /></div>
      <div className={styles.field}><label htmlFor="contact-message">What would you like to explore?</label><textarea id="contact-message" name="message" rows={4} required maxLength={1800} aria-describedby="contact-message-help" /><p id="contact-message-help" className={styles.fieldHint}>A few lines about the workflow or question are enough.</p></div>
      <button type="submit" className={`button button-large button-primary ${styles.prepareButton}`}>Prepare email <ArrowIcon size={18} /></button>
      </fieldset>
      <noscript><p className={styles.formNote}>To get in touch, email <a href={withBasePath("mailto:hello@atomsai.com")}>hello@atomsai.com</a> directly.</p></noscript>
      <p className={styles.formNote}>Review your message, then send it from your email app. Nothing is sent from this page.</p>
      <p className={styles.privacy}>All fields required. <a className="link-underline" href={withBasePath("https://atomsai.com/legal/privacy")}>Privacy policy <span aria-hidden="true"><ArrowIcon direction="up-right" /></span></a></p>
    </form>
    {draft && <div className={styles.review}>
      <h2 ref={reviewRef} tabIndex={-1} className={`display ${styles.formTitle}`}>Ready for your email app.</h2>
      <p className={styles.reviewIntro}>Nothing has been sent. Review the details, then finish sending in your email app.</p>
      <dl className={styles.envelope}><div><dt>To</dt><dd>{recipient}</dd></div><div><dt>Subject</dt><dd>{subject}</dd></div><div><dt>Reply to</dt><dd>{draft.email}</dd></div></dl>
      <div className={styles.messagePreview}>{body}</div>
      <a className={`button button-large button-primary ${styles.prepareButton}`} href={withBasePath(mailto)}>Open email app <ArrowIcon size={18} /></a>
      <div className={styles.reviewActions}><button type="button" onClick={copy}>Copy email details</button><button type="button" onClick={() => { setDraft(null); setCopyStatus(''); setManualCopy(false); requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input')?.focus()); }}>Edit message</button></div>
      <p className={styles.formNote}>No email app connected? Copy the details and paste them into your preferred email service.</p>
      <p className={styles.copyStatus} role="status">{copyStatus}</p>
      {manualCopy && <div className={styles.field}><label htmlFor="contact-copy">Email details to copy</label><textarea id="contact-copy" ref={fallbackRef} readOnly value={copyText} rows={8} /></div>}
    </div>}
  </div>;
}
