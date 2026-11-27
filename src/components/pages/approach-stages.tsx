import { SectionIntro } from './section-intro';
import type { ApproachSection } from './approach-content';

/** "You see it work before you run it": the five stages. Placeholder until the redesign lands. */
export function ApproachStages({ section }: { section: ApproachSection }) {
  return <section id="approach" className="page-container" aria-labelledby="approach-heading">
    <SectionIntro id="approach-heading" title={section.title} lead={section.intro[0]} />
    <ol id="step-1">{section.blocks.map(block => <li key={block.title}>{block.label}: {block.title}</li>)}</ol>
  </section>;
}
