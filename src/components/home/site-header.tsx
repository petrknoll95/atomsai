'use client';

import { withBasePath, assetPath } from '@/lib/base-path';

import { ArrowIcon } from '@/components/arrow-icon';
import Link from 'next/link';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ButtonLink } from '@/components/ui';
import { AnimatedLogo } from '@/components/animated-logo';
import { DesktopDropdown } from './desktop-dropdown';
import { DesktopMenuViewport } from './desktop-menu-viewport';
import { MegaMenu } from './mega-menu';
import { NavLinkMarker } from './nav-link-marker';
import { ResponsiveMenu } from './responsive-menu';
import { ResponsiveApplications } from './responsive-applications';
import { navigationLinks as links, products } from './navigation-data';
import { JustCallScene, HelpwiseScene, ServiceAgentScene, CallPageScene } from './application-scenes';
import styles from './hero.module.css';

type Product = typeof products[number]['name'];

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
      <a className={styles.menuTextLink} href={withBasePath('/capabilities/voice')}>Explore Voice AI<ArrowIcon size={14} /></a>
    </div>
    <div>
    <div className={styles.productLinks}>
      <div className={styles.productHighlight} data-product-highlight aria-hidden='true' />
      {products.map(item => <a key={item.name} href={withBasePath(item.href)} className={styles.productLink} data-active={product === item.name} onPointerEnter={() => setProduct(item.name)} onFocus={() => setProduct(item.name)}><span className={styles.productMark} aria-hidden='true' style={{ maskImage: assetPath(`url('/assets/products/${item.mark}')`) }} /><span className={styles.productLinkCopy}><span>{item.name}</span><span>{item.description}</span></span></a>)}
      <div className={styles.allApplications}><ButtonLink href='/#applications' size='small' variant='outline'>All Applications</ButtonLink></div>
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

const responsiveMenus = links.filter(link => link.children).map(link => ({
  label: link.label,
  content: <MegaMenu link={link} compact>{link.label === 'Applications' ? <ResponsiveApplications /> : undefined}</MegaMenu>,
}));

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [responsiveOpen, setResponsiveOpen] = useState(false);
  useLayoutEffect(() => {
    if ((openMenu || menuVisible) && headerRef.current) headerRef.current.dataset.theme = 'light';
  }, [openMenu, menuVisible]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    // Explicit section themes are the source of truth, not inferred pixel colors.
    const regions = Array.from(document.querySelectorAll<HTMLElement>('#smooth-content [data-theme], #smooth-content [data-header-theme]'));
    const update = () => {
      if (header.dataset.responsiveMenuOpen === 'true') { header.dataset.theme = 'light'; return; }
      if (header.dataset.desktopMenuOpen === 'true') { header.dataset.theme = 'light'; return; }
      // Read the rendered bounds, so ScrollSmoother and pinned hero movement agree.
      const bounds = header.getBoundingClientRect();
      const sampleY = bounds.top + bounds.height / 2;
      const sampleX = window.innerWidth / 2;
      let theme = 'light';
      for (const region of regions) {
        const rect = region.getBoundingClientRect();
        if (rect.top <= sampleY && rect.bottom > sampleY && rect.left <= sampleX && rect.right > sampleX) {
          theme = (region.dataset.headerTheme ?? region.dataset.theme) === 'dark' ? 'dark' : 'light';
          // Faded sections can become light before their physical bottom edge.
          const lightAt = Number(region.dataset.headerLightAt);
          if (Number.isFinite(lightAt) && sampleY >= rect.top + rect.height * lightAt) theme = 'light';
        }
      }
      if (theme !== header.dataset.theme) header.dataset.theme = theme;
    };
    gsap.ticker.add(update);
    return () => {
      gsap.ticker.remove(update);
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
  return <header ref={headerRef} role={responsiveOpen ? 'dialog' : undefined} aria-modal={responsiveOpen || undefined} aria-label={responsiveOpen ? 'Site navigation' : undefined} data-responsive-menu-open={responsiveOpen} data-desktop-menu-open={Boolean(openMenu) || menuVisible} data-theme={initialTheme} className={styles.header}
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

      <div aria-hidden="true" className={styles.headerBackdrop} />
      <div className={styles.headerInner}>
        <Link href='/' prefetch={false} aria-label='AtomsAI home' className={styles.logo}>
          <AnimatedLogo className={styles.logoSymbol} playOnHover />
          <span className={styles.logoMark} aria-hidden="true" />
        </Link>
        <nav aria-label='Main navigation' className={styles.nav}>
          {links.map(link => link.children ? <DesktopDropdown key={link.label} label={link.label} className={styles.dropdown} panelId={`${menuId}-${link.label}`} open={openMenu === link.label} onToggle={() => { cancelClose(); setOpenMenu(openMenu === link.label ? null : link.label); }} onOpen={() => { cancelClose(); setOpenMenu(link.label); }} trigger={<span className={styles.navLabel}>{link.label}</span>} /> : <a key={link.label} href={withBasePath(link.href)} onPointerEnter={event => { if (event.pointerType !== 'touch') setOpenMenu(null); }} onFocus={() => setOpenMenu(null)}><NavLinkMarker><span className={styles.navLabel}>{link.label}</span></NavLinkMarker></a>)}
        </nav>
        <div className={styles.actions}>
          <ButtonLink href='/company/contact' className={styles.contact}>Talk to AtomsAI</ButtonLink>
          <ResponsiveMenu links={links} items={responsiveMenus} open={responsiveOpen} onOpenChange={setResponsiveOpen} onOpen={() => { cancelClose(); setOpenMenu(null); }} />
        </div>
        <DesktopMenuViewport active={openMenu} items={desktopMenus} idPrefix={menuId} onClose={() => setOpenMenu(null)} onVisibilityChange={setMenuVisible} />
      </div>
    </header>;
}

