// Lifecycle regression checks; rendering and responsive appearance are checked in-browser.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/components/home/menu-hero/entrance.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture({ available = null, reduced = false, visible = false, top = 0 } = {}) {
  const timers = new Map(), frames = new Map(), timelines = [], recoveries = [];
  let id = 0, fontsResolve;
  const events = () => {
    const listeners = new Map();
    return {
      listeners,
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: name => listeners.delete(name),
      fire: (name, event = {}) => listeners.get(name)?.(event),
    };
  };
  const media = { ...events(), matches: reduced };
  const stage = { ...events(), dataset: {}, getBoundingClientRect: () => ({ top }) };
  const copy = { style: {} }, pattern = { style: {} };
  const apply = (element, values) => {
    if (values.clearProps) values.clearProps.split(',').forEach(key => delete element.style[key]);
    else Object.assign(element.style, values);
  };
  const tween = (element, from, to) => {
    apply(element, from);
    return { element, killed: false, kill() { this.killed = true; }, complete() { if (!this.killed) { apply(element, to); to.onComplete?.(); } } };
  };
  const gsap = {
    set: (elements, values) => (Array.isArray(elements) ? elements : [elements]).forEach(element => apply(element, values)),
    timeline: ({ onComplete }) => {
      const timeline = {
        tweens: [], killed: false,
        fromTo(element, from, to) { this.tweens.push(tween(element, from, to)); return this; },
        kill() { this.killed = true; this.tweens.forEach(item => item.kill()); },
        killTweensOf(element) { this.tweens.filter(item => item.element === element).forEach(item => item.kill()); },
        complete() { if (!this.killed) { this.tweens.forEach(item => item.complete()); onComplete(); } },
      };
      timelines.push(timeline); return timeline;
    },
    fromTo: (...args) => { const item = tween(...args); recoveries.push(item); return item; },
  };
  const win = { ...events(), setTimeout: fn => { timers.set(++id, fn); return id; } };
  const testModule = { exports: {} };
  runInNewContext(source, {
    exports: testModule.exports, require: () => ({ gsap }), window: win,
    document: { fonts: { ready: new Promise(resolve => { fontsResolve = resolve; }) } },
    matchMedia: () => media, getComputedStyle: () => ({ visibility: visible ? 'visible' : 'hidden' }),
    clearTimeout: key => timers.delete(key), cancelAnimationFrame: key => frames.delete(key),
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
  });
  const mount = () => testModule.exports.mountHeroEntrance({ stage, copy, pattern, available });
  const controller = mount();
  return {
    controller, mount, stage, copy, pattern, media, win, timers, frames, timelines, recoveries,
    fonts: async () => { fontsResolve(); await Promise.resolve(); },
    frame: () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); },
    deadline: () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
    ready: async function () { await this.fonts(); controller.availabilityChanged(true); this.frame(); this.frame(); },
  };
}

test('cold load waits for both fonts and the first rendered background frame', async () => {
  const f = fixture();
  f.controller.availabilityChanged(true); f.frame();
  assert.equal(f.stage.dataset.heroEntry, 'pending');
  assert.equal(f.timelines.length, 0);
  await f.fonts(); f.frame();
  assert.equal(f.stage.dataset.heroEntry, 'pending');
  f.frame();
  assert.equal(f.stage.dataset.heroEntry, 'revealing');
  assert.equal(f.pattern.style.opacity, 0);
  assert.ok(f.pattern.style.y < 0, 'art starts above its resting position');
  f.timelines[0].complete();
  assert.equal(f.stage.dataset.heroEntry, 'ready');
  assert.equal(f.pattern.style.willChange, undefined);
  f.controller.destroy();
});

test('cached fonts alone never expose an unprepared shader', async () => {
  const f = fixture(); await f.fonts(); f.frame(); f.frame();
  assert.equal(f.stage.dataset.heroEntry, 'pending');
  assert.equal(f.timelines.length, 0); f.controller.destroy();
});

test('shader failure reveals readable copy without animating an empty canvas', async () => {
  const f = fixture({ available: false }); await f.fonts(); f.frame(); f.frame();
  assert.equal(f.timelines[0].tweens.length, 1);
  assert.equal(f.timelines[0].tweens[0].element, f.copy);
  f.timelines[0].complete(); assert.equal(f.stage.dataset.heroEntry, 'ready');
  assert.equal(f.stage.dataset.heroPatternState, 'unavailable'); f.controller.destroy();
});

test('stalled loading fails open; a late shader never replays the copy', () => {
  const f = fixture(); f.deadline(); f.frame(); f.frame(); f.timelines[0].complete();
  assert.equal(f.stage.dataset.heroEntry, 'ready');
  f.controller.availabilityChanged(true);
  assert.equal(f.timelines.length, 1); assert.equal(f.recoveries.length, 1);
  assert.equal(f.recoveries[0].element, f.pattern);
  f.recoveries[0].complete(); f.controller.destroy();
});

test('resize readiness notifications do not restart the entrance', async () => {
  const f = fixture(); await f.ready(); f.timelines[0].complete();
  f.controller.availabilityChanged(true); f.controller.availabilityChanged(true);
  assert.equal(f.timelines.length, 1); assert.equal(f.recoveries.length, 0); f.controller.destroy();
});

test('context loss during entry cancels the background tween but preserves copy', async () => {
  const f = fixture(); await f.ready(); f.controller.availabilityChanged(false);
  assert.equal(f.timelines[0].tweens.find(item => item.element === f.pattern).killed, true);
  assert.equal(f.timelines[0].tweens.find(item => item.element === f.copy).killed, false);
  f.controller.availabilityChanged(true); f.timelines[0].complete();
  assert.equal(f.stage.dataset.heroEntry, 'ready');
  assert.equal(f.pattern.style.opacity, 0, 'copy completion must not jump a recovering background to full opacity');
  f.recoveries[0].complete(); f.controller.destroy();
});

test('reduced motion and restored scroll skip movement', async () => {
  for (const options of [{ reduced: true }, { top: -200 }]) {
    const f = fixture(options); await f.ready();
    assert.equal(f.stage.dataset.heroEntry, 'ready'); assert.equal(f.timelines.length, 0); f.controller.destroy();
  }
});

test('changing motion preferences mid-entry settles immediately', async () => {
  const f = fixture(); await f.ready(); f.media.matches = true; f.media.fire('change');
  assert.equal(f.stage.dataset.heroEntry, 'ready'); assert.equal(f.timelines[0].killed, true); f.controller.destroy();
});

test('focus, history restoration, and late hydration never re-hide readable content', async () => {
  for (const event of ['focus', 'history', 'late']) {
    const f = fixture({ visible: event === 'late' });
    if (event === 'focus') f.stage.fire('focusin');
    if (event === 'history') f.win.fire('pageshow', { persisted: true });
    await f.fonts(); f.frame(); f.frame();
    assert.equal(f.stage.dataset.heroEntry, 'ready'); assert.equal(f.timelines.length, 0); f.controller.destroy();
  }
});

test('unmount cancels pending work and a remount starts cleanly', async () => {
  const f = fixture(); f.controller.availabilityChanged(true); await f.fonts();
  f.controller.destroy(); f.frame(); f.deadline();
  assert.equal(f.timelines.length, 0); assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
  assert.equal(f.media.listeners.size + f.win.listeners.size + f.stage.listeners.size, 0);
  const next = f.mount(); await f.fonts(); next.availabilityChanged(true); f.frame(); f.frame();
  assert.equal(f.timelines.length, 1); next.destroy();
  assert.equal(f.timelines[0].killed, true);
});
