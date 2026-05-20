const { chromium } = require('playwright');

async function inspectMFT() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const apiCalls = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('trpc') || url.includes('station') || url.includes('fuel')) {
      try {
        const text = await res.text();
        apiCalls.push({ url, text: text.substring(0, 500) });
      } catch (e) {}
    }
  });

  await page.goto('https://metrofueltracker.com/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  console.log(JSON.stringify(apiCalls, null, 2));
  await browser.close();
}

inspectMFT();
