'use client';

import Link from 'next/link';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ButtonLink } from '@/components/ui';
import { AnimatedLogo } from '@/components/animated-logo';
import { DesktopDropdown } from './desktop-dropdown';
import { DesktopMenuViewport } from './desktop-menu-viewport';
import { MegaMenu, MenuArrow } from './mega-menu';
import { NavLinkMarker } from './nav-link-marker';
import { FullscreenMenu } from './fullscreen-menu';
import { JustCallScene, HelpwiseScene, ServiceAgentScene, CallPageScene } from './application-scenes';
import styles from './hero.module.css';

const products = [
  { name: 'JustCall', mark: 'justcall-mark.svg', href: 'https://justcall.io/', description: 'Calls, messages and AI for sales and support.' },
  { name: 'Helpwise', mark: 'helpwise-mark.svg', href: 'https://helpwise.io/', description: 'One shared inbox for customer conversations.' },
  { name: 'ServiceAgent', mark: 'serviceagent-mark.svg', href: 'https://serviceagent.ai/', description: 'AI for calls, bookings and home-service admin.' },
  { name: 'CallPage', mark: 'callpage-mark.svg', href: 'https://www.callpage.io/', description: 'Turn website visits into callbacks and meetings.' },
] as const;
type Product = typeof products[number]['name'];
const links = [
  { label: 'Applications', href: '/#applications', children: products.map(({ name, href }) => [name, href]) },
  { label: 'Infrastructure', href: 'https://pyai.com/', children: [['Explore PyAI', 'https://pyai.com/'], ['Try the playground', 'https://pyai.com/playground']] },
  { label: 'AI Services', href: '/approach' },
  { label: 'Industries', href: '/#industries', children: [['Manufacturing', 'https://atomsai.com/industries/manufacturing'], ['Insurance', 'https://atomsai.com/industries/insurance'], ['Healthcare', '/industries/healthcare'], ['Logistics', 'https://atomsai.com/industries/logistics']] },
  { label: 'Resources', href: 'https://atomsai.com/resources', children: [
    ['Case studies', 'https://atomsai.com/resources/case-studies'],
    ['Blog', 'https://atomsai.com/resources/blog'],
    ['Help center', '/#faq'],
    ['Website updates', 'https://atomsai.com/changelog'],
  ] },
  { label: 'Company', href: 'https://atomsai.com/company', overviewLabel: 'Company overview', children: [
    ['About us', 'https://atomsai.com/company/about'],
    ['Careers', 'https://atomsai.com/company/careers'],
    ['Contact us', '/company/contact'],
    ['Trust Center', '/trust'],
    ['Brand', 'https://atomsai.com/brand'],
  ] },
];

const previewScenes = { JustCall: JustCallScene, Helpwise: HelpwiseScene, ServiceAgent: ServiceAgentScene, CallPage: CallPageScene };

