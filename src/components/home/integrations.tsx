import { Eyebrow } from '@/components/ui';
import styles from './integrations.module.css';
import { IntegrationsGrid } from './integrations-grid';

export function Integrations() {
  return <section id="integrations" className={`page-container ${styles.section}`} aria-labelledby="integrations-title">
    <div className={styles.stage}>
      <IntegrationsGrid />
      <div className={styles.copy}>
        <h2 id="integrations-title" className={`display ${styles.title}`}>Ready-made or custom.<br />Fits your workflow.</h2>
        <Eyebrow href="/company/contact">Discuss your workflow</Eyebrow>
      </div>
    </div>
    <p className="sr-only">Connect your tools, including Notion, Microsoft Teams, HubSpot, Google Drive, Shopify, Jira, Asana, Zendesk, GitHub, Airtable, Slack, Salesforce and Intercom.</p>
  </section>;
}
