import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { BoxScene, boxScenes } from './infrastructure-box-scenes';
import type { InfrastructureSection } from './infrastructure-page';
import { ScenePanel } from './scene-panel';
import { SectionIntro } from './section-intro';
import styles from './infrastructure-box.module.css';

const outbound = { target: '_blank', rel: 'noopener noreferrer' } as const;
const isOutbound = (href: string) => /^https?:\/\//.test(href);
const linkProps = (href: string) => (isOutbound(href) ? outbound : {});

/** "Telephony · AMD" → "Telephony"; "Trace · Beta" → "Trace", marked as in beta. */
function product(label: string) {
  const [name, ...rest] = label.split('·').map(part => part.trim());
  return { name, beta: rest.some(part => part.toLowerCase() === 'beta') };
}

/** What's in the box: the six APIs as the homepage's selector panel, each with a scene of what it returns. */
export function InfrastructureBox({ section }: { section: InfrastructureSection }) {
  const more = section.more!;
  const explore = section.links[0];
  return <section id="box" className={`page-container ${styles.box}`} aria-labelledby="box-heading">
    <SectionIntro id="box-heading" title={section.title} lead={section.intro[0]}
      action={<ButtonLink href={explore.href} size="small" variant="secondary" className={styles.action} {...linkProps(explore.href)}>
        {explore.label}<ArrowIcon direction={isOutbound(explore.href) ? 'up-right' : 'right'} size={16} />
      </ButtonLink>} />
    <ScenePanel label={section.label} className={styles.panel}
      items={section.blocks.map((block, index) => {
        const { name, beta } = product(block.label ?? '');
        const docs = block.links[0];
        return {
          id: boxScenes[index] ?? `api-${index}`,
          // The API's name, as the homepage panel names its products: "Telephony · AMD" … "Trace · Beta".
          label: block.label,
          title: block.title,
          detail: <>
            <p>{block.body[0]}</p>
            <p className={styles.use}><ArrowIcon size={14} className={styles.useArrow} />{block.body[1]}</p>
            <ButtonLink href={docs.href} size="small" variant="ghost" className={styles.docs} {...linkProps(docs.href)}>
              {docs.label}<ArrowIcon direction={isOutbound(docs.href) ? 'up-right' : 'right'} size={16} />
            </ButtonLink>
          </>,
          scene: <BoxScene kind={boxScenes[index]} name={name} beta={beta} />,
        };
      })} />
    <p className={styles.more}>
      <span className={styles.moreLead}>{more.lead}</span>{' '}
      {more.parts.map((part, index) => part.href
        ? <a key={index} className={styles.textLink} href={part.href} {...linkProps(part.href)}>{part.label}<ArrowIcon direction={isOutbound(part.href) ? 'up-right' : 'right'} size={12} /></a>
        : <span key={index}>{part.text}</span>)}{' '}
      <a className={styles.textLink} href={more.link.href} {...linkProps(more.link.href)}>{more.link.label}<ArrowIcon direction={isOutbound(more.link.href) ? 'up-right' : 'right'} size={12} /></a>
    </p>
  </section>;
}
