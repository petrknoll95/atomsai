import type { ApproachSection } from './approach-content';
import { OrderRecordScene, recordSummary } from './approach-scenes';
import { ScenePanel } from './scene-panel';
import { SectionIntro } from './section-intro';
import styles from './approach-panels.module.css';

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * "A request is rarely one task": one delivery change in the homepage's step panel, in its
 * light tone, so it reads apart from the dark, numbered stages further down the page. Each of
 * the five steps sits beside order record #48213 as that step leaves it, the step's own row
 * marked. As in the prototype, the statement that sums the steps up closes the section's lead.
 */
export function ApproachWorkflow({ section }: { section: ApproachSection }) {
  const record = section.record;
  const [intro, statement] = section.intro;
  return <section id="workflow" className={`page-container ${styles.section}`} aria-labelledby="workflow-heading">
    <SectionIntro id="workflow-heading" title={section.title}
      lead={<>{intro}{statement && <>{' '}<span className={styles.statement}>{statement}</span></>}</>} />
    <ScenePanel label={section.label} tone="light"
      items={section.blocks.map((block, index) => ({
        id: slug(block.title),
        title: block.title,
        detail: <>
          <p>{block.body[0]}</p>
          {/* The scene is hidden from assistive tech; this is what the step writes to the record. */}
          {record && <p className="sr-only">{recordSummary(record, index)}</p>}
        </>,
        scene: record && <OrderRecordScene record={record} step={index} />,
      }))} />
  </section>;
}
