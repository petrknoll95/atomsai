import { SectionIntro } from './section-intro';
import type { ApproachSection } from './approach-content';

/** "A request is rarely one task": the five steps of one delivery change. Placeholder until the redesign lands. */
export function ApproachWorkflow({ section }: { section: ApproachSection }) {
  return <section id="workflow" className="page-container" aria-labelledby="workflow-heading">
    <SectionIntro id="workflow-heading" title={section.title} lead={section.intro[0]} />
    <ol>{section.blocks.map(block => <li key={block.title}>{block.title}: {block.body[0]}</li>)}</ol>
  </section>;
}
