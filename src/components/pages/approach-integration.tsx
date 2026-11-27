import { SceneCanvas, ScenePill, ScenePills } from './scene-kit';
import { SectionIntro } from './section-intro';
import type { ApproachSection, DiagramColumn } from './approach-content';
import styles from './approach-integration.module.css';

/** The two clauses of a two-tone headline: up to and including the first full stop, then the rest. */
function splitAtStop(text: string): [string, string] {
  const stop = text.indexOf('. ');
  return stop < 0 ? [text, ''] : [text.slice(0, stop + 1), text.slice(stop + 2)];
}

/**
 * Fan of hairlines between a column and its neighbour, drawn in a 100×100 box that stretches
 * with the row: every curve starts at one height and ends at another, both in percent.
 */
function Fan({ from, to, className }: { from: number[]; to: number[]; className: string }) {
  const pairs = from.length > to.length ? from.map(y => [y, to[0]]) : to.map(y => [from[0], y]);
  return <svg className={`${styles.fan} ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    {pairs.map(([start, end]) => <path key={`${start}-${end}`} d={`M0 ${start} C55 ${start} 45 ${end} 100 ${end}`} vectorEffect="non-scaling-stroke" />)}
  </svg>;
}

/** The record chips' tick: the work is done, the record is written. */
const Tick = () => <svg className={styles.tick} viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>;

/**
 * "Keep your tools. Connect the work": the prototype's four-stage path, your systems into AI and
 * its rules, out to an action someone approves, and on to the records it updates. One pale scene,
 * left to right on wide screens and top to bottom on phones. The drawing is a picture; the
 * ordered list beside it says the same for screen readers.
 */
export function ApproachIntegration({ section }: { section: ApproachSection }) {
  const [claim, turn] = splitAtStop(section.title);
  const diagram = section.diagram;
  if (!diagram || diagram.length !== 4) throw new Error('ai-services.json: integration needs a four-column diagram');
  const [systems, brain, action, records] = diagram as [DiagramColumn, DiagramColumn, DiagramColumn, DiagramColumn];
  const [ai, ...rules] = brain.items;
  const [task, approve, reject] = action.items;
  const rows = systems.items.map((_, index) => (index + .5) * 100 / systems.items.length);
  const outcomes = records.items.map((_, index) => (index + .5) * 100 / records.items.length);

  return <section id={section.id} className={`page-container ${styles.integration}`} aria-labelledby="integration-heading">
    <SectionIntro id="integration-heading" title={claim} muted={turn} lead={section.intro[0]} />

    <div className={styles.frame}>
      <ol className="sr-only">
        {diagram.map(column => <li key={column.label}>{column.label}: {column.items.join(', ')}</li>)}
      </ol>
      {/* A width past any frame: the canvas fills the column and brings the scene palette. */}
      <SceneCanvas width={200} className={styles.canvas}>
        <div className={styles.diagram} aria-hidden="true">
          <p className={styles.caption} data-stage="1">{systems.label}</p>
          <div className={styles.systems}>{systems.items.map(item => <span key={item}>{item}</span>)}</div>
          <Fan from={rows} to={[50]} className={styles.link1} />
          <span className={styles.drop} data-stage="1" />

          <p className={styles.caption} data-stage="2">{brain.label}</p>
          <div className={styles.brain}>
            <span className={styles.brainName}>{ai}</span>
            <span className={styles.brainRules}>{rules.map(rule => <span key={rule}>{rule}</span>)}</span>
          </div>
          <span className={`${styles.straight} ${styles.link2}`} />
          <span className={styles.drop} data-stage="2" />

          <p className={styles.caption} data-stage="3">{action.label}</p>
          <div className={styles.action}>
            <span className={styles.actionLabel}>Action</span>
            <span className={styles.actionName}>{task}</span>
            <ScenePills><ScenePill tone="ink">{approve}</ScenePill><ScenePill>{reject}</ScenePill></ScenePills>
          </div>
          <Fan from={[50]} to={outcomes} className={styles.link3} />
          <span className={styles.drop} data-stage="3" />

          <p className={styles.caption} data-stage="4">{records.label}</p>
          <div className={styles.records}>{records.items.map(item => <span key={item}><Tick />{item}</span>)}</div>

          <span className={styles.rule} />
        </div>
      </SceneCanvas>
    </div>
  </section>;
}