function ApplicationsMenu() {
  const [product, setProduct] = useState<Product>('ServiceAgent');
  const panelRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const highlight = panel.querySelector('[data-product-highlight]');
    const link = panel.querySelector<HTMLElement>('[data-active="true"]');
    const figures = panel.querySelectorAll<HTMLElement>('[data-product-preview]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let tweens: gsap.core.Tween[] = [];
    const update = () => {
      tweens.forEach(tween => tween.kill());
      tweens = [];
      const instant = !initialized.current || motion.matches;
      if (highlight && link) {
        tweens.push(gsap.to(highlight, { y: link.offsetTop, height: link.offsetHeight,
          autoAlpha: 1, duration: instant ? 0 : .32, ease: 'power3.out' }));
      }
      figures.forEach(figure => {
        const active = figure.dataset.productPreview === product;
        const objects = figure.querySelectorAll<HTMLElement>('[data-preview-object]');
        const visible = Number(gsap.getProperty(figure, 'opacity')) > .001;
        if (active && !instant && !visible) gsap.set(objects, { y: 8 });
        // Crossfade the figures over the shared flat dark-green surface.
        gsap.set(figure, { zIndex: active ? 1 : 0, visibility: active || visible ? 'visible' : 'hidden' });
        tweens.push(gsap.to(figure, {
          opacity: active ? 1 : 0, duration: instant ? 0 : .4, ease: 'power2.inOut',
          onComplete: () => { if (!active) gsap.set(figure, { visibility: 'hidden' }); },
        }));
        tweens.push(gsap.to(objects, {
          y: active || instant ? 0 : -5, duration: instant ? 0 : .45,
          stagger: instant ? 0 : .025, ease: 'power3.out',
        }));
      });
      initialized.current = true;
    };
    update();
    motion.addEventListener('change', update);
    return () => { tweens.forEach(tween => tween.kill()); motion.removeEventListener('change', update); };
  }, [product]);

  return <div ref={panelRef} className={styles.applicationsPanel} data-applications-panel>
    <div className={styles.menuIntroduction}>
      <h2 className={`display ${styles.menuHeading}`}>Built for the work<br />in front of you.</h2>
      <p className={styles.menuDescription}>From the first conversation to the next task. Find the right application for your team.</p>
      <a className={styles.menuTextLink} href='/capabilities/voice'>Explore voice AI<MenuArrow /></a>
    </div>
    <div>
    <div className={styles.productLinks}>
      <div className={styles.productHighlight} data-product-highlight aria-hidden='true' />
      {products.map(item => <a key={item.name} href={item.href} className={styles.productLink} data-active={product === item.name} onPointerEnter={() => setProduct(item.name)} onFocus={() => setProduct(item.name)}><span className={styles.productMark} aria-hidden='true' style={{ maskImage: `url('/assets/products/${item.mark}')` }} /><span className={styles.productLinkCopy}><span>{item.name}</span><span>{item.description}</span></span></a>)}
      <div className={styles.allApplications}><ButtonLink href='/#applications' size='small' variant='outline'>All Applications<svg width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.33333' aria-hidden='true'><path d='M3.33333 12.6667L9.66667 6.33333M6 3.33333H12.6667V10' /></svg></ButtonLink></div>
    </div>
    </div>
    <div>
    <div className={`theme-dark ${styles.productPreviewFrame}`} aria-hidden='true'>
      {products.map(item => {
        const Scene = previewScenes[item.name];
        return <div key={item.name} className={styles.productPreview} data-product-preview={item.name}>
          <div className={styles.previewScene} data-preview-object><div className={styles.previewCanvas}><Scene /></div></div>
        </div>;
      })}
    </div>
    </div>
  </div>;
}

const desktopMenus = links.filter(link => link.children).map(link => ({
  label: link.label,
  content: <MegaMenu link={link}>{link.label === 'Applications' ? <ApplicationsMenu /> : undefined}</MegaMenu>,
}));

