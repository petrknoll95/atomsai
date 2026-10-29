import html2canvas from 'html2canvas-pro';
import type { Comment } from 'pindrop.js';
import { activeFeedbackDialog } from './feedback-surface';

export type PinImage = { dataUrl: string; width: number; height: number };

export async function capturePinImage(anchor: Comment['anchor']): Promise<PinImage | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([capture(anchor), new Promise<undefined>(resolve => {
      timer = setTimeout(() => resolve(undefined), 8000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

async function capture(anchor: Comment['anchor']): Promise<PinImage | undefined> {
  try {
    const target = document.querySelector(anchor.selector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const width = Math.min(480, innerWidth), height = Math.min(320, innerHeight);
    const x = Math.max(0, Math.min(innerWidth - width, rect.left + rect.width * anchor.offsetX - width / 2));
    const y = Math.max(0, Math.min(innerHeight - height, rect.top + rect.height * anchor.offsetY - height / 2));
    const dialog = activeFeedbackDialog();
    const source = dialog ?? document.body;
    const bounds = source.getBoundingClientRect();
    const canvas = await html2canvas(source, {
      x: x - bounds.left, y: y - bounds.top, width, height, scale: 1,
      useCORS: true, logging: false, imageTimeout: 3000,
      ignoreElements: element => element.matches('[data-feedback], [id^="pindrop-web-"], iframe, video, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-feedback-private]'),
      onclone: document => {
        // A cloned modal is not in the browser top layer, so explicitly display it.
        document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(el => { el.style.display = 'flex'; });
      },
    });
    // Keep each inline attachment comfortably below Firestore's document limit.
    for (const quality of [.7, .5, .3]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= 120000) return {dataUrl, width, height};
    }
  } catch (error) {
    console.warn('Could not capture the comment area', error);
  }
}
