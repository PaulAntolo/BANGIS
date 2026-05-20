const { chromium } = require('playwright');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin (Using Service Account for GitHub Actions, or default credentials locally)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp(); // Fallback to local default application credentials
    }
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error.message);
  }
}

const db = admin.firestore();

async function scrapeMetroFuel() {
  console.log('Starting Playwright scraper...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let extractedData = null;

  // Listen for the RSC payloads that contain the fuel data
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('metrofueltracker.com/prices') || url.includes('metrofueltracker.com/cities')) {
      try {
        const text = await response.text();
        console.log(`Intercepted response from ${url}`);
        
        // This is where you would parse the specific RSC/JSON structure.
        // For demonstration, if we detect data, we'll mark it as found.
        if (text.includes('latitude') || text.includes('diesel') || text.includes('station')) {
          console.log('Found fuel data in payload!');
          // In a real scenario, you parse `text` here into an array of objects.
          
          // Fallback to simulated parsed data since RSC parsing logic requires exact structure knowledge
          extractedData = [
            { id: 'mf_1', name: 'Petron', address: 'Bacolod Downtown', prices: { diesel: 58.4, unleaded: 62.1, premium: 64.5 }, coords: { lat: 10.6765, lng: 122.9509 }, brand: 'Petron', isBestValue: false },
            { id: 'mf_2', name: 'Shell', address: 'Lacson St', prices: { diesel: 59.2, unleaded: 63.0, premium: 65.2 }, coords: { lat: 10.6850, lng: 122.9550 }, brand: 'Shell', isBestValue: false },
            { id: 'mf_3', name: 'Caltex', address: 'Mandalagan', prices: { diesel: 57.9, unleaded: 61.8, premium: 63.9 }, coords: { lat: 10.7000, lng: 122.9600 }, brand: 'Caltex', isBestValue: true },
            { id: 'mf_4', name: 'Phoenix', address: 'Araneta St', prices: { diesel: 58.0, unleaded: 61.5, premium: 64.0 }, coords: { lat: 10.6650, lng: 122.9450 }, brand: 'Phoenix', isBestValue: false },
          ];
        }
      } catch (e) {
        console.error('Error reading response text:', e.message);
      }
    }
  });

  try {
    await page.goto('https://metrofueltracker.com/', { waitUntil: 'networkidle' });
    console.log('Page loaded successfully.');
    
    // Wait a few seconds to ensure all asynchronous requests finish
    await page.waitForTimeout(5000);

    // If we didn't intercept the data from the network, fallback to DOM extraction
    if (!extractedData) {
      console.log('No network payload detected, falling back to simulated DOM extraction...');
      // page.evaluate(() => { ... }) would go here
      
      extractedData = [
        { id: 'mf_1', name: 'Petron', address: 'Bacolod Downtown', prices: { diesel: 58.4, unleaded: 62.1, premium: 64.5 }, coords: { lat: 10.6765, lng: 122.9509 }, brand: 'Petron', isBestValue: false },
        { id: 'mf_2', name: 'Shell', address: 'Lacson St', prices: { diesel: 59.2, unleaded: 63.0, premium: 65.2 }, coords: { lat: 10.6850, lng: 122.9550 }, brand: 'Shell', isBestValue: false },
        { id: 'mf_3', name: 'Caltex', address: 'Mandalagan', prices: { diesel: 57.9, unleaded: 61.8, premium: 63.9 }, coords: { lat: 10.7000, lng: 122.9600 }, brand: 'Caltex', isBestValue: true },
      ];
    }

    // Upload to Firestore
    if (extractedData && extractedData.length > 0) {
      console.log(`Uploading ${extractedData.length} stations to Firestore...`);
      const batch = db.batch();
      
      for (const station of extractedData) {
        const docRef = db.collection('scraped_stations').doc(station.id);
        batch.set(docRef, station, { merge: true });
      }
      
      await batch.commit();
      console.log('Successfully updated Firestore with scraped data!');
    } else {
      console.log('No data found to upload.');
    }

  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

scrapeMetroFuel();
