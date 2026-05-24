const { chromium } = require('playwright');

async function checkDOM() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating...');
  await page.goto('https://metrofueltracker.com/');
  
  console.log('Selecting city...');
  try {
    await page.waitForSelector('text=METRO MANILA', { timeout: 10000 });
    await page.locator('text=METRO MANILA').first().click();
  } catch (e) {
    console.log('No city modal found or timeout.');
  }

  console.log('Waiting for loader...');
  try {
    await page.waitForSelector('.fixed.inset-0', { state: 'hidden', timeout: 5000 });
  } catch(e) {}
  
  console.log('Clicking advisories button...');
  const btn = page.locator('button[title="Advisories"]');
  if (await btn.count() > 0) {
    await btn.click({ force: true });
    await page.waitForTimeout(3000); // wait for modal
    
    const text = await page.evaluate(() => {
      // The advisory modal likely has a title like Advisories or Notifications
      const els = Array.from(document.querySelectorAll('div'));
      return els.map(e => e.innerText).join('\n');
    });
    console.log("Found text containing Advisories/Rollback/Hike?", /(advisories|rollback|hike)/i.test(text));
    
    // Look specifically for elements that might contain advisories
    const html = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal ? modal.innerHTML : '';
    });
    console.log("Modal innerHTML:", html.substring(0, 500));
  } else {
    console.log('Advisories button not found!');
  }
  
  await browser.close();
}

checkDOM().catch(console.error);
