import type { CSSProperties, ReactNode } from 'react';
import { approachSection, type OrderRecord } from './approach-content';
import { SceneCanvas, SceneField, SceneFields, SceneMuted, ScenePill, ScenePills, SceneRow } from './scene-kit';
import styles from './approach-scenes.module.css';

/*
 * The product scenes on /approach, in the homepage "Now it's your turn" language:
 * pale windows on a faint dashboard outline. One order record follows the five
 * workflow steps; one scene per approach stage pictures its three deliverables
 * as working artefacts. Words come from the page's own copy (the steps, the
 * record, the integration diagram, the stage copy) plus plain interface labels;
 * grey lines stand in for text a scene does not need to spell out, and nothing
 * carries a number the page does not. Scenes are pictures: ScenePanel hides them
 * from assistive tech, so each step's detail says in words what its scene adds.
 */

const workflow = approachSection('workflow');
const diagram = approachSection('integration').diagram ?? [];
/** The delivery change, step by step: the process the Understand stage maps. */
const processSteps = workflow.blocks.map(block => block.title);
/** CRM, ERP, Documents, Internal systems. */
const systems = diagram[0]?.items ?? [];
/** Move delivery, Approve, Reject. */
const [action = '', approve = '', reject = ''] = diagram[2]?.items ?? [];
const request = workflow.record?.rows[0]?.value ?? '';
const policy = workflow.record?.rows[2]?.value ?? '';

/* ---------- Parts ---------- */

/** A scene on the faint dashboard outline the homepage and PyAI scenes sit on. */
function Stage({ children, width = 42 }: { children: ReactNode; width?: number }) {
  return <SceneCanvas width={width} className={styles.stage}>{children}</SceneCanvas>;
}

/** The kit's window, with an optional second white panel under the body, as the PyAI scenes end. */
function Window({ title, meta, footer, children, className = '', bodyClassName = '' }: {
  title: ReactNode; meta?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string;
}) {
  // A light card that can pass under the fixed header while the panel around it is dark.
  return <div className={`${styles.window} ${className}`} data-header-backdrop="">
    <div className={styles.windowHeader}><span className={styles.windowTitle}>{title}</span>{meta && <span className={styles.windowMeta}>{meta}</span>}</div>
    <div className={`${styles.windowBody} ${bodyClassName}`}>{children}</div>
    {footer && <div className={styles.windowFooter}>{footer}</div>}
  </div>;
}

/** Two windows side by side, the second dropped below the first, as in the homepage scenes. */
function Pair({ first, second }: { first: ReactNode; second: ReactNode }) {
  return <div className={styles.pair}><div className={styles.first}>{first}</div><div className={styles.dropped}>{second}</div></div>;
}

