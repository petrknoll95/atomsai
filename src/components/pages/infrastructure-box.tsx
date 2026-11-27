import type { ReactNode } from 'react';
import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { Pattern } from '@/components/patterns/pattern';
import { FeatureTabs } from './feature-tabs';
import { LineIcon, type LineIconName } from './infrastructure-icons';
import type { InfrastructureSection } from './infrastructure-page';
import styles from './infrastructure.module.css';

const outbound = { target: '_blank', rel: 'noopener noreferrer' } as const;
const isOutbound = (href: string) => /^https?:\/\//.test(href);
const boxIcons: LineIconName[] = ['telephony', 'hear', 'omni', 'speak', 'recap', 'trace'];
const HeaderZone = () => <span className={styles.headerZone} data-header-theme="dark" aria-hidden="true" />;

function TextLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  const external = isOutbound(href);
  return <ButtonLink href={href} size="small" variant="ghost" className={`${styles.inlineLink} ${className}`} {...(external ? outbound : {})}>
    {children}<ArrowIcon direction={external ? 'up-right' : 'right'} size={16} />
  </ButtonLink>;
}

function SectionHead({ id, label, title, intro, action }: { id: string; label: string; title: ReactNode; intro?: string; action?: ReactNode }) {
  return <header className={styles.sectionHead}>
    <p className={styles.kicker}>{label}</p>
    <h2 className={`display ${styles.sectionTitle}`} id={`${id}-heading`}>{title}</h2>
    {(intro || action) && <div className={styles.sectionAside}>{intro && <p>{intro}</p>}{action}</div>}
  </header>;
}

/** What's in the box: the six APIs, one selected at a time. */
export function InfrastructureBox({ section }: { section: InfrastructureSection }) {
  const more = section.more!;
  return <>
    <section id="box" className={`page-container ${styles.box}`} aria-labelledby="box-heading">
      <SectionHead id="box" label={section.label} title={section.title} intro={section.intro[0]}
        action={<TextLink href={section.links[0].href}>{section.links[0].label}</TextLink>} />
      <div className={styles.boxTabsFrame}>
        <div className={styles.boxPattern} aria-hidden="true">
          <Pattern kind="drift" count={16} mode="dark" fit="stretch" loading="lazy" label="" />
        </div>
        <FeatureTabs label={section.label} className={styles.boxTabs} stageClassName={`theme-dark ${styles.boxStage}`} stageProps={{ 'data-header-backdrop': '' }}
          items={section.blocks.map((block, index) => ({
            id: boxIcons[index], title: block.title, meta: block.label,
            panel: <div className={styles.boxPanel} data-theme="dark" data-header-theme="light">
              <HeaderZone />
              <LineIcon name={boxIcons[index]} className={styles.boxIcon} />
              <div className={styles.boxCopy}>
                <p className={styles.boxMeta}>{block.label}</p>
                <h3 className={`display ${styles.boxTitle}`}>{block.title}</h3>
                <p className={styles.boxBody}>{block.body[0]}</p>
                <p className={styles.boxUse}><ArrowIcon size={12} />{block.body[1]}</p>
                <TextLink href={block.links[0].href} className={styles.boxDocs}>{block.links[0].label}</TextLink>
              </div>
            </div>,
          }))} />
      </div>
      <p className={styles.boxMore}>
        <b>{more.lead}</b>{' '}
        {more.parts.map((part, index) => 'href' in part && part.href
          ? <a key={index} className={styles.textLink} href={part.href} {...outbound}>{part.label}<ArrowIcon direction="up-right" size={12} /></a>
          : <span key={index}>{part.text}</span>)}{' '}
        <a className={styles.textLink} href={more.link.href} {...outbound}>{more.link.label}<ArrowIcon direction="up-right" size={12} /></a>
      </p>
    </section>
  </>;
}
