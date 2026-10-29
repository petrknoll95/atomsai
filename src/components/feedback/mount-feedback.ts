import { feedbackScreen, followFeedbackSurface } from './feedback-surface';
import { contextLabel, type SubmissionContext } from './submission-context';
import type { Pindrop } from 'pindrop.js';
import type { connectFeedback } from './feedback-store';

export function mountFeedback(controls: HTMLElement, pathname: string) {
  let disposed = false;
  let stopTracking: (() => void) | undefined;
  let unsubscribe: (() => void) | undefined;
  const observers: MutationObserver[] = [];
  const button = controls.querySelector<HTMLButtonElement>('[data-feedback-toggle]');
  const status = controls.querySelector<HTMLElement>('[data-feedback-status]');
  const retry = controls.querySelector<HTMLButtonElement>('[data-feedback-retry]');
  let layer: ReturnType<typeof Pindrop.init> | undefined;
  let selectedId: string | undefined;
  const selectComment = (event: Event) => {
    for (const target of event.composedPath()) {
      if (!(target instanceof HTMLElement)) continue;
      const id = target.dataset.commentId ?? target.dataset.sidebarCommentId;
      if (id) { selectedId = id; break; }
    }
  };
  document.addEventListener('pointerdown', selectComment, true);
  document.addEventListener('click', selectComment, true);
  let store: Awaited<ReturnType<typeof connectFeedback>> | undefined;
  const path = pathname.replace(/\/+$/, '') || '/';
  // Local previews use a separate review space, so verification notes never appear on the live site.
  const page = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ? `preview:atomsai-site:${path}` : `atomsai-site:${path}`;

  function setStatus(message: string, failed = false) {
    if (disposed) return;
    if (status) {
      status.textContent = message;
      status.hidden = !failed && /^(Connecting shared feedback|Saving feedback|Shared feedback · (Connected|Saved))/.test(message);
    }
    if (retry) retry.hidden = !failed || !layer;
  }
  function syncVisibility() {
    const root = document.getElementById('pindrop-web-root');
    const open = !!root && root.style.display !== 'none';
    // Pindrop hides pins in pointer mode by default; keep existing threads discoverable.
    const pins = document.getElementById('pindrop-web-pins');
    if (pins) pins.style.display = open ? '' : 'none';
    button?.setAttribute('aria-expanded', String(open));
    if (button) {
      const label = open ? 'Close feedback' : 'Feedback';
      button.setAttribute('aria-label', label);
      button.title = label;
    }
  }

  const stopSurface = followFeedbackSurface(controls, () => {
    document.getElementById('pindrop-web-root')?.shadowRoot
      ?.querySelector<HTMLButtonElement>('button[aria-label="View mode — interact with prototype"]')?.click();
    layer?.refresh();
    syncVisibility();
  });

  const toggle = async () => {
    if (!button) return;
    if (layer) { layer.toggle(); syncVisibility(); return; }
    button.disabled = true;
    setStatus('Connecting shared feedback…');
    try {
      const [{ Pindrop }, { connectFeedback }, { trackSmoothPins }] = await Promise.all([import('pindrop.js'), import('./feedback-store'), import('./track-smooth-pins')]);
      if (disposed) return;
      store = await connectFeedback(page, setStatus);
      if (disposed) return;
      // Pindrop's persisted preference overrides its theme option. Reset it before init.
      try { localStorage.setItem('atomsai-site-feedback:shared:v1-theme', 'dark'); } catch { /* Storage may be unavailable. */ }
      layer = Pindrop.init({
        storageKey: 'atomsai-site-feedback:shared:v1',
        adapter: store.adapter,
        theme: 'dark',
        keyboardShortcuts: false,
        getScope: () => ({ page, screen: feedbackScreen() }),
        isScopeActive: scope => scope.page === page && (scope.screen ?? 'page') === feedbackScreen(),
      });
      stopTracking = trackSmoothPins(() => layer?.getComments() ?? []);
      unsubscribe = store.subscribe(comments => layer?.setComments(comments));
      layer.on('comment:add', comment => { selectedId = comment.id; });
      layer.on('mode:change', syncVisibility);
      const root = document.getElementById('pindrop-web-root');
      if (root) {
        const visibilityObserver = new MutationObserver(syncVisibility);
        visibilityObserver.observe(root, { attributes: true, attributeFilter: ['style'] });
        observers.push(visibilityObserver);
        // Keep upstream inputs within server limits and give icon-only send controls names.
        const constrainInputs = () => {
          const context = layer?.getComments().find(comment => comment.id === selectedId)?.meta?.context as SubmissionContext | undefined;
          root.shadowRoot?.querySelectorAll<HTMLElement>('.pindrop-popover, .pindrop-sheet').forEach(viewer => {
            if (!context || viewer.querySelector('[data-submission-context]')) return;
            const details = document.createElement('details');
            details.dataset.submissionContext = '';
            details.style.cssText = 'margin:12px;font:11px/1.5 system-ui;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--pindrop-text-secondary)';
            const summary = document.createElement('summary');
            summary.textContent = 'Browser & viewport';
            const text = document.createElement('p');
            text.textContent = contextLabel(context);
            details.append(summary, text);
            const image = layer?.getComments().find(comment => comment.id === selectedId)?.meta?.screenshot as {dataUrl:string} | undefined;
            if (image?.dataUrl?.startsWith('data:image/jpeg;base64,')) {
              const preview = document.createElement('img');
              preview.src = image.dataUrl;
              preview.alt = 'Area around the pin when this comment was submitted';
              preview.style.cssText = 'display:block;width:100%;height:auto;border-radius:6px;margin-top:8px';
              details.append(preview);
            }
            viewer.append(details);
          });
          if (controls) controls.hidden = !!root.shadowRoot?.querySelector('.pindrop-sheet, .pindrop-sidebar-sheet, .pindrop-name-overlay, .pindrop-new-comment-box');
          // Shared threads do not support importing another page's local dump or clearing everyone's notes.
          const importer = root.shadowRoot?.querySelector<HTMLButtonElement>('button[aria-label="Load comments"]');
          if (importer) importer.style.display = 'none';
          root.shadowRoot?.querySelectorAll<HTMLButtonElement>('.pindrop-toolbar-menu-item').forEach(item => {
            const label = item.textContent?.trim();
            if (label === 'Clear all comments') item.style.display = 'none';
            if (label && ['Light', 'Dark', 'Auto'].includes(label)) item.remove();
          });
          root.shadowRoot?.querySelectorAll('textarea').forEach(input => { input.maxLength = 8000; input.setAttribute('aria-label', input.placeholder || 'Comment'); });
          root.shadowRoot?.querySelectorAll<HTMLInputElement>('.pindrop-name-input').forEach(input => { input.maxLength = 100; });
          root.shadowRoot?.querySelectorAll('.pindrop-send-btn').forEach(send => send.setAttribute('aria-label', 'Send comment'));
        };
        if (root.shadowRoot) {
          const inputObserver = new MutationObserver(constrainInputs);
          inputObserver.observe(root.shadowRoot, { childList: true, subtree: true });
          observers.push(inputObserver);
        }
        constrainInputs();
      }
      setStatus('Shared feedback · Connected');
      syncVisibility();
    } catch (cause) {
      console.error('Unable to connect website feedback', cause);
      setStatus('Shared feedback could not connect. Check your connection and try Feedback again.');
    } finally { if (!disposed) button.disabled = false; }
  };
  button?.addEventListener('click', toggle);
  const retrySave = () => { if (layer && store) void store.adapter.save(layer.getComments()); };
  retry?.addEventListener('click', retrySave);
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (store?.hasUnsaved()) { event.preventDefault(); }
  };
  window.addEventListener('beforeunload', beforeUnload);
  return () => {
    disposed = true;
    document.removeEventListener('pointerdown', selectComment, true);
    document.removeEventListener('click', selectComment, true);
    button?.removeEventListener('click', toggle);
    retry?.removeEventListener('click', retrySave);
    window.removeEventListener('beforeunload', beforeUnload);
    observers.forEach(observer => observer.disconnect());
    stopSurface();
    stopTracking?.();
    unsubscribe?.();
    const modalOpen = document.getElementById('pindrop-web-root')?.shadowRoot
      ?.querySelector('.pindrop-sheet, .pindrop-sidebar-sheet');
    layer?.destroy();
    if (modalOpen) {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
    }
  };
}
