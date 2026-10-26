import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, reducedMotion: 'reduce' });
const errors = [];
const checks = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(process.env.VISUAL_URL || 'http://127.0.0.1:3000', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
await page.keyboard.press('Tab');
await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
const focus = await page.locator(':focus').evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
if (focus.outline === 'none' || focus.width === '0px') throw new Error('Keyboard focus is not visible.');
await page.keyboard.press('Enter');
await expect(page.locator('#hero-heading')).toBeFocused();
await page.keyboard.press('Tab');
await expect(page.getByRole('link', { name: 'Contact Us', exact: true })).toBeFocused();
checks.push('One page heading; visible skip link bypasses navigation and continues at the hero action.');

const applicationsToggle = page.locator('[data-menu="Applications"] > summary');
await applicationsToggle.press('Enter');
await expect(page.locator('[data-applications-panel]')).toBeVisible();
await page.locator('[data-applications-panel] a').filter({ hasText: 'JustCall' }).focus();
await expect(page.locator('[data-product-preview="JustCall"]')).toBeVisible();
await page.keyboard.press('Escape');
await expect(page.locator('[data-applications-panel]')).toHaveCount(0);
await expect(applicationsToggle).toBeFocused();
await applicationsToggle.click();
await page.locator('h1').click();
await expect(page.locator('[data-applications-panel]')).toHaveCount(0);
checks.push('Original Applications previews respond to keyboard focus; Escape restores focus and outside click dismisses.');

const faq = page.locator('#faq details');
await expect(faq.nth(1)).toHaveAttribute('open', '');
await faq.first().locator('summary').press('Enter');
await expect(faq.first()).toHaveAttribute('open', '');
await expect(page.locator('#faq details[open]')).toHaveCount(1);
checks.push('FAQ opens by keyboard and keeps one answer expanded.');

await page.getByRole('button', { name: 'Next industry', exact: true }).click();
await expect(page.locator('#industries h3')).toHaveText('Logistics');
await page.getByRole('button', { name: 'Previous industry', exact: true }).click();
await expect(page.locator('#industries h3')).toHaveText('Insurance');
const chooser = page.getByRole('button', { name: 'View All Industries', exact: true });
await chooser.click();
await expect(chooser).toHaveAttribute('aria-expanded', 'true');
await page.keyboard.press('Escape');
await expect(chooser).toHaveAttribute('aria-expanded', 'false');
await expect(chooser).toBeFocused();
await chooser.click();
await page.locator('#industry-options').getByRole('button', { name: 'Manufacturing' }).click();
await expect(page.locator('#industries h3')).toHaveText('Manufacturing');
await expect(chooser).toBeFocused();
checks.push('Industry navigation, selection, Escape dismissal and focus restoration work.');

const readStory = page.getByRole('button', { name: 'Read Story', exact: true });
await readStory.click();
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible();
await expect(dialog).toContainText('78% → 94%');
await page.keyboard.press('Escape');
await expect(dialog).not.toBeVisible();
await expect(readStory).toBeFocused();
checks.push('Story dialog exposes supplied results; Escape restores the trigger focus.');

for (const width of [1600, 320]) {
  await page.setViewportSize({ width, height: 960 });
  await page.getByRole('button', { name: 'Try the property advisor', exact: true }).click();
  const input = page.getByLabel('Message the property advisor', { exact: true });
  await expect(input).toBeFocused();
  await input.fill('Two bedrooms near a park');
  await input.press('Enter');
  await expect(page.locator('#property-preview')).toContainText('Which area would you like to live in, and what matters most to you in a home?');
  await expect(input).toBeFocused();
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error(`Active chat overflows at ${width}px.`);
}
checks.push('Property advisor accepts messages with Enter, shows a follow-up question and keeps controls usable at 320px.');

const invalidAnchors = await page.evaluate(() => Array.from(document.querySelectorAll('a[href^="#"]')).map(a => a.getAttribute('href')).filter(href => href === '#' || !document.getElementById(href.slice(1))));
if (invalidAnchors.length) throw new Error(`Unresolved local anchors: ${invalidAnchors.join(', ')}`);
const motion = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
if (motion !== 'auto') throw new Error('Reduced-motion scrolling is not respected.');
checks.push('All local anchors resolve and reduced-motion mode disables smooth scrolling.');

await page.evaluate(() => window.scrollTo(0, 0));
const menuToggle = page.getByRole('button', { name: 'Open site menu', exact: true });
await menuToggle.press('Enter');
await expect(page.getByRole('navigation', { name: 'Site menu' })).toBeVisible();
await page.getByRole('navigation', { name: 'Site menu' }).getByRole('link', { name: 'Applications', exact: true }).click();
await expect(page.getByRole('navigation', { name: 'Site menu', includeHidden: true })).toBeHidden();
checks.push('Full-screen menu works by keyboard at 320px and closes after navigation.');

await browser.close();
await fs.mkdir('docs/visual', { recursive: true });
await fs.writeFile('docs/visual/interactions.json', JSON.stringify({ date: '2026-10-26', checks, errors }, null, 2) + '\n');
console.log(checks.join('\n'));
if (errors.length) throw new Error(errors.join('\n'));
