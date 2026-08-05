const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:8000';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);

  await page.locator('#book').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-booking.png' });

  await browser.close();
})();
