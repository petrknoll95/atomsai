'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import styles from './infrastructure-call-demo.module.css';

type Speaker = 'agent' | 'caller';
/** One scripted beat: a line (after `delay` ms of silence or speech) or an event marker. */
type Step = { speaker?: string; text?: string; event?: string; delay: number; first?: number; reply?: number; barge?: number; cut?: boolean };
export type CallDemoContent = {
  label: string; status: string; business: string; agent: string;
  speakers: { agent: string; caller: string };
  scenarioLabel: string; interrupt: string; interruptName: string;
  metrics: { first: string; reply: string; barge: string };
  interruption: { event: string; barge: number; steps: Step[] };
  defaultScenario: number;
  scenarios: { label: string; steps: Step[] }[];
};

type Message = { key: number; speaker?: Speaker; text: string; cut: boolean };
type Metrics = { first?: number; reply?: number; barge?: number };
type View = {
  scenario: number; messages: Message[]; metrics: Metrics;
  speaking: Speaker | null; phase: 'playing' | 'paused' | 'complete'; elapsed: number;
};

const speakerOf = (step: Step): Speaker | undefined => step.event ? undefined : step.speaker === 'caller' ? 'caller' : 'agent';
/** How long a beat stays current before the next one starts, as in the prototype's player. */
const holdFor = (step: Step) => step.event ? 700 : Math.min(2600, 400 + (step.text?.length ?? 0) * 34);
const withMetrics = (metrics: Metrics, step: Step): Metrics => ({
  ...metrics,
  ...(step.first ? { first: step.first } : {}),
  ...(step.reply ? { reply: step.reply } : {}),
  ...(step.barge ? { barge: step.barge } : {}),
});

/** The caller can barge in while the agent's newest line is still being spoken. */
const interruptible = (view: View) => {
  const last = view.messages[view.messages.length - 1];
  return view.phase === 'playing' && view.speaking === 'agent' && last?.speaker === 'agent';
};

/** The finished exchange: what reduced motion and the server render show. */
function completedView(content: CallDemoContent, scenario: number): View {
  const steps = content.scenarios[scenario].steps;
  return {
    scenario,
    messages: steps.map((step, key) => ({ key, speaker: speakerOf(step), text: step.event ?? step.text ?? '', cut: !!step.cut })),
    metrics: steps.reduce(withMetrics, {}),
    speaking: null,
    phase: 'complete',
    elapsed: steps.reduce((total, step) => total + step.delay + holdFor(step), 0) / 1000,
  };
}

/** A pausable timeline for one scripted call; the caller may barge in while the agent speaks. */
class CallSimulation {
  view: View;
  started = false;
  private content: CallDemoContent;
  private changed: (view: View) => void;
  private steps: Step[] = [];
  private index = 0;
  private key = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private task?: () => void;
  private deadline = 0;
  private remaining = 0;
  private ticker?: ReturnType<typeof setInterval>;
  private startedAt = 0;
  private elapsed = 0;

  constructor(content: CallDemoContent, changed: (view: View) => void) {
    this.content = content;
    this.changed = changed;
    this.view = completedView(content, content.defaultScenario);
  }

  private publish(patch: Partial<View>) {
    this.view = { ...this.view, ...patch };
    this.changed(this.view);
  }

  private clock() {
    this.startedAt = performance.now();
    this.ticker = setInterval(() => this.publish({ elapsed: this.elapsed + (performance.now() - this.startedAt) / 1000 }), 250);
  }

  private freeze() {
    if (this.view.phase === 'playing') this.elapsed += (performance.now() - this.startedAt) / 1000;
    clearInterval(this.ticker);
    clearTimeout(this.timer);
    this.ticker = this.timer = undefined;
  }

  private schedule(delay: number, task: () => void) {
    clearTimeout(this.timer);
    this.task = task;
    this.remaining = delay;
    this.deadline = performance.now() + delay;
    if (this.view.phase !== 'playing') return;
    this.timer = setTimeout(() => { this.timer = this.task = undefined; task(); }, delay);
  }

  private message(step: Step): Message {
    return { key: this.key++, speaker: speakerOf(step), text: step.event ?? step.text ?? '', cut: !!step.cut };
  }

  private next() {
    const step = this.steps[this.index++];
    if (!step) { this.freeze(); this.task = undefined; this.publish({ phase: 'complete', speaking: null, elapsed: this.elapsed }); return; }
    // The caller is already talking before the transcript catches up; the agent is silent while it prepares.
    this.publish({ speaking: speakerOf(step) === 'caller' ? 'caller' : null });
    this.schedule(step.delay, () => {
      this.publish({ messages: [...this.view.messages, this.message(step)], metrics: withMetrics(this.view.metrics, step), speaking: speakerOf(step) ?? null });
      this.schedule(holdFor(step), () => this.next());
    });
  }

