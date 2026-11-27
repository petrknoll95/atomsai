import { ArrowIcon } from '@/components/arrow-icon';
import { ButtonLink } from '@/components/ui';
import { withBasePath } from '@/lib/base-path';
import type { ContentBlock, ContentLink } from './client-content';
import styles from './content-page.module.css';

export function ContentLinks({ links, buttons = false }: { links: ContentLink[]; buttons?: boolean }) {
  if (!links.length) return null;
  return <div className={buttons ? styles.actions : styles.links}>{links.map((link, index) => buttons
    ? <ButtonLink key={`${link.href}-${index}`} href={link.href} variant={index === 0 ? 'primary' : 'ghost'}>{link.label}<ArrowIcon direction="right" size={18} /></ButtonLink>
    : <a key={`${link.href}-${index}`} href={withBasePath(link.href)} className={styles.textLink}><span>{link.label}</span><ArrowIcon direction="right" size={18} /></a>)}</div>;
}

export function ContentCard({ block }: { block: ContentBlock }) {
  return <article className={styles.card}>
    {(block.company || block.label) && <p className={styles.cardLabel}>{block.company || block.label}</p>}
    {block.metric && <p className={`display ${styles.metric}`}>{block.metric}</p>}
    {block.title && <h3 className={`display ${styles.cardTitle}`}>{block.title}</h3>}
    {block.quote && <blockquote className={styles.quote}>{block.quote}</blockquote>}
    {block.body.map((text, i) => <p className={styles.body} key={i}>{text}</p>)}
    {!!block.list.length && <ul className={styles.bullets}>{block.list.map(item => <li key={item}>{item}</li>)}</ul>}
    {block.attribution && <p className={styles.attribution}>{block.attribution}</p>}
    <ContentLinks links={block.links} />
  </article>;
}

export function ContentRow({ block }: { block: ContentBlock }) {
  return <article className={styles.row}>
    <div>{block.label && <p className={styles.cardLabel}>{block.label}</p>}<h3 className={`display ${styles.cardTitle}`}>{block.title}</h3></div>
    <div>{block.body.map((text, i) => <p className={styles.body} key={i}>{text}</p>)}
      {!!block.list.length && <ul className={styles.bullets}>{block.list.map(item => <li key={item}>{item}</li>)}</ul>}
      {block.quote && <blockquote className={styles.rowQuote}>{block.quote}</blockquote>}
      {block.attribution && <p className={styles.attribution}>{block.attribution}</p>}
      {block.metric && <p className={styles.result}>{block.metric}</p>}
      <ContentLinks links={block.links} />
    </div>
  </article>;
}
