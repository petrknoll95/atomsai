import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const label = process.argv[2] || 'before';
const out = `docs/visual/dropdown-frame-review/${label}`;
await fs.mkdir(`${out}/frames`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://localhost:3001/');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1800);
const client = await page.context().newCDPSession(page);
const captures = [], writes = [];
client.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = `frame-${String(captures.length).padStart(4, '0')}.jpg`;
  captures.push({ file, time: metadata.timestamp });
  writes.push(fs.writeFile(`${out}/frames/${file}`, Buffer.from(data, 'base64')));
  void client.send('Page.screencastFrameAck', { sessionId });
});
await page.evaluate(() => {
  window.reviewFrames = []; window.reviewPhase = 'closed'; window.reviewRunning = true;
  const start = performance.now();
  const sample = time => {
    const viewport = document.querySelector('[data-desktop-menu-viewport]');
    const header = document.querySelector('header');
    const css = getComputedStyle(viewport);
    window.reviewFrames.push({ time: time - start, phase: window.reviewPhase, open: viewport.dataset.open,
      height: viewport.getBoundingClientRect().height, opacity: Number(css.opacity), visibility: css.visibility,
      theme: header.dataset.theme, headerSurface: getComputedStyle(header, '::before').opacity,
      panes: [...viewport.querySelectorAll('[data-dropdown-pane]')].map(pane => ({ name: pane.dataset.dropdownPane, opacity: Number(getComputedStyle(pane).opacity), visible: getComputedStyle(pane).visibility, x: new DOMMatrix(getComputedStyle(pane).transform).m41, height: pane.getBoundingClientRect().height, inert: pane.inert })) });
    if (window.reviewRunning && time - start < 20000) requestAnimationFrame(sample);
  }; requestAnimationFrame(sample);
});
await client.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 1600, maxHeight: 900, everyNthFrame: 1 });
const phase = name => page.evaluate(name => window.reviewPhase = name, name);
const hover = name => page.locator(`[data-menu="${name}"] > summary`).hover();
const close = () => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'AI Services' }).hover();
await page.waitForTimeout(150);
await phase('open'); await hover('Applications'); await page.waitForTimeout(650);
await phase('close'); await close(); await page.waitForTimeout(650);
await phase('reopen'); await hover('Applications'); await page.waitForTimeout(650);
await phase('switch-company'); await hover('Company'); await page.waitForTimeout(650);
await phase('leave'); await page.mouse.move(10, 850); await page.waitForTimeout(850);
await phase('interrupted-open'); await hover('Applications'); await page.waitForTimeout(110);
await phase('interrupted-close'); await close(); await page.waitForTimeout(90);
await phase('interrupted-reopen'); await hover('Applications'); await page.waitForTimeout(650);
await phase('rapid-switch'); await hover('Resources'); await page.waitForTimeout(100); await hover('Company'); await page.waitForTimeout(70); await hover('Applications'); await page.waitForTimeout(650);
await client.send('Page.stopScreencast');
const samples = await page.evaluate(() => { window.reviewRunning = false; return window.reviewFrames; });
await Promise.all(writes);
await fs.writeFile(`${out}/samples.json`, JSON.stringify({ errors, captures, samples }, null, 2));
const concat = captures.map((frame, i) => `file 'frames/${frame.file}'\nduration ${Math.min(.5, Math.max(.01, (captures[i + 1]?.time ?? frame.time + .04) - frame.time))}`).join('\n');
await fs.writeFile(`${out}/frames.txt`, concat);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${out}/frames.txt`, '-vf', 'fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', `${out}/recording.mp4`]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${out}/recording.mp4`, '-vf', 'fps=8,crop=1600:580:0:0,scale=400:-1,tile=8x8', '-frames:v', '1', `${out}/filmstrip.jpg`]);
await browser.close();
console.log(JSON.stringify({ label, recordedFrames: captures.length, sampledFrames: samples.length, errors }));
