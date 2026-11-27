import type { ReactNode } from 'react';
import {
  SceneCanvas, SceneField, SceneFields, SceneLine, SceneMetric, SceneMuted, ScenePill, ScenePills, SceneRow, SceneSoft, SceneWindow,
} from './scene-kit';
import styles from './infrastructure-box-scenes.module.css';

/**
 * One small product scene per API in What's in the box, in the homepage's
 * product-UI language. Each pictures what its step's copy says the API gives
 * back; words come from that copy or are plain interface labels. One call runs
 * through them: a caller checking an order. Scenes are pictures, so they hold
 * no links or controls; ScenePanel hides them from assistive tech.
 */
export const boxScenes = ['telephony', 'hear', 'omni', 'speak', 'recap', 'trace'] as const;
export type BoxSceneKind = (typeof boxScenes)[number];

// Speech-shaped bar heights for the Speak player; the first part reads as played.
const bars = [38, 62, 80, 54, 30, 46, 72, 88, 64, 40, 28, 52, 76, 60, 34, 22, 48, 70, 84, 58, 36, 50, 66, 42, 26, 18, 32, 24];
const played = 11;

function Stage({ children, width = 42 }: { children: ReactNode; width?: number }) {
  return <SceneCanvas width={width} className={styles.stage}>{children}</SceneCanvas>;
}

/** SceneWindow with a second white panel under the body, as the homepage PyAI cards end. */
function Window({ title, meta, footer, children, className = '' }: { title: ReactNode; meta?: ReactNode; footer: ReactNode; children: ReactNode; className?: string }) {
  // A light card that can pass under the fixed header while the panel around it is dark.
  return <div className={`${styles.window} ${className}`} data-header-backdrop="">
    <div className={styles.windowHeader}><span className={styles.windowTitle}>{title}</span>{meta && <span className={styles.windowMeta}>{meta}</span>}</div>
    <div className={styles.windowBody}>{children}</div>
    <div className={styles.windowFooter}>{footer}</div>
  </div>;
}

function Title({ name, beta }: { name: string; beta?: boolean }) {
  return <span className={styles.title}>{name}{beta && <ScenePill>Beta</ScenePill>}</span>;
}

