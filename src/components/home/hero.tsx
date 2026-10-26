'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui';
import { DesktopDropdown } from './desktop-dropdown';
import { FullscreenMenu } from './fullscreen-menu';
import styles from './hero.module.css';

const products = [
  { name: 'JustCall', href: 'https://justcall.io/', description: 'Calls, messages and AI for sales and support.' },
  { name: 'Helpwise', href: 'https://helpwise.io/', description: 'One shared inbox for customer conversations.' },
  { name: 'ServiceAgent', href: 'https://serviceagent.ai/', description: 'AI for calls, bookings and home-service admin.' },
  { name: 'CallPage', href: 'https://www.callpage.io/', description: 'Turn website visits into callbacks and meetings.' },
] as const;
type Product = typeof products[number]['name'];
const links = [
  { label: 'Applications', href: '#applications', children: products.map(({ name, href }) => [name, href]) },
  { label: 'Infrastructure', href: 'https://pyai.com/', children: [['Explore PyAI', 'https://pyai.com/'], ['Try the playground', 'https://pyai.com/playground']] },
  { label: 'AI Services', href: '#offerings' },
  { label: 'Industries', href: '#industries', children: [['Insurance', 'https://atomsai.com/industries/insurance'], ['Healthcare', 'https://atomsai.com/industries/healthcare'], ['Logistics', 'https://atomsai.com/industries/logistics']] },
  { label: 'Company', href: 'https://atomsai.com/company/about' },
];

function PreviewIcon({ asset, size = 16 }: { asset: string; size?: number }) {
  return <img src={`/assets/figma/header-${asset}.svg`} width={size} height={size} alt='' style={{ width: size, height: size, flexShrink: 0 }} />;
}

// Figma calls these miniature interfaces illustrative. They contain no inputs or buttons.
function ServiceAgentPreview() {
  return <div className={styles.bookingFlow}>
    <div className={styles.customerBubble}>I need help with a leaking tap.</div>
    <div className={styles.confirmationBubble}>You’re booked for tomorrow at 10.</div>
    <div className={styles.bookingCard}>
      <div className={styles.appointment}>
        <div className={styles.calendarIcon}><PreviewIcon asset='base-IconArtwork2' size={24} /></div>
        <div className={styles.appointmentCopy}><p>Plumbing visit</p><p className={styles.microMuted}>Tomorrow · 10:00–11:00</p></div>
      </div>
      <div className={styles.microDivider} />
      <div className={styles.bookingResult}><span className={styles.bookingBadge}><PreviewIcon asset='base-IconCheck' size={13.125} />Booking confirmed</span><span>Added to calendar</span></div>
    </div>
  </div>;
}

function JustCallPreview() {
  return <div className={styles.callFlow}>
    <div className={styles.callCard}><div className={styles.waveIcon}><PreviewIcon asset='base-Icon24RegularSoundWave' size={24} /></div><div className={styles.callCopy}><p>Product enquiry</p><p className={styles.microMuted}>Call ended</p></div></div>
    <div className={styles.connector}><img src='/assets/figma/header-base-Line1.svg' width='1' height='16' alt='' /></div>
    <div className={styles.summaryCard}>
      <div className={styles.summaryHeading}><span className={styles.starIcon}><PreviewIcon asset='base-IconArtwork1' size={17} /></span>AI summary</div>
      <p className={styles.summaryCopy}>Asked about plans and pricing.</p>
      <div className={styles.illustrationDivider} />
      <div className={styles.nextStep}><div><p className={styles.microMuted}>Next step</p><p className={styles.nextCopy}>Send the plan details.</p></div><span className={styles.microAction}><PreviewIcon asset='base-IconMessage' />Send message</span></div>
    </div>
  </div>;
}

function HelpwisePreview() {
  return <div className={styles.inboxCard}>
    <div className={styles.inboxToolbar}><span className={styles.inboxTitle}><PreviewIcon asset='helpwise-IconArtwork2' />Support inbox</span><span className={styles.assigned}><PreviewIcon asset='helpwise-StatusDot' size={5} />Assigned to you</span></div>
    <div className={styles.illustrationDivider} />
    <div className={styles.customerMessage}><div className={styles.sender}><span className={styles.avatar}>C</span><span>Customer</span><span className={styles.microMuted}>Just now</span></div><p>Can you check my delivery?</p></div>
    <div className={styles.privateNote}><div><PreviewIcon asset='helpwise-IconArtwork3' /><span>Internal note</span></div><p>Checking with dispatch.</p></div>
    <div className={styles.reply}><span className={styles.microAction}><PreviewIcon asset='helpwise-IconArtwork4' /><span>Reply to customer</span></span></div>
  </div>;
}

