import type { ApproachSection } from './approach-content';
import { OrderRecordScene, recordSummary } from './approach-scenes';
import { ScenePanel } from './scene-panel';
import { SectionIntro } from './section-intro';
import styles from './approach-panels.module.css';

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const number = (index: number) => String(index + 1).padStart(2, '0');

/**
 * "A request is rarely one task": one delivery change as the homepage's step panel.
 * Each of the five steps sits beside order record #48213 as that step leaves it, the
 * step's own row marked; the statement that sums them up closes the list.
 */
export function ApproachWorkflow({ section }: { section: ApproachSection }) {
  const record = section.record;
  return <section id="workflow" className={`page-container ${styles.section}`} aria-labelledby="workflow-heading">
    <SectionIntro id="workflow-heading" title={section.title} lead={section.intro[0]} />
    <ScenePanel label={section.label}
      items={section.blocks.map((block, index) => ({
        id: slug(block.title),
        label: number(index),
        title: block.title,
        detail: <>
          <p>{block.body[0]}</p>
          {/* The scene is hidden from assistive tech; this is what the step writes to the record. */}
          {record && <p className="sr-only">{recordSummary(record, index)}</p>}
        </>,
        scene: record && <OrderRecordScene record={record} step={index} />,
      }))}
      aside={section.intro[1] && <p className={styles.statement}>{section.intro[1]}</p>} />
  </section>;
}
