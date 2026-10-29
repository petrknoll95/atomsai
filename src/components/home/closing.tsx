import { ButtonLink } from "../ui";
import { HomePattern } from "@/components/patterns/home-pattern";
import { SiteFooter } from "./site-footer";
import styles from "./lower.module.css";
export { SiteFooter } from "./site-footer";

const contactUrl = "/company/contact";

export function Closing() {
  return (
    <div data-theme="dark">
      <section className={`page-container ${styles.cta}`} aria-labelledby="closing-heading">
        <div className={styles.ctaPanel}>
          <h2 className={`display ${styles.ctaHeading}`} id="closing-heading">
            <span>Your competitors<br />are automating.</span>
            <span>Are you?</span>
          </h2>
          <div className={styles.ctaArtworkWrap}>
            <div className={styles.ctaArtwork}>
              <HomePattern application="cta-pattern" className={styles.ctaPattern} />
              <ButtonLink href={contactUrl} size="large" className={styles.ctaButton}>Find your starting point</ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