  start(scenario: number) {
    this.freeze();
    this.started = true;
    this.steps = this.content.scenarios[scenario].steps.slice();
    this.index = 0;
    this.elapsed = 0;
    this.publish({ scenario, messages: [], metrics: {}, speaking: null, phase: 'playing', elapsed: 0 });
    this.clock();
    this.next();
  }

  /** Jump to the finished exchange without playing it. */
  show(scenario: number) {
    this.freeze();
    this.task = undefined;
    this.view = completedView(this.content, scenario);
    this.changed(this.view);
  }

  get canInterrupt() { return interruptible(this.view); }

  interrupt() {
    if (!this.canInterrupt) return;
    const { messages, metrics } = this.view;
    const last = messages[messages.length - 1];
    const cut = last.cut ? last : { ...last, text: last.text.replace(/[.?!]?\s*$/, ''), cut: true };
    const { event, barge, steps } = this.content.interruption;
    this.steps.splice(this.index, 0, ...steps);
    this.publish({ messages: [...messages.slice(0, -1), cut, this.message({ event, delay: 0 })], metrics: { ...metrics, barge }, speaking: 'caller' });
    this.schedule(400, () => this.next());
  }

  pause() {
    if (this.view.phase !== 'playing') return;
    this.remaining = Math.max(0, this.deadline - performance.now());
    this.freeze();
    this.publish({ phase: 'paused', elapsed: this.elapsed });
  }

  resume() {
    if (this.view.phase !== 'paused') return;
    this.publish({ phase: 'playing' });
    this.clock();
    if (this.task) this.schedule(this.remaining, this.task);
  }

  dispose() { this.freeze(); }
}

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (changed: () => void) => {
  const media = matchMedia(motionQuery);
  media.addEventListener('change', changed);
  return () => media.removeEventListener('change', changed);
};

const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
// Fixed bar heights so the server and client render the same waveform.
const wave = Array.from({ length: 44 }, (_, index) => Math.round(30 + 70 * Math.abs(Math.sin(index * .7) * Math.sin(index * .13 + 1))));

/**
 * The hero's scripted call, replayed with PyAI's published timings. It plays
 * the scenarios in turn while in view; once someone picks a scenario, pauses
 * or interrupts, it follows them instead. Transcript lines are announced
 * politely only after that choice, so the unattended loop stays quiet.
 * Reduced motion shows each finished exchange without playing it.
 */
