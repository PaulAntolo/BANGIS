const { chromium } = require('playwright');

async function checkDOM() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating...');
  await page.goto('https://metrofueltracker.com/');
  await page.waitForTimeout(3000);
  
  console.log('Clicking advisories button...');
  const btn = page.locator('button[title="Advisories"]');
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(3000); // wait for modal
    
    // Check if any dialog or drawer appeared
    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 1000));
  } else {
    console.log('Advisories button not found!');
  }
  
  await browser.close();
}

checkDOM().catch(console.error);
