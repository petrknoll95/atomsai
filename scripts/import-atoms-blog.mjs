import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://atomsai.com';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${origin}/resources/blog`, { waitUntil: 'domcontentloaded' });
  const listings = await page.locator('main article').evaluateAll(cards => cards.map(card => {
    const link = card.querySelector('h2 a');
    return {
      slug: link.getAttribute('href').split('/').pop(),
      title: link.textContent.trim(),
      excerpt: card.querySelector('p').textContent.trim(),
      date: card.querySelector('time').getAttribute('datetime'),
      author: card.querySelector('ul').parentElement.querySelector('span').textContent.trim(),
      tags: [...card.querySelectorAll('li')].map(e => e.textContent.trim()),
      readingTime: card.querySelector('time').parentElement.textContent.match(/\d+ min read/)[0],
      sourceUrl: link.href,
    };
  }));
  if (!listings.length) throw new Error('No source articles found.');
  await mkdir(`${root}public/assets/blog`, { recursive: true });
  await mkdir(`${root}src/content/blog`, { recursive: true });
  const bodies = {};
  const manifest = [];
  for (const post of listings) {
    await page.goto(post.sourceUrl, { waitUntil: 'domcontentloaded' });
    const article = await page.locator('article.prose').evaluate((source, slugs) => {
      const tags = new Set(['P','H2','H3','H4','UL','OL','LI','STRONG','EM','B','I','A','BLOCKQUOTE','TABLE','THEAD','TBODY','TR','TH','TD','CAPTION','PRE','CODE','BR','HR','SUP','SUB']);
      const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
      const localRoutes = new Set(['/approach','/capabilities/voice','/industries/healthcare','/trust','/company/contact','/blog']);
      function render(node) {
        if (node.nodeType === Node.TEXT_NODE) return escape(node.textContent);
        if (node.nodeType !== Node.ELEMENT_NODE || node.hidden || ['SCRIPT','STYLE','IFRAME'].includes(node.tagName)) return '';
        const children = [...node.childNodes].map(render).join('');
        if (!tags.has(node.tagName)) return children;
        const tag = node.tagName.toLowerCase();
        let attrs = '';
        if (node.id) attrs += ` id="${escape(node.id)}"`;
        if (/^H[234]$/.test(node.tagName)) attrs += ' class="display"';
        if (tag === 'a') {
          const raw = node.getAttribute('href') || '';
          const url = new URL(raw, location.href);
          if (['https:','http:','mailto:','tel:'].includes(url.protocol)) {
            let href = url.href;
            if (url.origin === location.origin) {
              const slug = url.pathname.split('/').pop();
              if (url.pathname === '/resources/blog') href = '/blog' + url.hash;
              else if (url.pathname.startsWith('/resources/blog/') && slugs.includes(slug)) href = '/blog/' + slug + url.hash;
              else if (localRoutes.has(url.pathname)) href = url.pathname + url.search + url.hash;
              if (raw.startsWith('#')) href = raw;
            }
            attrs += ` href="${escape(href)}"`;
          }
        }
        if (['th','td'].includes(tag)) {
          for (const name of ['colspan','rowspan']) if (/^\d+$/.test(node.getAttribute(name) || '')) attrs += ` ${name}="${node.getAttribute(name)}"`;
          if (tag === 'th') attrs += ' scope="col"';
        }
        const html = ['br','hr'].includes(tag) ? `<${tag}${attrs}>` : `<${tag}${attrs}>${children}</${tag}>`;
        return tag === 'table' ? `<div class="article-table-scroll" tabindex="0" role="region" aria-label="Article table">${html}</div>` : html;
      }
      const image = document.querySelector('main header img');
      return {
        html: [...source.childNodes].map(render).join('').trim(),
        text: source.textContent.trim(),
        artworkUrl: image.src,
        artworkAlt: image.alt,
        paragraphs: [...source.querySelectorAll('p')].map(p => p.textContent),
      };
    }, listings.map(post => post.slug));
    if (article.text.length < 500) throw new Error(`Incomplete body: ${post.slug}`);
    const response = await fetch(article.artworkUrl);
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Artwork failed: ${post.slug}`);
    const artwork = `/assets/blog/${post.slug}.webp`;
    await writeFile(`${root}public${artwork}`, Buffer.from(await response.arrayBuffer()));
    bodies[post.slug] = article.html;
    manifest.push({ ...post, category: ['the-demo-was-never-the-hard-part','write-the-evals-before-the-prompt','how-much-autonomy-should-an-agent-have'].includes(post.slug) ? 'Technical' : 'Insights', artwork, artworkAlt: article.artworkAlt });
    console.log(`${post.slug}: ${article.text.length} characters; artwork saved`);
    if (post.slug === 'write-the-evals-before-the-prompt') console.log('Quote options:', article.paragraphs.slice(0,2));
  }
  await writeFile(`${root}src/content/blog/posts.json`, JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(`${root}src/content/blog/bodies.json`, JSON.stringify(bodies, null, 2) + '\n');
  await writeFile(`${root}src/content/blog/README.md`, `# AtomsAI blog content\n\nImported from https://atomsai.com/resources/blog on ${new Date().toISOString().slice(0,10)}.\n\nThe seven source articles retain their titles, summaries, dates, authors, tags, full article bodies, and original cover artwork. Artwork is stored locally in public/assets/blog. Source URLs are recorded in posts.json.\n\nInsights and Technical are local browsing categories assigned to the existing articles; the source uses topic tags. The source marks the three older editorial notes as draft content in hidden metadata; this import follows the publicly visible content without changing its publication dates.\n\nRun node scripts/import-atoms-blog.mjs to refresh. The importer allowlists article markup, removes scripts and source styling, rewrites migrated article links to /blog, and leaves unmigrated destinations on atomsai.com.\n`);
} finally { await browser.close(); }