function Check() {
  return <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

/** A number with call controls, and who picked up. */
function Telephony({ name }: { name: string }) {
  return <Stage>
    <div className={styles.pair}>
      <Window title={<Title name={name} />} meta="Outbound call"
        footer={<><i className={styles.dot} />Connected<span className={styles.end}><SceneMuted>0:12</SceneMuted></span></>}>
        <SceneField label="Managed number"><span className={styles.number}>+1 (252) 555-0142</span></SceneField>
        <ScenePills><ScenePill>Transfer</ScenePill><ScenePill>Hold</ScenePill><ScenePill>Keypad</ScenePill></ScenePills>
      </Window>
      <SceneWindow title="Who picked up" meta="AMD" className={styles.dropped}>
        <div className={styles.rows}>
          <SceneRow end={<ScenePill tone="success"><Check />Detected</ScenePill>}>Person</SceneRow>
          <SceneRow><SceneMuted>Voicemail</SceneMuted></SceneRow>
          <SceneRow><SceneMuted>Screening assistant</SceneMuted></SceneRow>
        </div>
      </SceneWindow>
    </div>
  </Stage>;
}

/** A live transcript: one utterance marked final, the next still arriving. */
function Hear({ name }: { name: string }) {
  return <Stage width={38}>
    <Window title={<Title name={name} />} meta={<ScenePill live>Live</ScenePill>}
      footer={<SceneMetric value="~200 ms" label="to the first partial, measured in-region" />}>
      <ol className={styles.transcript}>
        <li><span className={styles.time}>0:04</span><p>Hi, I’m calling to check an order.</p><ScenePill tone="success">Final</ScenePill></li>
        <li data-partial><span className={styles.time}>0:07</span><p>And can you find an appoint<i className={styles.caret} /></p><ScenePill>Partial</ScenePill></li>
      </ol>
    </Window>
  </Stage>;
}

/** The agent calls one of your functions and answers with the result. */
function Omni({ name }: { name: string }) {
  return <Stage>
    <div className={`${styles.pair} ${styles.pairNarrowFirst}`}>
      <SceneWindow title="Agent" className={styles.config}>
        <div className={styles.rows}>
          <SceneRow end={<Check />}>Instructions</SceneRow>
          <SceneRow end={<Check />}>Knowledge</SceneRow>
          <SceneRow>Tools<span className={styles.tools}><code>check_order</code><code>find_appointment</code></span></SceneRow>
        </div>
      </SceneWindow>
      <SceneWindow title={<Title name={name} />} meta={<ScenePill live>On call</ScenePill>} className={styles.dropped}>
        <SceneLine speaker="Caller">Can you check an order for me?</SceneLine>
        <SceneSoft className={styles.call}>
          <span className={styles.callHead}><code>check_order</code><ScenePill tone="success">Result</ScenePill></span>
          <span className={styles.callResult}><SceneMuted>status</SceneMuted><code>shipped</code></span>
        </SceneSoft>
        <SceneLine speaker="Agent" side="end">Your order has shipped.</SceneLine>
      </SceneWindow>
    </div>
  </Stage>;
}

/** A voice, a line of text, and speech streaming back. */
function Speak({ name }: { name: string }) {
  return <Stage width={38}>
    <Window title={<Title name={name} />} meta="Text to speech"
      footer={<SceneMetric value="~53 ms" label="until speech starts, measured in-region" />}>
      <SceneField label="Voice">
        <ScenePills><ScenePill tone="ink">Stock</ScenePill><ScenePill>Cloned</ScenePill><ScenePill>Designed</ScenePill></ScenePills>
      </SceneField>
      <SceneField label="Text"><span className={styles.say}>Your order has shipped.</span></SceneField>
      <SceneSoft className={styles.player}>
        <span className={styles.play}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5h2v9H5zm4 0h2v9H9z" fill="currentColor" /></svg></span>
        <span className={styles.wave}>{bars.map((height, index) => <i key={index} data-played={index < played} style={{ height: `${height}%` }} />)}</span>
        <SceneMuted>Streaming</SceneMuted>
      </SceneSoft>
    </Window>
  </Stage>;
}

/** What the call leaves behind, sent to your app when it ends. */
function Recap({ name }: { name: string }) {
  return <Stage width={38}>
    <p className={styles.ended}><i className={styles.dot} />Call ended<SceneMuted>2:14</SceneMuted></p>
    <Window title={<Title name={name} />} className={styles.linked}
      footer={<><Check />Sent by webhook<span className={styles.end}><SceneMuted>When the call ends</SceneMuted></span></>}>
      <SceneField label="Summary">The caller asked to check an order. The agent found it and shared its status.</SceneField>
      <SceneFields columns={2}>
        <SceneField label="Disposition"><ScenePill tone="success">Resolved</ScenePill></SceneField>
        <SceneField label="Next step">Send a tracking link</SceneField>
      </SceneFields>
      <SceneSoft className={styles.custom}>
        <span className={styles.customLabel}>Custom fields</span>
        <span className={styles.kv}><SceneMuted>order_status</SceneMuted><code>shipped</code></span>
        <span className={styles.kv}><SceneMuted>callback_needed</SceneMuted><code>false</code></span>
      </SceneSoft>
    </Window>
  </Stage>;
}

/** A scorecard: a cited finding beside its rule, a redaction and the audit hash. */
function Trace({ name, beta }: { name: string; beta: boolean }) {
  return <Stage>
    <Window title={<Title name={name} beta={beta} />} meta="Scorecard"
      footer={<><span className={styles.hashLabel}>Audit hash</span><code className={styles.hash}>4f9c0b…e21a7d</code><span className={styles.end}><SceneMuted>Tamper-evident</SceneMuted></span></>}>
      <div className={styles.finding}>
        <div className={styles.cited}>
          <span className={styles.label}>Finding <SceneMuted>· 0:09</SceneMuted></span>
          <p className={styles.quote} data-cited><span className={styles.label}>Agent</span><span>Can you confirm the name on the order?</span></p>
          <p className={styles.quote}><span className={styles.label}>Caller</span><span>It’s <span className={styles.redacted}><i /><i /></span></span></p>
          <ScenePills><ScenePill>Cited</ScenePill><ScenePill>Redacted</ScenePill></ScenePills>
        </div>
        <div className={styles.rule}>
          <span className={styles.label}>Rule</span>
          <p>Confirm the caller’s identity before sharing order details.</p>
          <ScenePill tone="success"><Check />Met</ScenePill>
        </div>
      </div>
    </Window>
  </Stage>;
}

export function BoxScene({ kind, name, beta = false }: { kind: BoxSceneKind | undefined; name: string; beta?: boolean }) {
  switch (kind) {
    case 'telephony': return <Telephony name={name} />;
    case 'hear': return <Hear name={name} />;
    case 'omni': return <Omni name={name} />;
    case 'speak': return <Speak name={name} />;
    case 'recap': return <Recap name={name} />;
    case 'trace': return <Trace name={name} beta={beta} />;
    default: return null;
  }
}
