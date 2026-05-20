const admin = require('firebase-admin');
require('dotenv').config();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function clear() {
  const snap = await db.collection('scraped_stations').get();
  let count = 0;
  for (let i = 0; i < snap.docs.length; i += 450) {
    const chunk = snap.docs.slice(i, i + 450);
    const batch = db.batch();
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    count += chunk.length;
  }
  console.log(`Cleared ${count} documents from scraped_stations.`);
}

clear().catch(console.error).then(() => process.exit(0));
