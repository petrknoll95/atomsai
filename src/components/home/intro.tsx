import styles from './intro.module.css';

export function Intro() {
  return <section className={`page-container ${styles.intro}`} aria-labelledby='intro-heading'>
    <p className={styles.eyebrow}>AtomsAI operating model</p>
    <h2 id='intro-heading' className={`display ${styles.headline}`}>
      The problem decides the pieces
    </h2>
    <p className={styles.description}>Your goals set the brief. AtomsAI builds what fits, whether that’s a product, a custom model, or a person in the loop.</p>
  </section>;
}
