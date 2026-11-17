'use client';

import { useId, useState } from 'react';
import type { ContentBlock } from './client-content';
import { ContentCard } from './content-blocks';
import styles from './content-page.module.css';

const productLabels: Record<string, string> = { justcall: 'JustCall', serviceagent: 'ServiceAgent', pyai: 'PyAI' };
const topicLabels: Record<string, string> = { results: 'Results', speed: 'Speed to lead', integrations: 'Integrations', insight: 'Insight and coaching', coverage: 'Coverage and routing' };

export function ContentCatalog({ blocks, searchable = false, searchOnly = false }: { blocks: ContentBlock[]; searchable?: boolean; searchOnly?: boolean }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState('all');
  const inputId = useId();
  const categories = Array.from(new Set(blocks.map(b => b.category).filter((value): value is string => !!value)));
  const industries = Array.from(new Set(blocks.map(b => b.industry).filter((value): value is string => !!value)));
  const topics = Array.from(new Set(blocks.flatMap(b => b.tags || [])));
  const facets = industries.length > 0 ? industries : topics;
  const shown = blocks.filter(block => (category === 'all' || block.category === category) && (facet === 'all' || (industries.length ? block.industry === facet : block.tags?.includes(facet))) &&
    [block.title, block.company, block.quote, block.attribution, ...block.body, ...block.list].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className={styles.filters}>
      {facets.length > 1 && <label className={styles.facet}>{industries.length ? 'Industry' : 'Problem'}<select value={facet} onChange={event => setFacet(event.target.value)}><option value="all">{industries.length ? 'All industries' : 'All problems'}</option>{facets.map(value => <option key={value} value={value}>{topicLabels[value] || value}</option>)}</select></label>}
      {categories.length > 1 && <div className={styles.filterPills} role="group" aria-label="Filter by product">
        {['all', ...categories].map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'all' ? 'All' : productLabels[value] || value}</button>)}
      </div>}
      {searchable && <div className={styles.search}><label htmlFor={inputId}>Search help topics</label><input id={inputId} type="search" placeholder="Search products, setup, security…" value={query} onChange={event => setQuery(event.target.value)} /></div>}
    </div>
    {(!searchOnly || query.trim()) && <><div className={styles.grid}>{shown.map((block, index) => <ContentCard key={`${block.title}-${index}`} block={block} />)}</div>
    {shown.length === 0 && <div className={styles.empty} role="status"><p>No matches. Try another {searchable ? 'search' : 'filter'}.</p>{!searchable && <button type="button" className="button button-small button-ghost" onClick={() => { setCategory('all'); setFacet('all'); }}>Clear filters</button>}</div>}
    <span className={styles.visuallyHidden} role="status">{shown.length} results</span></>}
  </>;
}

export function CodeExamples({ examples }: { examples: { label: string; code: string }[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return <div className={styles.code}>
    <div className={styles.filterPills} role="group" aria-label="Code language">{examples.map((example, index) => <button key={example.label} type="button" aria-pressed={active === index} aria-controls={id} onClick={() => setActive(index)}>{example.label}</button>)}</div>
    <pre id={id} tabIndex={0} aria-label={`${examples[active].label} example`}><code>{examples[active].code}</code></pre>
  </div>;
}
