const { chromium } = require('playwright');
const admin = require('firebase-admin');
require('dotenv').config();

const GASWATCH_URL = 'https://gaswatchph.com/';
const COLLECTION = 'scraped_stations';
const BATCH_SIZE = 450;

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      admin.initializeApp();
    }
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

function mapStation(raw) {
  const prices = raw.prices || {};
  const diesel = prices.diesel ?? null;
  const unleaded = prices.unleaded ?? null;
  const premium = prices.premium95 ?? prices.premium97 ?? null;

  if (!raw.lat || !raw.lng) return null;
  if (diesel == null && unleaded == null && premium == null) return null;

  return {
    id: `gw_${raw.id}`,
    gaswatchId: raw.id,
    name: raw.name,
    brand: raw.brand,
    address: `${raw.name}, ${raw.area}`,
    area: raw.area,
    prices: {
      diesel,
      unleaded,
      premium,
      premiumDiesel: prices.premiumDiesel ?? null,
      egasoline: prices.egasoline ?? null,
      premium97: prices.premium97 ?? null,
      kerosene: prices.kerosene ?? null,
    },
    coords: { lat: raw.lat, lng: raw.lng },
    source: 'GasWatchPH',
    sourceUrl: GASWATCH_URL,
    scrapedAt: new Date().toISOString(),
    isBestValue: false,
  };
}

async function scrapeGasWatchPh(browser) {
  console.log('Starting GasWatch PH scraper...');
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    await page.goto(GASWATCH_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForFunction(
      () => window._tableAllStations && window._tableAllStations.length > 500,
      { timeout: 90000 }
    );

    const payload = await page.evaluate(() => {
      const brands = window.BRANDS || {};
      const lastUpdated =
        typeof LAST_UPDATED !== 'undefined' ? LAST_UPDATED : window.LAST_UPDATED || null;
      const stations = window._tableAllStations || [];

      return {
        lastUpdated,
        stationCount: stations.length,
        stations: stations.map((s) => {
          const brandInfo = brands[s.brand];
          const brandName =
            brandInfo?.name || (s.brand ? s.brand.charAt(0).toUpperCase() + s.brand.slice(1) : 'Unknown');

          return {
            id: s.id,
            name: s.name,
            brand: brandName,
            area: s.area,
            lat: s.lat,
            lng: s.lng,
            prices: s.prices || {},
          };
        }),
      };
    });

    console.log(
      `GasWatch PH: ${payload.stationCount} stations loaded (site last updated: ${payload.lastUpdated || 'unknown'})`
    );

    const mapped = payload.stations.map(mapStation).filter(Boolean);
    console.log(`Mapped ${mapped.length} stations with valid coords and prices.`);
    return { stations: mapped, lastUpdated: payload.lastUpdated };
  } catch (error) {
    console.error('GasWatch PH scraping failed:', error);
    return { stations: [], lastUpdated: null };
  } finally {
    await page.close();
    await context.close();
  }
}

async function removeLegacyStations() {
  const snap = await db.collection(COLLECTION).get();
  const legacy = snap.docs.filter((d) => !d.id.startsWith('gw_'));
  if (!legacy.length) return;

  console.log(`Removing ${legacy.length} legacy station docs...`);
  for (let i = 0; i < legacy.length; i += BATCH_SIZE) {
    const batch = db.batch();
    legacy.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function uploadToFirestore(stations, meta) {
  if (!stations.length) {
    console.log('No stations to upload.');
    return;
  }

  await removeLegacyStations();

  console.log(`Uploading ${stations.length} stations to Firestore (${COLLECTION})...`);

  for (let i = 0; i < stations.length; i += BATCH_SIZE) {
    const chunk = stations.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const station of chunk) {
      batch.set(db.collection(COLLECTION).doc(station.id), station, { merge: true });
    }

    await batch.commit();
    console.log(`  Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} docs)`);
  }

  await db.collection('scrape_meta').doc('gaswatchph').set(
    {
      source: 'GasWatchPH',
      sourceUrl: GASWATCH_URL,
      lastUpdated: meta.lastUpdated,
      stationCount: stations.length,
      scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log('Successfully updated Firestore with GasWatch PH data.');
}

async function runScraper() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? 'DRY RUN — will not write to Firestore' : 'Live run — writing to Firestore');

  const browser = await chromium.launch({ headless: true });

  try {
    const { stations, lastUpdated } = await scrapeGasWatchPh(browser);

    if (dryRun) {
      console.log('Sample station:', JSON.stringify(stations[0], null, 2));
      console.log(`Total: ${stations.length}`);
      return;
    }

    await uploadToFirestore(stations, { lastUpdated });
  } catch (error) {
    console.error('Scraper failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    process.exit(process.exitCode || 0);
  }
}

runScraper();
