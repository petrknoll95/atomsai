import { capturePinImage, type PinImage } from './capture-pin-image';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocsFromServer, getFirestore, onSnapshot, writeBatch, type DocumentData } from 'firebase/firestore';
import type { Comment } from 'pindrop.js';
import { captureSubmissionContext, type SubmissionContext } from './submission-context';
import { firebaseConfig } from './firebase';

type Reply = Comment['replies'][number];
type Row = DocumentData & { id: string; ownerUid: string };
type CommentRow = Omit<Comment, 'replies' | 'scope' | 'unread'> & { ownerUid: string };
type ReplyRow = Reply & { ownerUid: string; commentId: string };
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export async function connectFeedback(page: string, status: (message: string, failed?: boolean) => void) {
  const app = getApps().find(app => app.name === 'atomsai-feedback') ?? initializeApp(firebaseConfig, 'atomsai-feedback');
  const auth = getAuth(app);
  await auth.authStateReady();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
  const db = getFirestore(app);
  const pageId = encodeURIComponent(page);
  const commentsRef = collection(db, 'pages', pageId, 'comments');
  const repliesRef = collection(db, 'pages', pageId, 'replies');
  let comments = new Map<string, CommentRow>();
  let replies = new Map<string, ReplyRow>();
  let baseline: Comment[] = [];
  const captured = new Map<string, SubmissionContext>();
  const images = new Map<string, Promise<PinImage | undefined>>();
  const newMeta = new Map<string, Record<string, unknown>>();
  let pending = 0;
  let failed = false;
  let receive: ((value: Comment[]) => void) | undefined;
  let queue = Promise.resolve();
  const stops: (() => void)[] = [];

  /* eslint-disable @typescript-eslint/no-unused-vars -- Strip storage-only ownership fields from the public comment model. */
  function assemble(): Comment[] {
    return [...comments.values()].map(({ ownerUid: _owner, ...c }) => ({
      ...c, scope: { page, screen: c.meta?.screen ?? 'page' }, unread: false,
      replies: [...replies.values()].filter(r => r.commentId === c.id)
        .map(({ ownerUid: _uid, commentId: _id, ...r }) => r)
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
    } as Comment)).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  function publish() {
    if (pending || failed) return;
    baseline = clone(assemble());
    receive?.(clone(baseline));
  }
  const initial = await Promise.all([getDocsFromServer(commentsRef), getDocsFromServer(repliesRef)]);
  comments = new Map(initial[0].docs.map(d => [d.id, d.data() as CommentRow]));
  replies = new Map(initial[1].docs.map(d => [d.id, d.data() as ReplyRow]));
  baseline = clone(assemble());

  function commentRow(c: Comment): Row {
    const meta = comments.get(c.id)?.meta ?? newMeta.get(c.id);
    return { ...(meta ? { meta } : {}), id: c.id, ownerUid: comments.get(c.id)?.ownerUid ?? user.uid,
      author: c.author, text: c.text, anchor: c.anchor, createdAt: c.createdAt, updatedAt: c.updatedAt,
      resolved: c.resolved, resolvedBy: c.resolvedBy ?? '', resolvedAt: c.resolvedAt ?? '' };
  }
  function replyRow(r: Reply, commentId: string): Row {
    return { id:r.id, commentId, ownerUid: replies.get(r.id)?.ownerUid ?? user.uid,
      author:r.author, text:r.text, createdAt:r.createdAt, updatedAt:r.updatedAt };
  }
  function owned(row: Row | undefined) {
    if (row && row.ownerUid !== user.uid) throw new Error('You can edit or delete only your own comments and replies.');
  }

  const adapter = {
    load: () => clone(baseline),
    save(value: Comment[]) {
      const desired = clone(value);
      // Capture synchronously on first submit, never when queued writes/retries run.
      for (const c of desired) {
        if (c.scope?.page === page && !comments.has(c.id) && !baseline.some(old => old.id === c.id) && !captured.has(c.id)) {
          captured.set(c.id, captureSubmissionContext());
          newMeta.set(c.id, {context: captured.get(c.id), screen: c.scope?.screen ?? 'page'});
          images.set(c.id, capturePinImage(c.anchor));
        }
      }
      pending++;
      status('Saving feedback…');
      queue = queue.then(async () => {
        const previous = new Map(baseline.map(c => [c.id, c]));
        const next = new Map(desired.map(c => [c.id, c]));
        const batch = writeBatch(db);
        let writes = 0;
        // Each changed comment/reply is its own write; never replace the page's entire thread list.
        for (const c of desired) {
          if (c.scope?.page !== page) continue;
          const before = previous.get(c.id);
          if (!before && images.has(c.id)) {
            const screenshot = await images.get(c.id);
            if (screenshot) newMeta.set(c.id, {...newMeta.get(c.id), screenshot});
          }
          const row = commentRow(c);
          if (!before) { batch.set(doc(commentsRef,c.id),row); writes++; }
          else if (!equal(commentRow(before),row)) {
            const old = commentRow(before);
            const changes = Object.fromEntries(Object.entries(row).filter(([key,v]) => !equal(v,old[key])));
            if (Object.keys(changes).some(k => !['resolved','resolvedBy','resolvedAt','updatedAt'].includes(k))) owned(comments.get(c.id));
            batch.update(doc(commentsRef,c.id), changes); writes++;
          }
          const oldReplies = new Map((before?.replies ?? []).map(r => [r.id,r]));
          for (const r of c.replies) {
            const old = oldReplies.get(r.id);
            if (!old || !equal(old,r)) {
              owned(replies.get(r.id));
              batch.set(doc(repliesRef,r.id),replyRow(r,c.id)); writes++;
            }
          }
          for (const r of before?.replies ?? []) if (!c.replies.some(n => n.id === r.id)) {
            owned(replies.get(r.id)); batch.delete(doc(repliesRef,r.id)); writes++;
          }
        }
        for (const c of baseline) if (!next.has(c.id)) {
          owned(comments.get(c.id)); batch.delete(doc(commentsRef,c.id)); writes++;
        }
        if (writes > 450) throw new Error('Please import fewer comments at a time.');
        if (writes) await batch.commit();
        baseline = clone(desired);
        failed = false;
        status('Shared feedback · Saved');
      }).catch((cause: unknown) => {
        const forbidden = cause instanceof Error && cause.message.startsWith('You can');
        failed = !forbidden;
        status(forbidden ? (cause as Error).message : 'Feedback was not saved. Check your connection and retry.', !forbidden);
      }).finally(() => {
        pending--;
        if (!pending && !failed) publish();
      });
      return queue;
    },
  };

  return {
    adapter,
    subscribe(callback: (value: Comment[]) => void) {
      receive = callback;
      const error = () => status('Live updates disconnected. Check your connection and reload.', true);
      stops.push(onSnapshot(commentsRef, snap => {
        comments = new Map(snap.docs.map(d => [d.id, d.data() as CommentRow])); publish();
      }, error));
      stops.push(onSnapshot(repliesRef, snap => {
        replies = new Map(snap.docs.map(d => [d.id, d.data() as ReplyRow])); publish();
      }, error));
      return () => { stops.forEach(stop => stop()); receive = undefined; };
    },
    hasUnsaved: () => pending > 0 || failed,
  };
}