export function InfrastructureCallDemo({ content }: { content: CallDemoContent }) {
  const rootRef = useRef<HTMLElement>(null);
  const transcriptRef = useRef<HTMLOListElement>(null);
  const playbackRef = useRef<HTMLButtonElement>(null);
  const interruptRef = useRef<HTMLButtonElement>(null);
  const visible = useRef(false);
  const heldByUser = useRef(false);
  const [view, setView] = useState(() => completedView(content, content.defaultScenario));
  const [simulation] = useState(() => new CallSimulation(content, setView));
  const [chosen, setChosen] = useState(false);
  // The server renders the motion layout; reduced motion swaps in the still exchange after hydration.
  const reduced = useSyncExternalStore(subscribeToMotion, () => matchMedia(motionQuery).matches, () => false);
  const scenarios = content.scenarios.length;

  useEffect(() => () => simulation.dispose(), [simulation]);

  useEffect(() => {
    const root = rootRef.current;
    if (reduced) {
      if (simulation.view.phase !== 'complete') simulation.show(simulation.view.scenario);
      return;
    }
    if (!root) return;
    const sync = () => {
      if (!visible.current || document.hidden) simulation.pause();
      else if (!simulation.started) simulation.start(content.defaultScenario);
      else if (!heldByUser.current) simulation.resume();
    };
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; sync(); }, { threshold: .3 });
    observer.observe(root);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); simulation.pause(); };
  }, [reduced, simulation, content.defaultScenario]);

  // Unattended, move on to the next scenario after a short rest, as the prototype does.
  useEffect(() => {
    if (reduced || chosen || view.phase !== 'complete' || !simulation.started) return;
    const timer = setTimeout(() => {
      simulation.start((view.scenario + 1) % scenarios);
      if (!visible.current || document.hidden) simulation.pause();
    }, 2200);
    return () => clearTimeout(timer);
  }, [reduced, chosen, view.phase, view.scenario, simulation, scenarios]);

  function choose(scenario: number) {
    setChosen(true);
    heldByUser.current = false;
    if (reduced) {
      simulation.show(scenario);
      transcriptRef.current?.scrollTo({ top: 0 });
    } else simulation.start(scenario);
  }

  function togglePlayback() {
    setChosen(true);
    if (view.phase === 'playing') { heldByUser.current = true; simulation.pause(); }
    else if (view.phase === 'paused') { heldByUser.current = false; simulation.resume(); }
    else { heldByUser.current = false; simulation.start(view.scenario); }
  }

  function interrupt() {
    if (!simulation.canInterrupt) return;
    setChosen(true);
    simulation.interrupt();
  }

  const complete = view.phase === 'complete';
  useEffect(() => {
    if (!complete || reduced) return;
    // The interrupt control leaves with the call; keep keyboard focus in the card.
    if (document.activeElement === interruptRef.current) playbackRef.current?.focus({ preventScroll: true });
    // The ended call can be scrolled back, starting from its newest line.
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [complete, reduced, view.scenario]);

  const canInterrupt = interruptible(view);
  const playbackLabel = view.phase === 'playing' ? 'Pause the call' : view.phase === 'paused' ? 'Resume the call' : 'Replay the call';
  const { metrics } = view;

  return <figure ref={rootRef} className={styles.demo} aria-label={content.label} data-phase={view.phase}>
    <div className={styles.backdrop} aria-hidden="true"><span /><span /><span /></div>
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.live}><i className={styles.liveDot} data-active={view.phase === 'playing'} aria-hidden="true" />{content.status} · <b>{content.business}</b></span>
        <span className={styles.timer} aria-hidden="true">{time(view.elapsed)}</span>
        <button ref={playbackRef} type="button" className={styles.playback} onClick={togglePlayback} aria-label={playbackLabel} hidden={reduced}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">{view.phase === 'playing'
            ? <path d="M5 3.5h2v9H5zm4 0h2v9H9z" fill="currentColor" />
            : view.phase === 'paused' ? <path d="M5 3.5 12 8l-7 4.5Z" fill="currentColor" />
            : <path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3M4.5 2.5v2.5H7" fill="none" stroke="currentColor" strokeWidth="1.4" />}</svg>
        </button>
      </div>
      <div className={styles.surface}>
        <div className={styles.wave} data-speaking={view.speaking ?? 'none'} data-moving={!reduced && view.phase === 'playing'} aria-hidden="true">
          {wave.map((height, index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${-(index * 97) % 900}ms` }} />)}
        </div>
        {/* Once the exchange is finished (always, with reduced motion) it scrolls, so the list takes keyboard focus. */}
        <ol ref={transcriptRef} className={styles.transcript} aria-label="Call transcript" aria-live={chosen ? 'polite' : 'off'} tabIndex={reduced || complete ? 0 : undefined}>
          {view.messages.map(message => message.speaker
            ? <li key={message.key} className={styles.message} data-speaker={message.speaker}>
              <span className={styles.speaker}>{message.speaker === 'agent' ? `${content.speakers.agent} · ${content.agent}` : content.speakers.caller}</span>
              <p>{message.text}{message.cut && <span className={styles.cut}>—</span>}</p>
            </li>
            : <li key={message.key} className={styles.event}><p>{message.text}</p></li>)}
        </ol>
        <button ref={interruptRef} type="button" className={styles.interrupt} onClick={interrupt} aria-label={content.interruptName} aria-disabled={!canInterrupt} data-ready={canInterrupt} hidden={reduced || complete}>{content.interrupt}</button>
      </div>
      <dl className={styles.metrics}>
        <div><dt>{content.metrics.first}</dt><dd>{metrics.first ? `${metrics.first} ms` : '—'}</dd></div>
        <div><dt>{content.metrics.reply}</dt><dd>{metrics.reply ? `${(metrics.reply / 1000).toFixed(2)} s` : '—'}</dd></div>
        <div><dt>{content.metrics.barge}</dt><dd>{metrics.barge ? `${metrics.barge} ms` : '—'}</dd></div>
      </dl>
    </div>
    <div className={styles.scenarios} role="group" aria-label={content.scenarioLabel}>
      {content.scenarios.map((scenario, index) => <button key={scenario.label} type="button" aria-pressed={view.scenario === index} onClick={() => choose(index)}>{scenario.label}</button>)}
    </div>
  </figure>;
}
