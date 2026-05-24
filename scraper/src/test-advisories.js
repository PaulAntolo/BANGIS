const { chromium } = require('playwright');

async function scrapeAdvisories() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/') || url.includes('trpc') || url.includes('.json') || url.includes('advisories') || url.includes('notifications')) {
      if (res.request().resourceType() === 'fetch' || res.request().resourceType() === 'xhr') {
        console.log(`[Intercept] ${res.status()} ${url}`);
        try {
          const text = await res.text();
          if (text.length > 0) {
            console.log(`Payload: ${text.substring(0, 300)}...`);
          }
        } catch (e) {}
      }
    }
  });

  await page.goto('https://metrofueltracker.com/');
  await page.waitForTimeout(3000);
  
  console.log('Clicking advisories button...');
  const btn = page.locator('button[title="Advisories"]');
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(3000);
  } else {
    console.log('Advisories button not found!');
  }
  
  await browser.close();
}

scrapeAdvisories().catch(console.error);
