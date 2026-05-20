const { chromium } = require('playwright');
const GASWATCH_URL = 'https://gaswatchph.com/';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto(GASWATCH_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window._tableAllStations && window._tableAllStations.length > 500);
  
  const payload = await page.evaluate(() => {
    return window._tableAllStations.filter(s => JSON.stringify(s).toLowerCase().includes('bacolod')).slice(0, 5);
  });
  
  console.log('Bacolod stations:', JSON.stringify(payload, null, 2));
  
  const areas = await page.evaluate(() => {
    const allAreas = window._tableAllStations.map(s => s.area);
    return [...new Set(allAreas)].slice(0, 20);
  });
  console.log('Sample areas:', areas);
  
  await browser.close();
}

debug();
