import type { CSSProperties, ReactNode } from 'react';
import { assetPath } from '@/lib/base-path';
import styles from './scene-kit.module.css';

/**
 * Parts for small product scenes in the homepage's product-UI language
 * (home/serviceagent-scene, home/justcall-scene): pale rounded wrappers, white
 * inset panels, restrained pills and normal interface labels. Every size is in
 * em, so a scene scales with the font size of the frame it sits in.
 * Scenes are pictures: they hold no links or controls.
 */
export function SceneCanvas({ children, width = 30, className = '' }: { children: ReactNode; width?: number; className?: string }) {
  return <div className={`${styles.canvas} ${className}`} style={{ '--scene-width': `${width}em` } as CSSProperties}>{children}</div>;
}

/** A pale wrapper with a header row and a white inset body. */
export function SceneWindow({ title, mark, meta, children, className = '' }: {
  title: ReactNode; mark?: string; meta?: ReactNode; children: ReactNode; className?: string;
}) {
  return <div className={`${styles.window} ${className}`}>
    <div className={styles.header}>
      {mark && <SceneMark src={mark} />}
      <span className={styles.title}>{title}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
    <div className={styles.body}>{children}</div>
  </div>;
}

/** A product mark from /assets/products, drawn in the current colour. */
export function SceneMark({ src }: { src: string }) {
  return <span className={styles.mark} style={{ maskImage: `url('${assetPath(`/assets/products/${src}`)}')` }} />;
}

export function ScenePill({ children, tone = 'neutral', live = false }: { children: ReactNode; tone?: 'neutral' | 'success' | 'ink'; live?: boolean }) {
  return <span className={styles.pill} data-tone={tone}>{live && <i className={styles.live} />}{children}</span>;
}

export function ScenePills({ children }: { children: ReactNode }) {
  return <div className={styles.pills}>{children}</div>;
}

/** A soft grey block inside a white body: a player, a quoted request, a code line. */
export function SceneSoft({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.soft} ${className}`}>{children}</div>;
}

/** Label above value, the way the homepage scenes list call outcomes. */
export function SceneField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <div className={styles.field}><span className={styles.label}>{label}</span><span className={styles.value}>{children}</span></div>;
}

export function SceneFields({ children, columns = 1 }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
  return <div className={styles.fields} data-columns={columns}>{children}</div>;
}

/** One line of a conversation: who spoke, then what they said. */
export function SceneLine({ speaker, children, side = 'start' }: { speaker: ReactNode; children: ReactNode; side?: 'start' | 'end' }) {
  return <div className={styles.line} data-side={side}><span className={styles.label}>{speaker}</span><p className={styles.bubble}>{children}</p></div>;
}

/** An event between lines: a handoff, a booking, a barge-in. */
export function SceneEvent({ children }: { children: ReactNode }) {
  return <p className={styles.event}>{children}</p>;
}

/** A big readout with its label, for the one number a step is about. */
export function SceneMetric({ value, label }: { value: ReactNode; label: ReactNode }) {
  return <div className={styles.metric}><span className={styles.metricValue}>{value}</span><span className={styles.label}>{label}</span></div>;
}

/** A row in a list: a leading label, optional detail, and a trailing pill or value. */
export function SceneRow({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return <div className={styles.row}><div className={styles.rowMain}>{children}</div>{end && <div className={styles.rowEnd}>{end}</div>}</div>;
}

export function SceneMuted({ children }: { children: ReactNode }) {
  return <span className={styles.muted}>{children}</span>;
}

/** Two windows joined by a small arrow, for "this leads to that". */
export function SceneFlow({ children }: { children: ReactNode }) {
  return <div className={styles.flow}>{children}</div>;
}
