import styles from './helpwise-scene.module.css';

type IconName = 'mail' | 'chat' | 'search' | 'star' | 'chevron' | 'refresh' | 'filter' | 'bell' | 'plus' | 'inbox';
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
    chat: 'M3 4h18v13H9l-6 4z', search: 'm15 15 5 5',
    star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
    chevron: 'm7 10 5 5 5-5', refresh: 'M20 8a8 8 0 1 0 0 8 M20 3v5h-5',
    filter: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
    bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4', plus: 'M12 5v14 M5 12h14',
    inbox: 'M4 4h16v16H4z M4 14h5l1 3h4l1-3h5',
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === 'search' && <circle cx="10" cy="10" r="6" />}<path d={paths[name]} /></svg>;
}

const messages = [
  { name: 'Raul Reynolds', subject: 'Where are my shoes?!', preview: 'This is taking forever.', tag: 'Shipping delay', time: '06:13', chat: true },
  { name: 'Tyrone Quill', subject: 'My recent shoe order', preview: 'I am unhappy with the condition of my order.', time: '06:12' },
  { name: 'Katherine Anderson', subject: 'You sent the wrong size!', preview: 'Could you help with an exchange?', time: '06:12' },
  { name: 'Emmanuel Garrea', subject: 'Checking on my delivery', preview: 'Can you share an update?', time: '06:10', chat: true },
  { name: 'Ethan McCormick', subject: 'Help with my order', preview: 'I would appreciate a resolution.', time: '06:08' },
  { name: 'Indiana Krimpel', subject: 'An issue with my shoes', preview: 'Something went wrong with my order.', time: '06:06' },
  { name: 'Lei Yang', subject: 'Quality of shoes received', preview: 'Order #35 — could you take a look?', time: '06:01' },
  { name: 'Joe Bond', subject: 'Loving my new kicks!', preview: 'Thanks for all your help.', tag: 'Feedback', time: '06:00', chat: true },
  { name: 'Robert Brownie JR', subject: 'Accidentally ordered the wrong size', preview: 'I need assistance with an exchange.', time: '05:53' },
  { name: 'Tom Bready', subject: 'Requesting a return and refund', preview: 'Damaged shoes — order #235.', time: '05:51' },
];

export function HelpwiseScene({ compact = false }: { compact?: boolean } = {}) {
  if (compact) return <div className={`${styles.system} ${styles.compact}`} data-helpwise-system aria-hidden="true">
    <div className={styles.header}><div className={styles.brand}><span className={styles.mark} /><span>Helpwise</span></div><span className={styles.avatar} /></div>
    <div className={styles.body}>
      <div className={styles.sidebar}>
        <div className={styles.compose}><Icon name="plus" /><span>Compose</span></div>
        <div className={styles.sideHeading}>Inboxes</div>
        {['Mine', 'All', 'Assigned'].map(label => <div className={styles.sideItem} data-selected={label === 'All'} key={label}><Icon name="inbox" /><span>{label}</span></div>)}
      </div>
      <div className={styles.inbox}>
        <div className={styles.tabs}><span data-active="true">Open</span><span>Closed</span></div>
        {messages.slice(0, 4).map(message => <div className={styles.message} key={message.name}>
          <div className={styles.messageCopy}><span className={styles.sender}>{message.name}</span><span className={styles.compactSubject}>{message.subject}</span></div><span className={styles.time}>{message.time}</span>
        </div>)}
      </div>
    </div>
  </div>;
  return <div className={styles.system} data-helpwise-system aria-hidden="true">
    <div className={styles.header}>
      <div className={styles.brand}><span className={styles.mark} /><span>Helpwise</span></div>
      <div className={styles.navigation}>{['Inboxes', 'Interact', 'Manage', 'Automation'].map(label => <span key={label}><span>{label}</span><Icon name="chevron" /></span>)}<span><span>Reports</span></span></div>
      <Icon name="bell" /><span className={styles.avatar} />
    </div>
    <div className={styles.body}>
      <div className={styles.sidebar}>
        <div className={styles.compose}><Icon name="plus" /><span>Compose</span></div>
        <div className={styles.sideHeading}><span>Me</span><Icon name="plus" /></div>
        {(['Mine', 'Mentions', 'All', 'Assigned', 'Unassigned', 'Starred', 'Spam', 'Trash'] as const).map((label, index) => <div className={styles.sideItem} data-selected={label === 'All'} key={label}><Icon name={label === 'Starred' ? 'star' : 'inbox'} /><span>{label}</span><span className={styles.count}>{['1', '25', '99+', '42', '10', '1', '', ''][index]}</span></div>)}
        <div className={styles.sideHeading}>Inboxes</div>
        {['Personal Email', 'Support Email', 'Live Chat', 'Facebook', 'SMS & Voice'].map((label, index) => <div className={styles.sideItem} key={label}><Icon name={index < 2 ? 'mail' : 'chat'} /><span>{label}</span><span className={styles.count}>{[13, 24, 32, 9, 2][index]}</span></div>)}
        <div className={styles.sideHeading}>Tags</div><div className={styles.tagSearch}><Icon name="search" /><span>Search tags</span></div>
      </div>
      <div className={styles.inbox}>
        <div className={styles.searchRow}><div className={styles.search}><Icon name="search" /><span>Search conversations</span><Icon name="filter" /></div></div>
        <div className={styles.tabs}>{['Open', 'Closed', 'Snoozed', 'Sent'].map(label => <span key={label} data-active={label === 'Open'}>{label}</span>)}</div>
        <div className={styles.toolbar}><span className={styles.checkbox} /><Icon name="refresh" /><span className={styles.range}>1 – 100</span><span>All</span><Icon name="chevron" /><span>Newest</span><Icon name="chevron" /></div>
        <div className={styles.messages}>{messages.map(message => <div className={styles.message} key={message.name}>
          <span className={styles.checkbox} /><Icon name="star" /><Icon name={message.chat ? 'chat' : 'mail'} />
          <span className={styles.sender}>{message.name}</span>
          <div className={styles.subject}>{message.tag && <span className={styles.tag}>{message.tag}</span>}<span>{message.subject}</span><span className={styles.preview}>{message.preview}</span></div>
          <span className={styles.time}>{message.time}</span>
        </div>)}</div>
        <div className={styles.footer}><span>All conversations in one place</span><span>10 conversations</span></div>
      </div>
    </div>
  </div>;
}
