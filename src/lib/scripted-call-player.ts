export type CallLine = { speaker: 'agent' | 'caller' | 'human'; text: string; audio?: string };
export type CallPlayback = {
  phase: 'idle' | 'playing' | 'paused' | 'complete' | 'error';
  line: number;
  elapsed: number;
};
export interface CallVoice {
  speak(line: CallLine, ended: () => void, failed: () => void): void;
  pause(): void;
  resume(): void;
  cancel(): void;
}
export const idleCall: CallPlayback = { phase: 'idle', line: -1, elapsed: 0 };

/** A single cancellable sequence, shared by the timed conversation and spoken calls. */
export class ScriptedCallPlayer {
  state: CallPlayback = idleCall;
  private lines: readonly CallLine[] = [];
  private voice?: CallVoice;
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private ticker?: ReturnType<typeof setInterval>;
  private task?: () => void;
  private deadline = 0;
  private remaining = 0;
  private startedAt = 0;
  private elapsed = 0;

  private changed: (state: CallPlayback) => void;
  constructor(changed: (state: CallPlayback) => void) { this.changed = changed; }

  private publish(patch: Partial<CallPlayback>) {
    this.state = { ...this.state, ...patch };
    this.changed(this.state);
  }

  private clock() {
    this.startedAt = performance.now();
    this.ticker = setInterval(() => {
      this.publish({ elapsed: this.elapsed + (performance.now() - this.startedAt) / 1000 });
    }, 250);
  }

  private freeze() {
    if (this.state.phase === 'playing') this.elapsed += (performance.now() - this.startedAt) / 1000;
    clearInterval(this.ticker);
    this.ticker = undefined;
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private schedule(delay: number, task: () => void) {
    clearTimeout(this.timer);
    this.task = task;
    this.remaining = delay;
    this.deadline = performance.now() + delay;
    if (this.state.phase !== 'playing') return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.task = undefined;
      task();
    }, delay);
  }

  private clear() {
    // Invalidate callbacks before cancel(), which can synchronously emit an error.
    this.generation++;
    this.freeze();
    this.task = undefined;
    this.voice?.cancel();
  }

  start(lines: readonly CallLine[], voice?: CallVoice, startAt = 0) {
    this.clear();
    this.lines = lines;
    this.voice = voice;
    this.elapsed = 0;
    this.publish({ phase: 'playing', line: startAt, elapsed: 0 });
    this.clock();
    this.playLine();
  }

  private playLine() {
    const line = this.lines[this.state.line];
    if (!line) { this.finish(); return; }
    const generation = ++this.generation;
    const current = () => generation === this.generation;
    const next = () => {
      if (!current()) return;
      if (this.state.line === this.lines.length - 1) this.finish();
      else { this.publish({ line: this.state.line + 1 }); this.playLine(); }
    };
    if (!this.voice) { this.schedule(1900, next); return; }
    const failed = () => {
      if (!current()) return;
      this.clear();
      this.publish({ phase: 'error', elapsed: this.elapsed });
    };
    // Recover if a recording cannot load or playback stalls indefinitely.
    this.schedule(Math.max(12000, line.text.length * 200), failed);
    try {
      this.voice.speak(line, () => { if (current()) this.schedule(260, next); }, failed);
    } catch { failed(); }
  }

  private finish() {
    this.clear();
    this.publish({ phase: 'complete', elapsed: this.elapsed });
  }

  pause() {
    if (this.state.phase !== 'playing') return;
    this.remaining = Math.max(0, this.deadline - performance.now());
    this.freeze();
    this.publish({ phase: 'paused', elapsed: this.elapsed });
    this.voice?.pause();
  }

  resume() {
    if (this.state.phase !== 'paused') return;
    this.publish({ phase: 'playing' });
    this.clock();
    if (this.task) this.schedule(this.remaining, this.task);
    this.voice?.resume();
  }

  reset() {
    this.clear();
    this.elapsed = 0;
    this.publish(idleCall);
  }

  dispose() { this.clear(); }
}