function Check() {
  return <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function Done() {
  return <span className={styles.done}><Check /></span>;
}

/** A neutral grey line standing in for text. */
function Placeholder({ width }: { width: number }) {
  return <i className={styles.placeholder} style={{ width: `${width}em` }} />;
}

/** A readout without a number: how far a measure reaches, and where its target sits. */
function Track({ value, target }: { value: number; target: number }) {
  return <span className={styles.track} style={{ '--value': `${value}%`, '--target': `${target}%` } as CSSProperties}><i /><b /></span>;
}

/* ---------- The order record ---------- */

/*
 * The prototype's record as each step leaves it (ai-services.html, the workflow
 * script): step n writes row n and marks it. Until then a row shows what the
 * record held (the old delivery date struck through, the old route) or a dash.
 * While availability is checked the new date carries its open slots. Each step
 * ends on a status; the last one closes the record.
 */
const heldBefore: Record<string, string> = { Dispatch: 'Route 7 · unchanged' };
const whileWriting: Record<string, string> = { Delivery: 'Mon 18 Nov · 2 slots' };
const statuses = ['Request received', 'Checking availability', 'Policy applied', 'Systems updated'];

type RecordRow = OrderRecord['rows'][number];
type RowState = 'held' | 'active' | 'done';

function RecordValue({ row, state }: { row: RecordRow; state: RowState }) {
  const previous = row.previous && <s className={styles.previous}>{row.previous}</s>;
  if (state === 'held') return previous || <SceneMuted>{heldBefore[row.label] ?? '—'}</SceneMuted>;
  const value = state === 'active' ? whileWriting[row.label] ?? row.value : row.value;
  return <>{previous}{previous && ' '}{value}</>;
}

/** Order record #48213 as workflow step `step` (0–4) leaves it. */
export function OrderRecordScene({ record, step }: { record: OrderRecord; step: number }) {
  const closed = step >= record.rows.length - 1;
  return <Stage width={34}>
    <Window title={record.title} meta={<span className={styles.recordMeta}>{record.reference}</span>} bodyClassName={styles.recordBody}
      footer={<>
        {closed ? <ScenePill tone="success"><Check />{record.status}</ScenePill> : <ScenePill live>{statuses[step]}</ScenePill>}
        <span className={styles.steps}>{record.rows.map((row, index) => <i key={row.label} data-on={index <= step} />)}</span>
      </>}>
      <dl className={styles.record}>
        {record.rows.map((row, index) => {
          const state: RowState = index < step ? 'done' : index === step ? 'active' : 'held';
          return <div key={row.label} data-state={state}><dt>{row.label}</dt><dd><RecordValue row={row} state={state} /></dd></div>;
        })}
      </dl>
    </Window>
  </Stage>;
}

/** What step `step` writes to the record, in words, for the step's detail: the scene itself is hidden from assistive tech. */
export function recordSummary(record: OrderRecord, step: number) {
  const row = record.rows[step];
  if (!row) return '';
  const spoken = (text: string) => text.split(' · ').join(', ').split(' → ').join(' to ');
  const value = spoken(whileWriting[row.label] ?? row.value);
  return `${record.title} ${record.reference}. ${row.label}: ${value}${row.previous ? `, was ${row.previous}` : ''}.`;
}

/* ---------- The five approach stages ---------- */

// Where time and cost go across the five steps of the process; the tallest is the one to fix first.
const timeShare = [34, 62, 48, 92, 40];
const costShare = [26, 54, 40, 84, 30];

function Columns({ values }: { values: number[] }) {
  const peak = Math.max(...values);
  return <span className={styles.columns}>{values.map((value, index) => <i key={index} data-peak={value === peak} style={{ height: `${value}%` }} />)}</span>;
}

/** Understand: the process mapped step by step, where time and cost go, and the one process agreed to start with. */
function Understand([map, metrics, scope]: string[]) {
  return <Stage>
    <Pair
      first={<Window title={map}>
        <ol className={styles.map}>{processSteps.map(step => <li key={step}><i className={styles.node} />{step}</li>)}</ol>
      </Window>}
      second={<Window title={metrics} footer={<><SceneField label={scope}>One process to start with</SceneField><span className={styles.end}><ScenePill tone="success"><Check />Agreed</ScenePill></span></>}>
        <SceneFields columns={2}>
          <SceneField label="Time"><Columns values={timeShare} /></SceneField>
          <SceneField label="Cost"><Columns values={costShare} /></SceneField>
        </SceneFields>
      </Window>} />
  </Stage>;
}

/** Design: the systems that hold the context, which decisions AI makes and which need a person, and the approval on an action. */
function Design([sources, rules, approvals]: string[]) {
  return <Stage>
    <Pair
      first={<Window title={sources}>
        <div className={styles.rows}>{systems.map(system => <SceneRow key={system} end={<SceneMuted>Mapped</SceneMuted>}>{system}</SceneRow>)}</div>
      </Window>}
      second={<Window title={rules}
        footer={<div className={styles.approval}>
          <span className={styles.label}>{approvals}</span>
          <span className={styles.approvalRow}>{action}<ScenePills><ScenePill tone="ink">{approve}</ScenePill><ScenePill>{reject}</ScenePill></ScenePills></span>
        </div>}>
        <div className={styles.rows}>
          <SceneRow end={<ScenePill tone="success">AI decides</ScenePill>}>{policy}</SceneRow>
          <SceneRow end={<ScenePill>Needs a person</ScenePill>}><Placeholder width={7} /></SceneRow>
        </div>
      </Window>} />
  </Stage>;
}

/** Build: the work in your repository, your systems connected, all of it running in your environment. */
function Build([repository, integrations, environment]: string[]) {
  return <Stage>
    <Pair
      first={<Window title={repository} meta={<code className={styles.code}>main</code>}>
        <div className={styles.rows}>
          {['integrations/', 'decision-rules/', 'evaluations/'].map((path, index) => <SceneRow key={path}>
            <span className={styles.file}><code className={styles.code}>{path}</code><Placeholder width={[6, 4.5, 5.5][index]} /></span>
          </SceneRow>)}
        </div>
      </Window>}
      second={<Window title={integrations} footer={<><i className={styles.dot} />{environment}</>}>
        <div className={styles.rows}>{systems.slice(0, 3).map(system => <SceneRow key={system} end={<ScenePill tone="success">Connected</ScenePill>}>{system}</SceneRow>)}</div>
      </Window>} />
  </Stage>;
}

/** Validate: real scenarios run as an evaluation set, read out for quality, speed and cost against the agreed targets. */
function Validate([set, quality, speedAndCost]: string[]) {
  return <Stage width={38}>
    <Window title={set} meta="Real scenarios"
      footer={<div className={styles.readouts}>
        <SceneField label={quality}><Track value={86} target={72} /></SceneField>
        <SceneField label={speedAndCost}><Track value={46} target={64} /></SceneField>
        <span className={styles.targetNote}><b className={styles.targetMark} />Agreed target</span>
      </div>}>
      <div className={styles.rows}>
        <SceneRow end={<Done />}>{request}</SceneRow>
        <SceneRow end={<Done />}><Placeholder width={11} /></SceneRow>
        <SceneRow end={<Done />}><Placeholder width={8.5} /></SceneRow>
      </div>
    </Window>
  </Stage>;
}

/** Hand over: code, evaluations and runbook handed to your team; the runbook covers running, reviewing and improving it. */
function HandOver([code, evaluations, runbook]: string[]) {
  return <Stage>
    <Pair
      first={<Window title="Handed to your team">
        <ul className={styles.checklist}>{[code, evaluations, runbook].map(item => <li key={item}><Done />{item}</li>)}</ul>
      </Window>}
      second={<Window title={runbook}>
        <div className={styles.doc}>{[['Run', 9], ['Review', 7.5], ['Improve', 8.5]].map(([heading, width]) => <div key={heading}>
          <span className={styles.docHeading}>{heading}</span>
          <Placeholder width={width as number} /><Placeholder width={(width as number) - 2.5} />
        </div>)}</div>
      </Window>} />
  </Stage>;
}

const stageScenes = [Understand, Design, Build, Validate, HandOver];

/** The scene for approach stage `index` (0–4), named with that stage's three deliverables. */
export function StageScene({ index, deliverables }: { index: number; deliverables: string[] }) {
  const Scene = stageScenes[index];
  return Scene ? Scene(deliverables) : null;
}
