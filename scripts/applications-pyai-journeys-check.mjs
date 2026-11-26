// Applications and PyAI journeys, tested from their real navigation entries
// against a static export served under the staging base path:
//   GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/clients/atomsai-staging npm run build
//   (serve out/ at /clients/atomsai-staging/, then)
//   JOURNEY_URL=http://127.0.0.1:3032/clients/atomsai-staging/ node scripts/applications-pyai-journeys-check.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';

const origin = process.env.JOURNEY_URL ?? 'http://127.0.0.1:3032/clients/atomsai-staging/';
const basePath = new URL(origin).pathname.replace(/\/$/, '');
const output = process.env.JOURNEY_OUTPUT ?? '/tmp/atomsai-journeys';
await fs.mkdir(output, { recursive: true });
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const at = route => new RegExp(`${escape(`${basePath}/${route}`)}/?(#.*)?$`);
const destinations = {
  applications: { route: 'applications', heading: 'Hello.', action: 'Explore our applications' },
  infrastructure: { route: 'infrastructure', heading: /voice AI behind a billion phone calls/, action: 'Get a free API key' },
};
const protectedPages = [
  ['', /AI that works today/], ['blog/', null], ['blog/quotes-go-quiet/', null], ['company/contact/', null], ['approach/', null],
];
const results = [];

