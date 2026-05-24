const { chromium } = require('playwright');

async function checkDOM() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating...');
  await page.goto('https://metrofueltracker.com/');
  
  console.log('Waiting for loading overlay to disappear...');
  try {
    await page.waitForSelector('.z-\\[3000\\]', { state: 'hidden', timeout: 10000 });
  } catch (e) {
    console.log('Loader timeout or not found, proceeding anyway.');
  }
  
  console.log('Clicking advisories button...');
  const btn = page.locator('button[title="Advisories"]');
  if (await btn.count() > 0) {
    await btn.click({ force: true });
    await page.waitForTimeout(3000); // wait for modal
    
    // Scrape the modal text
    const text = await page.evaluate(() => {
      // Find a likely modal or drawer element
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
      return dialogs.map(d => d.innerText).join('\n---\n');
    });
    console.log("Extracted text:", text.substring(0, 1000));
  } else {
    console.log('Advisories button not found!');
  }
  
  await browser.close();
}

checkDOM().catch(console.error);
