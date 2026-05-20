const { chromium } = require('playwright');
const fs = require('fs');

async function inspectMFT() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const apiCalls = [];
  page.on('response', async (res) => {
    const url = res.url();
    // Catch anything that might be data
    if (url.includes('api') || url.includes('trpc') || url.includes('.json')) {
      try {
        const text = await res.text();
        apiCalls.push({ url, text: text.substring(0, 300) });
      } catch (e) {}
    }
  });

  await page.goto('https://metrofueltracker.com/', { waitUntil: 'networkidle' });
  
  const html = await page.content();
  fs.writeFileSync('mft.html', html);
  
  console.log('Intercepted API calls:', JSON.stringify(apiCalls, null, 2));
  console.log('HTML saved to mft.html');

  await browser.close();
}

inspectMFT();
