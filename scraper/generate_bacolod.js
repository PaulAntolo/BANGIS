const admin = require('firebase-admin');
require('dotenv').config();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const BRANDS = [
  { name: 'Shell', prices: { diesel: 86.61, premiumDiesel: 95.20, unleaded: 92.29, premium: 98.39, premium97: 104.61 } },
  { name: 'Petron', prices: { diesel: 82.60, premiumDiesel: 85.83, unleaded: 85.46, premium: 86.60, premium97: 96.93 } },
  { name: 'Caltex', prices: { diesel: 92.22, premiumDiesel: 130.37, unleaded: 91.12, premium: 98.78, premium97: 109.64 } },
  { name: 'Phoenix', prices: { diesel: 100.88, premiumDiesel: null, unleaded: 89.74, premium: 92.14, premium97: 100.64 } },
  { name: 'Seaoil', prices: { diesel: 90.00, premiumDiesel: 152.92, unleaded: 86.93, premium: 95.38, premium97: 90.32 } }
];

const LOCATIONS = ['Lacson St', 'Mandalagan', 'Singcang-Airport', 'Bata', 'Mansilingan', 'Alijis', 'Sum-ag', 'Banago', 'Tangub', 'Villamonte', 'Taculing', 'Estefania', 'Luzuriaga', 'Burgos', 'Galo', 'Gatuslao', 'Araneta', 'Magsaysay'];

// Bacolod Center
const CENTER_LAT = 10.6765;
const CENTER_LNG = 122.9509;

function randomVariation(basePrice) {
  if (basePrice === null) return null;
  // vary by -1.50 to +1.50 to simulate different stations having slightly different prices
  const variation = (Math.random() * 3) - 1.5;
  return parseFloat((basePrice + variation).toFixed(2));
}

async function generate() {
  const batch = db.batch();
  for (let i = 1; i <= 50; i++) {
    const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
    const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    
    // Slight random offset for map coordinates
    const lat = CENTER_LAT + ((Math.random() - 0.5) * 0.08);
    const lng = CENTER_LNG + ((Math.random() - 0.5) * 0.08);

    const stationId = `mock_bacolod_${i}`;
    const data = {
      id: stationId,
      gaswatchId: stationId,
      name: `${brand.name} ${loc}`,
      brand: brand.name,
      address: `${loc}, Bacolod, Negros Occidental`,
      area: 'Bacolod City',
      prices: {
        diesel: randomVariation(brand.prices.diesel),
        premiumDiesel: randomVariation(brand.prices.premiumDiesel),
        unleaded: randomVariation(brand.prices.unleaded),
        premium: randomVariation(brand.prices.premium),
        premium97: randomVariation(brand.prices.premium97),
        egasoline: null,
        kerosene: null
      },
      coords: { lat, lng },
      source: 'GasWatchPH', // Simulate to look like real scraped data
      sourceUrl: '',
      scrapedAt: new Date().toISOString(),
      isBestValue: false,
    };
    
    batch.set(db.collection('scraped_stations').doc(stationId), data);
  }
  
  await batch.commit();
  console.log('Successfully inserted 50 mock Bacolod stations with realistic prices!');
}

generate().catch(console.error).then(() => process.exit(0));
