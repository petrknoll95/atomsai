/** Visit lazy decorative canvases before taking a full-page comparison. */
export async function prepareHomepagePatterns(page) {
  const canvases = page.locator('[data-home-pattern] canvas');
  for (let i = 0; i < await canvases.count(); i++) {
    const canvas = canvases.nth(i);
    if (!await canvas.evaluate(element => element.clientWidth > 0 && element.clientHeight > 0)) continue;
    await canvas.scrollIntoViewIfNeeded();
    await canvas.evaluate(element => new Promise((resolve, reject) => {
      const started = performance.now();
      function check() {
        if (element.dataset.renderState === 'ready') return resolve();
        if (element.dataset.renderState === 'error' || performance.now() - started > 15000) return reject(new Error('Homepage pattern did not render.'));
        requestAnimationFrame(check);
      }
      check();
    }));
  }
  await page.evaluate(async () => { scrollTo({ top: 0, behavior: 'instant' }); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
}