function CallPagePreview() {
  return <div className={styles.browserPreview}>
    <div className={styles.browserToolbar}>{[0, 1, 2].map(index => <PreviewIcon key={index} asset='callpage-BrowserDot' size={8} />)}<span /></div>
    <div className={styles.browserCanvas}><div className={styles.callbackWidget}>
      <div className={styles.callbackIntro}><div><p className={`display ${styles.callbackTitle}`}>Let’s talk.</p><p className={styles.microMuted}>Leave your number. We’ll call you.</p></div><div className={styles.callbackTiming}><span>Call now</span><span>Schedule</span></div></div>
      <div className={styles.callbackForm}><div><p className={styles.microMuted}>Your phone number</p><div className={styles.callbackInput}><PreviewIcon asset='callpage-IconArtwork2' />e.g. +1 555 0100</div></div><div className={styles.callbackSubmit}>Request a callback</div></div>
    </div></div>
  </div>;
}

function ApplicationsMenu() {
  const [product, setProduct] = useState<Product>('ServiceAgent');
  return <div className={styles.applicationsPanel} data-applications-panel>
    <div className={styles.productLinks}>
      {products.map(item => <a key={item.name} href={item.href} className={styles.productLink} data-active={product === item.name} onPointerEnter={() => setProduct(item.name)} onFocus={() => setProduct(item.name)}><span>{item.name}</span><span>{item.description}</span></a>)}
      <div className={styles.allApplications}><ButtonLink href='#applications' size='small' variant='outline'>All Applications<PreviewIcon asset='base-IconArtwork' /></ButtonLink></div>
    </div>
    <div className={`${styles.productPreview} ${product === 'ServiceAgent' ? styles.servicePreview : product === 'CallPage' ? styles.callbackPreview : ''}`} aria-hidden='true' data-product-preview={product}>
      <p className={styles.previewLabel}>{product}</p>
      {product === 'ServiceAgent' ? <ServiceAgentPreview /> : product === 'JustCall' ? <JustCallPreview /> : product === 'Helpwise' ? <HelpwisePreview /> : <CallPagePreview />}
    </div>
  </div>;
}

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  useEffect(() => {
    if (!openMenu) return;
    const dismissOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const dismissEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      headerRef.current?.querySelector<HTMLElement>(`[data-menu="${openMenu}"] > summary`)?.focus();
      setOpenMenu(null);
    };
    const dismissResize = () => setOpenMenu(null);
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissEscape);
    window.addEventListener('resize', dismissResize);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissEscape);
      window.removeEventListener('resize', dismissResize);
    };
  }, [openMenu]);
  return <header ref={headerRef} className={styles.header} onClick={event => { if ((event.target as HTMLElement).closest('a')) setOpenMenu(null); }} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null); }}>
      <div className={`page-container ${styles.headerInner}`}>
        <Link href='/' aria-label='AtomsAI home' className={styles.logo}><img src='/assets/figma/hero-Logo.svg' width='136' height='24' alt='AtomsAI' /></Link>
        <nav aria-label='Main navigation' className={styles.nav}>
          {links.map(link => link.children ? <DesktopDropdown key={link.label} label={link.label} className={`${styles.dropdown} ${link.label === 'Applications' ? styles.applicationsDropdown : ''}`} open={openMenu === link.label} onToggle={() => setOpenMenu(openMenu === link.label ? null : link.label)} trigger={<><span className={styles.navLabel}>{link.label}</span><span className={styles.chevron} data-menu-chevron><img src='/assets/figma/hero-Vector.svg' width='13.5' height='8' alt='' /></span></>}>
            {link.label === 'Applications' ? <ApplicationsMenu /> : <div className={styles.popover}>{link.children.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</div>}
          </DesktopDropdown> : <a key={link.label} href={link.href}><span className={styles.navLabel}>{link.label}</span></a>)}
        </nav>
        <div className={styles.actions}>
          <ButtonLink href='https://atomsai.com/company/contact' className={styles.contact}>Talk to AtomsAI</ButtonLink>
          <FullscreenMenu links={links} products={products} onOpen={() => setOpenMenu(null)} />
        </div>
      </div>
    </header>;
}

export function Hero() {
  return <section className={styles.hero} aria-labelledby='hero-heading' data-section='hero'>
    <div className={styles.artwork} aria-hidden='true'><img src='/assets/figma/hero-Frame84.svg' width='1601' height='960' alt='' fetchPriority='high' /></div>
    <div className={styles.headerFade} aria-hidden='true' />
    <div className={`page-container ${styles.content}`}>
      <div className={styles.heroStack}>
        <p className={styles.badge}>30 minutes. Bring one broken workflow.</p>
        <h1 id='hero-heading' tabIndex={-1} className={`display ${styles.title}`}>Powerful AI.<br />Built for real use.</h1>
        <p className={styles.lead}>AI for the conversations, decisions and workflows that keep business moving. Use our applications, build with PyAI, or work with us on something custom.</p>
        <div className={styles.buttons}><ButtonLink href='https://atomsai.com/company/contact' size='large'>Contact Us</ButtonLink><ButtonLink href='#technology' size='large' variant='secondary'>Try the technology</ButtonLink></div>
      </div>
    </div>
  </section>;
}
