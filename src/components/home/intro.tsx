import styles from './intro.module.css';

export function Intro() {
  return <section className={styles.intro} aria-labelledby='intro-heading'>
    <h2 id='intro-heading' className={`display ${styles.headline}`}>
      AtomsAI brings AI to the work that moves your business.
    </h2>
  </section>;
}
