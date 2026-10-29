import styles from './justcall-scene.module.css';

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 15v-3c4-4 10-4 14 0v3l-4-1v-2a10 10 0 0 0-6 0v2l-4 1Z" fill="currentColor" /></svg>;
}

function ChevronIcon({ direction = 'down' }: { direction?: 'down' | 'left' | 'right' }) {
  return <svg className={styles.chevron} data-direction={direction} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}

// Decorative product illustration. Its entire coordinate system inherits one em.
export function JustCallScene({ compact = false }: { compact?: boolean } = {}) {
  if (compact) return <div className={`${styles.system} ${styles.compact}`} data-justcall-system aria-hidden="true">
    <div className={styles.foreground}>
      <div className={styles.analytics}>
        <div className={styles.tabsWrapper}><div className={styles.tabs}><span>Inbound Calls</span></div></div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>AI Resolution Rate</div>
          <div className={styles.metricValue}><span className={styles.metric}>78%</span></div>
          <div className={styles.metricChange}><span>↑ 18%</span></div>
        </div>
      </div>
      <div className={styles.conversation}>
        <div className={styles.intro}><p className={styles.title}>Talk to Steven Carter</p></div>
        <div className={styles.transcript}>
          <div><p className={styles.speaker}>You:</p><p>Can we schedule the installation?</p></div>
          <div><p className={styles.speaker}>Steven Carter:</p><p>Saturday at 9 AM works.</p></div>
        </div>
        <div className={styles.callBar}><span className={`${styles.avatar} ${styles.avatarPhoto}`} /><div><p className={styles.speaker}>Steven Carter</p><p className={styles.muted}>01:16</p></div><span className={styles.hangup}><PhoneIcon /></span></div>
      </div>
    </div>
  </div>;
  return <div className={styles.system} data-justcall-system aria-hidden="true">
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}><span className={styles.title}>AI Voice Agent</span><span className={styles.live}><i /><span className={styles.dashboardLabel}>Live Calls</span></span></div>
      <div className={styles.dashboardTools}>
        <div className={styles.dashboardNav}><span><span className={styles.dashboardLabel}>Agents</span><span className={styles.agentCount}><span className={styles.dashboardLabel}>4</span></span></span><span className={styles.dashboardLabel}>Call history</span></div>
        <span className={styles.search}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m14.5 14.5 5.5 5.5" /></svg><span className={styles.dashboardLabel}>Search agents</span></span>
        <span className={styles.filter}><span className={styles.dashboardLabel}>All statuses</span><ChevronIcon /></span>
      </div>
      <div className={styles.tableHeading}><span className={styles.checkbox} /><span>Agent</span><span>Status</span><span>Calls</span><span>Language</span></div>
      {['Steven Carter', 'Olivia Bennett', 'Sophia Reed', 'Ethan Brooks'].map((name, index) => <div className={styles.agentRow} key={name}>
        <span className={styles.checkbox} /><div className={styles.agentIdentity}><span className={styles.agentAvatar}><span className={styles.dashboardLabel}>{name.split(' ').map(part => part[0]).join('')}</span></span><div><p>{name}</p><p className={styles.muted}>#agent_{['480724', '926148', '359883', '074312'][index]}…</p></div></div><span className={styles.agentStatus}><i /><span className={styles.dashboardLabel}>{index === 0 ? 'In a call' : 'Available'}</span></span><span>{[24, 18, 32, 16][index]}</span><span>English</span>
      </div>)}
      <div className={styles.dashboardFooter}><div><p>4 agents connected</p><p>Last synced just now</p></div><span className={styles.pagination}><ChevronIcon direction="left" /><span><span className={styles.dashboardLabel}>1</span></span><ChevronIcon direction="right" /></span></div>
    </div>

    <div className={styles.foreground}>
      <div className={styles.analytics}>
        <div className={styles.tabsWrapper}><div className={styles.tabs}><span>Inbound Calls</span><span>Outbound Calls</span></div></div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>AI Resolution Rate</div>
          <div className={styles.metricValue}><span className={styles.metric}>78%</span><span className={styles.muted}>(90 calls)</span></div>
          <div className={styles.metricChange}><span>↑ 18%</span><span className={styles.muted}>vs last month</span></div>
        </div>
      </div>
  
      <div className={styles.conversation}>
        <div className={styles.intro}><p className={styles.title}>Talk to Steven Carter</p><p>Receive a call on your phone or talk via web</p></div>
        <div className={styles.callTabs}><span>Web Call</span><span>Phone Call</span></div>
        <div className={styles.transcript}>
          <div><p className={styles.speaker}>You:</p><p>Hi John, can we schedule the sink installation?</p></div>
          <div><p className={styles.speaker}>Steven Carter:</p><p>Of course! Saturday at 9 AM works.</p></div>
          <div><p className={styles.speaker}>You:</p><p>Great, I’ll have everything ready.</p></div>
        </div>
        <div className={styles.callBar}><span className={`${styles.avatar} ${styles.avatarPhoto}`} /><div><p className={styles.speaker}>Steven Carter</p><p className={styles.muted}>01:16</p></div><span className={styles.hangup}><PhoneIcon /></span></div>
      </div>
    </div>
  </div>;
}