export function SiteHeader({ initialTheme = 'light' }: { initialTheme?: 'light' | 'dark' } = {}) {
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelClose = () => { clearTimeout(closeTimer.current); };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let displayed = 0;
    let lastWritten = -1;
    // Explicit section themes are the source of truth, not inferred pixel colors.
    const regions = Array.from(document.querySelectorAll<HTMLElement>('#smooth-content [data-theme]'));
    const update = (_time: number, delta: number) => {
      if (header.dataset.siteMenuOpen === 'true') return;
      if (header.dataset.desktopMenuOpen === 'true') { header.dataset.theme = 'light'; return; }
      // Follow the rendered scroll, including the hero's automatic flight,
      // rather than the native scroll target ahead of ScrollSmoother.
      const pin = ScrollTrigger.getById('hero-prototype');
      const scroll = ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
      const progress = Math.min(1, Math.max(0,
        pin ? (scroll - pin.start) / Math.max(1, pin.end - pin.start) : scroll / 800,
      ));
      const target = progress * progress * (3 - 2 * progress);
      // Frame-rate-independent settling also softens wheel reversals and
      // changes to the pin range after fonts or responsive layout load.
      displayed += (target - displayed) * (motion.matches ? 1 : 1 - Math.exp(-Math.min(delta, 64) / 280));
      if (Math.abs(target - displayed) < .0001) displayed = target;
      if (displayed !== lastWritten) {
        header.style.setProperty('--header-scroll-progress', String(displayed));
        lastWritten = displayed;
      }
      // Read the rendered bounds, so ScrollSmoother and pinned hero movement agree.
      const bounds = header.getBoundingClientRect();
      const sampleY = bounds.top + bounds.height / 2;
      const sampleX = window.innerWidth / 2;
      let theme = 'light';
      for (const region of regions) {
        const rect = region.getBoundingClientRect();
        if (rect.top <= sampleY && rect.bottom > sampleY && rect.left <= sampleX && rect.right > sampleX) {
          theme = region.dataset.theme === 'dark' ? 'dark' : 'light';
        }
      }
      if (theme !== header.dataset.theme) header.dataset.theme = theme;
    };
    gsap.ticker.add(update);
    return () => {
      gsap.ticker.remove(update);
      header.style.removeProperty('--header-scroll-progress');
    };
  }, []);
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
  return <header ref={headerRef} data-desktop-menu-open={Boolean(openMenu)} data-theme={initialTheme} className={styles.header}
    onPointerEnter={cancelClose}
    onPointerLeave={event => {
      if (event.pointerType === 'touch') return;
      cancelClose();
      closeTimer.current = setTimeout(() => {
        if (!headerRef.current?.querySelector('[data-dropdown-active="true"] :focus-visible')) setOpenMenu(null);
      }, 180);
    }}
    onPointerOver={event => {
      if (event.pointerType !== 'touch' && (event.target as HTMLElement).closest('a') && !(event.target as HTMLElement).closest('[data-desktop-menu-viewport]')) setOpenMenu(null);
    }}
    onFocusCapture={event => {
      event.currentTarget.dataset.entryComplete = 'true';
      cancelClose();
      if ((event.target as HTMLElement).closest('a') && !(event.target as HTMLElement).closest('[data-desktop-menu-viewport]')) setOpenMenu(null);
    }}
    onClick={event => { if ((event.target as HTMLElement).closest('a')) setOpenMenu(null); }}
    onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null); }}>

      <div aria-hidden="true" className={styles.headerFade}>
        <span className={styles.headerBlur} />
        <span className={styles.headerBlur} />
        <span className={styles.headerBlur} />
        <span className={styles.headerBlur} />
        <span className={styles.headerBlur} />
      </div>
      <div className={styles.headerInner}>
        <Link href='/' prefetch={false} aria-label='AtomsAI home' className={styles.logo}>
          <AnimatedLogo className={styles.logoSymbol} playOnHover />
          <span className={styles.logoMark} aria-hidden="true" />
        </Link>
        <nav aria-label='Main navigation' className={styles.nav}>
          {links.map(link => link.children ? <DesktopDropdown key={link.label} label={link.label} className={styles.dropdown} panelId={`${menuId}-${link.label}`} open={openMenu === link.label} onToggle={() => { cancelClose(); setOpenMenu(openMenu === link.label ? null : link.label); }} onOpen={() => { cancelClose(); setOpenMenu(link.label); }} trigger={<span className={styles.navLabel}>{link.label}</span>} /> : <a key={link.label} href={link.href} onPointerEnter={event => { if (event.pointerType !== 'touch') setOpenMenu(null); }} onFocus={() => setOpenMenu(null)}><NavLinkMarker><span className={styles.navLabel}>{link.label}</span></NavLinkMarker></a>)}
        </nav>
        <div className={styles.actions}>
          <ButtonLink href='/company/contact' className={styles.contact}>Talk to AtomsAI</ButtonLink>
          <FullscreenMenu links={links} onOpen={() => setOpenMenu(null)} />
        </div>
        <DesktopMenuViewport active={openMenu} items={desktopMenus} idPrefix={menuId} onClose={() => setOpenMenu(null)} />
      </div>
    </header>;
}

