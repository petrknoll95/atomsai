import { ButtonLink } from '@/components/ui';
import styles from './integrations.module.css';
import { IntegrationsGrid } from './integrations-grid';

export function Integrations() {
  return <section id="integrations" className={`page-container ${styles.section}`} aria-labelledby="integrations-title">
    <div className={styles.stage}>
      <IntegrationsGrid />
      <div className={styles.copy}>
        <h2 id="integrations-title" className={`display ${styles.title}`}>Ready-made or custom.<br />Connected to your tools.</h2>
        <ButtonLink href="/company/contact" variant="outline">Discuss your workflow</ButtonLink>
      </div>
    </div>
    <p className="sr-only">Connect your tools, including Notion, Microsoft Teams, HubSpot, Google Drive, Shopify, Jira, Asana, Zendesk, GitHub, Airtable, Slack, Salesforce and Intercom.</p>
  </section>;
}
