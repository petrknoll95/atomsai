import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import type { ApproachSection } from './approach-content';
import { StageScene } from './approach-scenes';
import { ScenePanel } from './scene-panel';
import { SectionIntro } from './section-intro';
import styles from './approach-panels.module.css';

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const number = (index: number) => String(index + 1).padStart(2, '0');
const sentence = (text: string) => /[.!?]$/.test(text) ? text : `${text}.`;

/**
 * "You see it work before you run it": the five stages as the homepage's step panel.
 * A stage opens on its outcome, then how we get there, then its three deliverables,
 * which its scene pictures as working artefacts. The panel sits under id "step-1", so
 * /approach#step-1 (the mega menu) lands on it with the first stage open.
 */
export function ApproachStages({ section }: { section: ApproachSection }) {
  const link = section.links[0];
  return <section id="approach" className={`page-container ${styles.section}`} aria-labelledby="approach-heading">
    <SectionIntro id="approach-heading" title={section.title} lead={section.intro[0]} />
    <div id="step-1">
      <ScenePanel label={section.label}
        items={section.blocks.map((block, index) => {
          const stage = block.label || block.title;
          return {
            id: slug(stage),
            label: number(index),
            title: stage,
            detail: <>
              <p className={styles.outcome}>{sentence(block.title)}</p>
              <p>{block.body[0]}</p>
              {/* Every item leads with its separator; the one that starts a line falls outside the clip. */}
              <div className={styles.deliverables}>
                <ul>{block.list.map(item => <li key={item}><span className={styles.separator} aria-hidden="true">·</span>{item}</li>)}</ul>
              </div>
            </>,
            scene: <StageScene index={index} deliverables={block.list} />,
          };
        })}
        aside={link && <ButtonLink href={link.href} size="small" variant="ghost" className={styles.asideLink}>
          {link.label}<ArrowIcon size={16} />
        </ButtonLink>} />
    </div>
  </section>;
}
