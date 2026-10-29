export function activeFeedbackDialog(): HTMLDialogElement | null {
  return [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1) ?? null;
}
export function feedbackScreen() {
  const dialog = activeFeedbackDialog();
  if (!dialog) return 'page';
  const name = dialog.dataset.feedbackScreen || dialog.getAttribute('aria-label') || dialog.id || 'dialog';
  const panel = dialog.querySelector<HTMLElement>('[data-menu-group][data-expanded="true"]')?.dataset.menuGroup;
  return `dialog:${name}${panel ? `:${panel}` : ''}`;
}

export function followFeedbackSurface(controls: HTMLElement, changed: () => void) {
  const home = document.createComment('feedback controls');
  controls.before(home);
  let previous = '';
  let previousHost: HTMLElement | null = null;
  const sync = () => {
    const dialog = activeFeedbackDialog();
    const host = dialog ?? document.body;
    const screen = feedbackScreen();
    // Only move nodes if needed; otherwise observing our own moves would loop.
    for (const node of [controls, ...['pindrop-web-overlay','pindrop-web-pins','pindrop-web-root'].map(id => document.getElementById(id))]) {
      if (node && node.parentElement !== host) host.append(node);
    }
    const pins = document.getElementById('pindrop-web-pins');
    if (pins) {
      pins.style.position = dialog ? 'fixed' : 'absolute';
      pins.style.top = dialog ? `${-scrollY}px` : '0px';
      pins.style.left = dialog ? `${-scrollX}px` : '0px';
    }
    if (screen !== previous || host !== previousHost) {
      previous = screen; previousHost = host; changed();
    }
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['open','data-expanded']});
  document.addEventListener('scroll', sync, true);
  sync();
  return () => {
    observer.disconnect();
    document.removeEventListener('scroll', sync, true);
    home.replaceWith(controls);
  };
}