function watch(page) {
  const problems = [];
  page.on('pageerror', error => {
    // WebKit reports Next's RSC prefetch as an access-control error when the test navigates away
    // mid-request. It does not reproduce on its own, on live staging or locally; real errors still fail.
    if (/_rsc=.*due to access control checks/.test(error.message)) return;
    problems.push(`pageerror ${error.message}`);
  });
  page.on('console', message => { if (message.type() === 'error') problems.push(`console ${message.text()}`); });
  page.on('response', response => {
    if (response.url().startsWith(new URL(origin).origin) && response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
  });
  return problems;
}

/** The destination opened, its primary action is visible, and its local assets loaded. */
async function checkDestination(page, name, hash) {
  const { route, heading, action } = destinations[name];
  await expect(page).toHaveURL(at(route));
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  if (hash) {
    await expect(page).toHaveURL(new RegExp(`${escape(hash)}$`));
    await expect.poll(() => page.locator(hash).evaluate(section => Math.round(section.getBoundingClientRect().top)), { timeout: 8000 })
      .toBeLessThan(260);
  } else {
    await expect(page.getByRole('link', { name: action, exact: true }).first()).toBeVisible();
  }
  const localLinks = await page.locator('a[href^="/"]').evaluateAll((links, base) => links.map(link => link.getAttribute('href')).filter(href => !href.startsWith(`${base}/`)), basePath);
  assert.deepEqual(localLinks, [], `${name}: local links without the base path`);
  const brokenImages = await page.locator('img').evaluateAll(images => images.filter(image => image.complete && image.getAttribute('loading') !== 'lazy' && image.naturalWidth === 0).map(image => image.currentSrc || image.src));
  assert.deepEqual(brokenImages, [], `${name}: broken images`);
}

/** Direct refresh of the destination, with and without the trailing slash. */
async function checkRefresh(page, name) {
  const { route, heading } = destinations[name];
  const reloaded = await page.reload({ waitUntil: 'load' });
  assert.equal(reloaded?.status(), 200, `${name}: refresh status`);
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  const direct = await page.goto(`${origin}${route}`, { waitUntil: 'load' });
  assert.equal(direct?.status(), 200, `${name}: direct load without trailing slash`);
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
}

/** ScrollSmoother moves content with transforms, so scroll with the wheel as a visitor would, then click. */
async function clickAfterScrolling(page, locator) {
  for (let step = 0; step < 200; step++) {
    const box = await locator.boundingBox();
    if (box && box.y > 100 && box.y + box.height < page.viewportSize().height - 40) break;
    await page.mouse.move(page.viewportSize().width / 2, page.viewportSize().height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  const box = await locator.boundingBox();
  assert(box, 'link is rendered');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function openDesktopMenu(page, label) {
  const trigger = page.locator(`[data-menu="${label}"] > summary`);
  await trigger.hover();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator(`[data-desktop-menu-viewport] [data-mega-menu="${label}"]`);
  await expect(panel).toBeVisible();
  return panel;
}

async function openMobileSection(page, label) {
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  const panel = page.locator('[data-responsive-panel]');
  await expect(panel).toBeVisible();
  const trigger = panel.locator('[data-section-trigger]').filter({ hasText: label });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  return panel.getByRole('region', { name: label, exact: true });
}

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  const tabKey = engineName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  try {
    // Desktop journeys, through the header menus and the footer directory.
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const desktopProblems = watch(desktop);
    const desktopJourneys = [
      ['Applications › All Applications (home)', '', async page => (await openDesktopMenu(page, 'Applications')).getByRole('link', { name: 'All Applications', exact: true }).click(), 'applications'],
      ['Applications › JustCall (AI Services)', 'approach/', async page => (await openDesktopMenu(page, 'Applications')).getByRole('link', { name: /^JustCall/ }).click(), 'applications', '#justcall'],
      ['Applications › ServiceAgent (blog)', 'blog/', async page => (await openDesktopMenu(page, 'Applications')).getByRole('link', { name: /^ServiceAgent/ }).click(), 'applications', '#serviceagent'],
      ['Infrastructure › Explore PyAI (home)', '', async page => (await openDesktopMenu(page, 'Infrastructure')).getByRole('link', { name: 'Explore PyAI', exact: true }).click(), 'infrastructure'],
      ['Infrastructure › Models & infrastructure card (contact)', 'company/contact/', async page => (await openDesktopMenu(page, 'Infrastructure')).getByRole('link', { name: /^Models & infrastructure/ }).click(), 'infrastructure'],
      ['Footer › Explore products (home)', '', async page => clickAfterScrolling(page, page.locator('footer').getByRole('link', { name: /^Explore products/ })), 'applications'],
      ['Footer › PyAI (home)', '', async page => clickAfterScrolling(page, page.locator('footer').getByRole('link', { name: /^PyAI/ })), 'infrastructure'],
      ['Footer › All applications (AI Services)', 'approach/', async page => clickAfterScrolling(page, page.locator('footer').getByRole('link', { name: /^All applications/ })), 'applications'],
      ['Footer › Models & infrastructure (AI Services)', 'approach/', async page => clickAfterScrolling(page, page.locator('footer').getByRole('link', { name: /^Models & infrastructure/ })), 'infrastructure'],
    ];
    for (const [journey, start, act, destination, hash] of desktopJourneys) {
      await desktop.goto(origin + start, { waitUntil: 'load' });
      await act(desktop);
      await checkDestination(desktop, destination, hash);
      results.push({ engine: engineName, viewport: 'desktop', journey, url: desktop.url() });
    }
    for (const name of Object.keys(destinations)) {
      await desktop.goto(`${origin}${destinations[name].route}/`, { waitUntil: 'load' });
      await checkRefresh(desktop, name);
      await desktop.screenshot({ path: `${output}/${engineName}-desktop-${name}.png` });
    }

    // Keyboard: open the menu without a pointer, reach the overview link, follow it.
    await desktop.goto(origin, { waitUntil: 'load' });
    for (const [label, link, destination] of [['Applications', 'All Applications', 'applications'], ['Infrastructure', 'Explore PyAI', 'infrastructure']]) {
      await desktop.goto(origin, { waitUntil: 'load' });
      const trigger = desktop.locator(`[data-menu="${label}"] > summary`);
      await trigger.focus();
      await desktop.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await desktop.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      await desktop.keyboard.press('Enter');
      await desktop.keyboard.press('ArrowDown');
      let reached = false;
      for (let step = 0; step < 20 && !reached; step++) {
        reached = await desktop.evaluate(name => document.activeElement?.textContent?.trim() === name, link);
        if (!reached) await desktop.keyboard.press(tabKey);
      }
      assert(reached, `keyboard reaches ${label} › ${link}`);
      await desktop.keyboard.press('Enter');
      await checkDestination(desktop, destination);
      results.push({ engine: engineName, viewport: 'desktop', journey: `keyboard ${label} › ${link}`, url: desktop.url() });
    }
    assert.deepEqual(desktopProblems, [], 'desktop errors');
    await desktop.close();

    // Mobile journeys, through the responsive navigation.
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: engineName === 'chromium', hasTouch: true });
    const mobileProblems = watch(mobile);
    const mobileJourneys = [
      ['Applications › All applications', '', 'Applications', 'All applications', 'applications'],
      ['Applications › ServiceAgent', 'approach/', 'Applications', /^ServiceAgent/, 'applications', '#serviceagent'],
      ['Infrastructure › Explore PyAI', 'blog/', 'Infrastructure', 'Explore PyAI', 'infrastructure'],
    ];
    for (const [journey, start, section, link, destination, hash] of mobileJourneys) {
      await mobile.goto(origin + start, { waitUntil: 'load' });
      const region = await openMobileSection(mobile, section);
      await region.getByRole('link', { name: link, exact: typeof link === 'string' }).click();
      await checkDestination(mobile, destination, hash);
      await expect(mobile.locator('[data-responsive-panel]')).toBeHidden();
      results.push({ engine: engineName, viewport: 'mobile', journey, url: mobile.url() });
    }
    for (const name of Object.keys(destinations)) {
      await mobile.goto(`${origin}${destinations[name].route}/`, { waitUntil: 'load' });
      await checkRefresh(mobile, name);
      const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 1, `${name}: horizontal overflow ${overflow}px at 390`);
      await mobile.screenshot({ path: `${output}/${engineName}-mobile-${name}.png` });
    }
    assert.deepEqual(mobileProblems, [], 'mobile errors');
    await mobile.close();

    // Protected pages still open cleanly under the base path.
    const spot = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const spotProblems = watch(spot);
    for (const [route, heading] of protectedPages) {
      const response = await spot.goto(origin + route, { waitUntil: 'load' });
      assert.equal(response?.status(), 200, `${route || 'home'} status`);
      await expect(heading ? spot.getByRole('heading', { level: 1, name: heading }) : spot.getByRole('heading', { level: 1 }).first()).toBeVisible();
      results.push({ engine: engineName, viewport: 'desktop', journey: `protected /${route}`, url: spot.url() });
    }
    assert.deepEqual(spotProblems, [], 'protected page errors');
    await spot.close();
  } finally {
    await browser.close();
  }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ origin, results }, null, 2) + '\n');
console.log(results.map(result => `${result.engine} ${result.viewport}: ${result.journey} → ${result.url}`).join('\n'));
console.log(`${results.length} journey checks passed against ${origin}`);
