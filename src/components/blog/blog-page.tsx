import { BlogArt } from './blog-art';
import { BlogStories, type Story } from './blog-stories';
import { clientPages } from '@/components/pages/client-content';
import styles from './blog.module.css';

const content = clientPages.blog;
const featured = content.featured!;
const notes = content.sections.find(section => section.id === 'all')!.blocks;

/** Artwork per note; notes keep their client copy, the page only supplies imagery. */
const artwork: Record<string, string> = {
  'What a phone line does to a voice, and why it matters to your model': '/assets/field-notes/voice-signal.webp',
  'Why we stopped treating turn-taking as a timer setting': '/assets/field-notes/conversation.webp',
  '11:48 pm, no cool, and nobody at the desk': '/assets/figma/industries-BackgroundImage3-1024.webp',
  'The call is over. Is the record right?': '/assets/figma/industries-BackgroundImage2-1024.webp',
  'From an OpenAI base URL to a phone number in an afternoon': '/assets/field-notes/last-mile.webp',
  'Measuring word error rate on accented 8 kHz audio': '/assets/figma/menu-band.webp',
  'Guardrails that hold on a live call': '/assets/figma/menu-drift.webp',
  'Speed to lead, measured honestly': '/assets/figma/industries-BackgroundImage1-1024.webp',
  'Keeping your LiveKit loop and swapping in the voice': '/assets/figma/industries-BackgroundImage-1024.webp',
};

const stories: Story[] = notes
  .filter(note => note.title !== featured.title)
  .map(note => ({ title: note.title, excerpt: note.body[0], category: note.category, artwork: artwork[note.title] ?? '/assets/field-notes/voice-signal.webp' }));
const featuredCategory = notes.find(note => note.title === featured.title)?.category;

export function BlogPage() {
  return <main className={`page-container ${styles.page}`} id="main">
    <header className={styles.intro}>
      <h1 className={`display ${styles.heading}`} id="hero-heading">{content.title}</h1>
      <p className={styles.description}>{content.intro[0]}</p>
    </header>

    <article className={styles.featured} aria-labelledby="featured-title">
      <div className={styles.featuredCopy}>
        <p className={styles.eyebrowText}>Featured</p>
        <div className={styles.featuredText}>
          {featuredCategory && <p className={styles.meta}>{featuredCategory}</p>}
          <h2 className={`display ${styles.featuredTitle}`} id="featured-title">{featured.title}</h2>
          <p className={styles.excerpt}>{featured.body[0]}</p>
        </div>
      </div>
      <div className={styles.featuredImage}><BlogArt artwork="/assets/figma/hero-atoms-fallback.webp" priority sizes="(max-width: 767px) 100vw, 66vw" /></div>
    </article>

    <BlogStories stories={stories} />
  </main>;
}
