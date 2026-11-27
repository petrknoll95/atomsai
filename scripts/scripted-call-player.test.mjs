import test from 'node:test';
import assert from 'node:assert/strict';
import { ScriptedCallPlayer } from '../src/lib/scripted-call-player.ts';
import { recordedCallVoice } from '../src/lib/recorded-call-voice.ts';

const script = [
  { speaker: 'caller', text: 'Can we move the appointment?' },
  { speaker: 'agent', text: 'Friday at one works.' },
];

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 0 });
  t.mock.method(performance, 'now', () => Date.now());
  const changes = [];
  const player = new ScriptedCallPlayer(state => changes.push(state));
  t.after(() => player.dispose());
  const spoken = [];
  const voice = {
    speak: (line, ended, failed, progress) => spoken.push({ line, ended, failed, progress }),
    pause: t.mock.fn(), resume: t.mock.fn(), cancel: t.mock.fn(),
  };
  return { player, changes, spoken, voice, tick: ms => t.mock.timers.tick(ms) };
}

test('visual playback preserves its place and clock through pause and resume', t => {
  const { player, tick } = setup(t);
  player.start(script);
  tick(1000);
  player.pause();
  tick(10000);
  assert.equal(player.state.line, 0);
  assert.equal(player.state.elapsed, 1);
  player.resume();
  tick(900);
  assert.equal(player.state.line, 1);
  tick(1900);
  assert.equal(player.state.phase, 'complete');
  assert.equal(player.state.elapsed, 3.8);
});

test('switching scenarios ignores old speech completion and error events', t => {
  const { player, voice, spoken, tick } = setup(t);
  player.start(script, voice);
  const stale = spoken[0];
  const replacement = [{ speaker: 'caller', text: 'Explain my invoice.' }];
  player.start(replacement, voice);
  stale.ended(); stale.failed();
  tick(300);
  assert.equal(player.state.phase, 'playing');
  assert.equal(player.state.line, 0);
  assert.equal(spoken.length, 2);
  spoken[1].ended(); tick(260);
  assert.equal(player.state.phase, 'complete');
});

test('recording progress holds when paused and resets for each turn or replay', t => {
  const { player, voice, spoken, tick } = setup(t);
  player.start(script, voice);
  spoken[0].progress(1.5);
  player.pause();
  spoken[0].progress(2);
  assert.equal(player.state.lineElapsed, 1.5);

  player.resume();
  spoken[0].progress(2.5);
  assert.equal(player.state.lineElapsed, 2.5);
  spoken[0].ended(); tick(260);
  assert.equal(player.state.line, 1);
  spoken[0].progress(4);
  assert.equal(player.state.lineElapsed, 0);

  spoken[1].progress(1);
  player.start(script, voice);
  spoken[1].progress(2);
  assert.equal(player.state.line, 0);
  assert.equal(player.state.lineElapsed, 0);
});

test('an utterance ending during pause cannot start another voice until resumed', t => {
  const { player, voice, spoken, tick } = setup(t);
  player.start(script, voice);
  player.pause();
  spoken[0].ended();
  tick(10000);
  assert.equal(spoken.length, 1);
  assert.equal(player.state.phase, 'paused');
  player.resume(); tick(260);
  assert.equal(spoken.length, 2);
  assert.equal(voice.pause.mock.callCount(), 1);
  assert.equal(voice.resume.mock.callCount(), 1);
});

test('leaving the component cancels playback and ignores queued callbacks', t => {
  const { player, changes, voice, spoken, tick } = setup(t);
  player.start(script, voice);
  player.dispose();
  const count = changes.length;
  spoken[0].ended(); spoken[0].failed(); tick(60000);
  assert.equal(changes.length, count);
  assert.equal(spoken.length, 1);
  assert.ok(voice.cancel.mock.callCount() > 0);
});

test('playback failure and stalled recordings expose an error and allow retry', t => {
  const { player, voice, spoken, tick } = setup(t);
  player.start(script, voice);
  spoken[0].failed();
  assert.equal(player.state.phase, 'error');
  player.start(script, voice);
  assert.equal(player.state.elapsed, 0);
  tick(12000);
  assert.equal(player.state.phase, 'error');
  player.start(script, voice);
  spoken.at(-1).ended(); tick(260);
  assert.equal(player.state.line, 1);
});

test('recording playback ignores aborted requests when pausing or switching calls', async t => {
  const pending = [];
  const audio = {
    src: '', onended: null, onerror: null,
    play: t.mock.fn(() => new Promise((resolve, reject) => pending.push({ resolve, reject }))),
    pause: t.mock.fn(), load: t.mock.fn(),
    getAttribute() { return this.src; },
    removeAttribute() { this.src = ''; },
  };
  const failed = t.mock.fn();
  const voice = recordedCallVoice(audio);
  voice.speak({ ...script[0], audio: '/caller.mp3' }, () => {}, failed);
  voice.pause();
  pending[0].reject(new Error('Playback interrupted by pause'));
  await Promise.resolve();
  assert.equal(failed.mock.callCount(), 0);
  voice.resume();
  voice.cancel();
  pending[1].reject(new Error('Playback interrupted by load'));
  await Promise.resolve();
  assert.equal(failed.mock.callCount(), 0);
  assert.equal(audio.src, '');
  assert.equal(audio.onended, null);
  assert.equal(audio.onerror, null);
});

test('resuming between recorded turns does not replay the completed clip', t => {
  const audio = { src: '', onended: null, onerror: null, play: t.mock.fn(() => Promise.resolve()), pause() {}, load() {}, getAttribute() { return this.src; }, removeAttribute() { this.src = ''; } };
  const ended = t.mock.fn();
  const failed = t.mock.fn();
  const voice = recordedCallVoice(audio);
  voice.speak({ ...script[0], audio: '/caller.mp3' }, ended, failed);
  audio.onended();
  voice.pause(); voice.resume();
  assert.equal(ended.mock.callCount(), 1);
  assert.equal(audio.play.mock.callCount(), 1);
  voice.speak({ ...script[1], audio: '/agent.mp3' }, ended, failed);
  audio.onerror();
  assert.equal(failed.mock.callCount(), 1);
});

test('handoff starts at the appended teammate turn without replaying previous lines', t => {
  const { player, tick } = setup(t);
  player.start(script);
  const handoff = [...script.slice(0, 1), { speaker: 'agent', text: 'Connecting you.' }, { speaker: 'human', text: 'I have the full context.' }];
  player.start(handoff, undefined, 1);
  assert.equal(player.state.line, 1);
  tick(1900);
  assert.equal(player.state.line, 2);
  tick(1900);
  assert.equal(player.state.phase, 'complete');
});
