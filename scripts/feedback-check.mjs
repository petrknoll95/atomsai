import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch();
const baseURL = process.env.FEEDBACK_TEST_URL || 'http://127.0.0.1:3001';

async function clickEmptyVisual(page) {
  const hero = await page.locator('[data-section=hero]').boundingBox();
  if (!hero) throw new Error('Missing hero');
  const pins = await page.locator('#pindrop-web-pins > *').evaluateAll(elements => elements.map(el => {
    const r = el.getBoundingClientRect(); return { x:r.x+r.width/2, y:r.y+r.height/2 };
  }));
  for (const fy of [.35,.45,.55,.65,.75]) for (const fx of [.15,.35,.55,.75,.9]) {
    const x=hero.x+hero.width*fx, y=Math.min(hero.height, page.viewportSize().height - 120)*fy;
    if (pins.every(p => Math.hypot(p.x-x,p.y-y)>65)) { await page.mouse.click(x,y); return; }
  }
  throw new Error('No empty visual area for test pin');
}

async function desktopCheck() {
  const first = await browser.newContext({baseURL, reducedMotion:'reduce', viewport:{width:1440,height:1000}});
  const second = await browser.newContext({baseURL, reducedMotion:'reduce', viewport:{width:1440,height:1000}});
  const a = await first.newPage();
  const b = await second.newPage();
  const marker = `Feedback check ${Date.now()}`;
  await a.goto('/?private=do-not-record#hero-heading');
  await a.getByRole('button', { name: 'Feedback', exact: true }).click();
  await a.getByRole('button', { name: /Comment mode/ }).click();
  await expect(a.locator('#pindrop-web-overlay')).toBeVisible();
  await clickEmptyVisual(a);
  await a.getByPlaceholder('Enter your name').fill('Test reviewer A');
  await a.getByRole('button', { name: 'Save', exact: true }).click();
  await a.getByPlaceholder('Add a comment...').fill(marker);
  await a.getByRole('button', { name: 'Send comment', exact: true }).click();
  await expect(a.locator('[data-feedback-status]')).toHaveText('Shared feedback · Saved');
  await b.goto('/');
  await b.getByRole('button', { name: 'Feedback', exact: true }).click();
  await b.getByRole('button', { name: /Review mode/ }).click();
  await b.locator('#pindrop-web-root').getByText(marker, { exact:true }).click();
  await b.getByText('Browser & viewport',{exact:true}).click();
  await expect(b.locator('[data-submission-context]')).toContainText('1440 × 1000 CSS px');
  await expect(b.locator('[data-submission-context]')).toContainText('Chrome');
  await expect(b.locator('[data-submission-context]')).not.toContainText('private=');
  await b.getByPlaceholder('Reply...').fill('Second guest reply');
  await b.getByRole('button', { name: 'Send comment', exact:true }).click();
  await b.getByPlaceholder('Enter your name').fill('Test reviewer B');
  await b.getByRole('button', { name:'Save', exact:true }).click();
  await expect(b.locator('[data-feedback-status]')).toHaveText('Shared feedback · Saved');
  await a.setViewportSize({width:1200,height:850});
  await a.reload();
  await a.getByRole('button', { name: 'Feedback', exact:true }).click();
  await a.getByRole('button', { name: /Review mode/ }).click();
  await a.locator('#pindrop-web-root').getByText(marker, { exact:true }).click();
  await expect(a.locator('#pindrop-web-root').getByText('Second guest reply', {exact:true})).toBeVisible();
  await expect(a.locator('[data-submission-context]')).toContainText('1440 × 1000 CSS px');
  await a.getByRole('button', { name: 'View mode — interact with prototype', exact:true }).click();
  const pin = a.locator('#pindrop-web-pins > [data-comment-id]').filter({ visible:true }).first();
  await expect(pin).toBeVisible();
  await expect(a.locator('#pindrop-web-overlay')).toBeHidden();
  await pin.click();
  await expect(a.getByPlaceholder('Reply...')).toBeVisible();
  await a.getByRole('button',{name:'Close feedback',exact:true}).click();
  await expect(a.locator('#pindrop-web-pins')).toBeHidden();
  await a.getByRole('button',{name:'Feedback',exact:true}).click();
  await expect(pin).toBeVisible();
  await a.getByRole('button',{name:'Close feedback',exact:true}).click();
  await a.goto('/patterns');
  await a.getByRole('button',{name:'Feedback',exact:true}).click();
  await a.getByRole('button',{name:/Review mode/}).click();
  await expect(a.locator('#pindrop-web-root').getByText(marker,{exact:true})).toHaveCount(0);
  await a.getByRole('link', {name:'AtomsAI', exact:false}).first().click();
  await expect(a.locator('#pindrop-web-root')).toHaveCount(0);
  await a.getByRole('button',{name:'Feedback',exact:true}).click();
  await expect(a.locator('#pindrop-web-root')).toHaveCount(1);
  await expect(a.locator('#pindrop-web-pins > [data-comment-id]').first()).toBeVisible();
  await first.close(); await second.close();
}

async function mobileCheck() {
  const context = await browser.newContext({baseURL, reducedMotion:'reduce'});
  const page = await context.newPage();
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('/');
  await page.getByRole('button',{name:'Feedback',exact:true}).click();
  await page.getByRole('button',{name:/Comment mode/}).click();
  await clickEmptyVisual(page);
  await page.getByPlaceholder('Enter your name').fill('Mobile verification');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  const marker = `Mobile feedback check ${Date.now()}`;
  await page.getByPlaceholder('Add a comment...').fill(marker);
  await page.getByRole('button',{name:'Send comment',exact:true}).click();
  await expect(page.locator('[data-feedback-status]')).toHaveText('Shared feedback · Saved');
  await page.getByRole('button',{name:'Close feedback',exact:true}).click();
  await page.getByRole('button',{name:'Feedback',exact:true}).click();
  await page.getByRole('button',{name:/Review mode/}).click();
  await page.locator('#pindrop-web-root').getByText(marker, {exact:true}).click();
  await expect(page.locator('[data-submission-context]')).toContainText('390 × 844 CSS px');
  await context.close();
}
try { await desktopCheck(); await mobileCheck(); console.log('PASS: shared guests, replies, pointer pins, close/reopen, route isolation and mobile'); } finally { await browser.close(); }
