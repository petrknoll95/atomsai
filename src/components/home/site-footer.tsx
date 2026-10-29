import { siteHref } from "@/lib/site-links";
import { ButtonLink } from "../ui";
import styles from "./lower.module.css";

const contactUrl = "/company/contact";
type FooterLink = { label: string; path?: string };
type FooterGroup = { title: string; links: FooterLink[] };

// Completed redesign routes stay local; remaining pages retain live destinations.
const navigation: FooterGroup[][] = [
  [
    { title: "Explore", links: [
      { label: "Applications", path: "#applications" },
      { label: "Infrastructure", path: "https://pyai.com/" },
      { label: "AI Services", path: "/approach" },
    ] },
    { title: "Capabilities", links: [
      { label: "Voice", path: "/capabilities/voice" },
      { label: "Chat", path: "/capabilities/chat" },
      { label: "Custom agents", path: "/agents" },
    ] },
    { title: "Industries", links: [
      { label: "Healthcare", path: "/industries/healthcare" },
      { label: "Insurance", path: "/industries/insurance" },
      { label: "Credit & lending", path: "/industries/lending" },
      { label: "Logistics", path: "/industries/logistics" },
      { label: "Retail & commerce", path: "/industries/retail" },
      { label: "Manufacturing", path: "/industries/manufacturing" },
    ] },
  ],
  [
    { title: "Resources", links: [
      { label: "Blog", path: "/resources/blog" },
      { label: "Customer stories", path: "/resources/case-studies" },
      { label: "Help center", path: "#faq" },
      { label: "Website updates", path: "/changelog" },
    ] },
    { title: "Company", links: [
      { label: "About AtomsAI", path: "/company/about" },
      { label: "How we work", path: "/approach" },
      { label: "Careers", path: "/company/careers" },
      { label: "Contact", path: "/company/contact" },
    ] },
    { title: "Legal", links: [
      { label: "Terms of Service", path: "/legal/terms" },
      { label: "Privacy Policy", path: "/legal/privacy" },
      { label: "Cookie Preferences" },
    ] },
  ],
];

const logoInsets = [
  "11.21% 60.66% 11.2% 24.74%", "19.46% 54.47% 9.73% 38.58%",
  "33.01% 43.7% 9.73% 45.87%", "33.01% 26.85% 11.2% 57.31%",
  "33.01% 16.79% 9.73% 74.16%", "11.21% 2.93% 11.2% 83.3%",
  "11.21% 0.01% 11.2% 98.04%", "0.1% 80% 0.1% 0",
];

export function SiteFooter() {
  return (
    <div data-theme="dark">
      <footer className={`page-container ${styles.footer}`}>
        <div className={styles.footerTop}>
          <div className={styles.footerIntro}>
            <div className={styles.footerPitch}>
              <p className={`display ${styles.footerHeading}`}>Powerful AI.<br />Built for real use.</p>
              <ButtonLink href={contactUrl}>Find your starting point</ButtonLink>
            </div>
            <div className={styles.footerLegal} id="trust-center">
              <div className={styles.badges} aria-label="Trust and compliance topics">
                {["SOC 2", "HIPAA", "GDPR"].map((badge) => <a className={`display ${styles.badge}`} key={badge} href="/trust#scope" aria-label={`${badge === "SOC 2" ? "SOC 2 Type II" : badge} — review scope and documentation`}>{badge}</a>)}
              </div>
              <p>© 2026 AtomsAI, a brand of SaaS Labs US, Inc.</p>
            </div>
          </div>
          <nav className={styles.footerNav} aria-label="Footer">
            {navigation.map((column, index) => (
              <div className={styles.navColumn} key={index}>
                {column.map(({ title, links }) => (
                  <div className={styles.navGroup} key={title}>
                    <h2>{title}</h2>
                    <ul>
                      {links.map(({ label, path }) => (
                        <li key={label}>
                          {path ? (
                            <a href={siteHref(path)}>
                              <span className="display">{label}</span>
                            </a>
                          ) : <span className={styles.unavailableLink} aria-disabled="true" title="This page does not use optional cookies"><span className="display">{label}</span></span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <a href="#top" aria-label="AtomsAI — back to top" className={styles.footerLogo}>
          <span className={styles.logoArtwork} aria-hidden="true">
            {logoInsets.map((inset, index) => (
              <span key={index} style={{ inset }}>
                <img src={`/assets/figma/footer-Vector${index || ""}.svg`} alt="" />
              </span>
            ))}
          </span>
        </a>
      </footer>
    </div>
  );
}
