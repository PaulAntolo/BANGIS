/**
 * Firestore Operations — Upsert stations & append price history.
 *
 * Collections:
 *   - `stations`: Unique per physical station (deterministic ID from coords).
 *     Upserted with merge so structural data updates but createdAt is preserved.
 *   - `price_history`: Append-only. A new doc every scrape cycle, linked by stationId.
 */

import * as crypto from 'crypto';
import { getDb } from '../config/firebase';
import { ScrapedStation } from '../types/station';
import { FieldValue } from 'firebase-admin/firestore';

// ── Constants ──────────────────────────────────────────────────────

const COLLECTION_STATIONS = 'stations';
const COLLECTION_PRICE_HISTORY = 'price_history';

/** Firestore batch write limit */
const BATCH_LIMIT = 500;

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Generates a deterministic document ID from station coordinates.
 * Ensures the same physical station always maps to the same Firestore doc,
 * regardless of name changes over time.
 *
 * Format: "mft_{md5(lat_lng)}" — prefixed to avoid collisions with other sources.
 */
function generateStationId(lat: number, lng: number): string {
  const coordKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
  const hash = crypto.createHash('md5').update(coordKey).digest('hex').substring(0, 12);
  return `mft_${hash}`;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Process an array of scraped stations:
 *   1. Upsert each into the `stations` collection
 *   2. Append a price snapshot to `price_history`
 *
 * Uses batched writes for efficiency (max 500 operations per batch).
 */
export async function processScrapedStations(
  stations: ScrapedStation[],
  dryRun: boolean
): Promise<void> {
  if (stations.length === 0) {
    console.log('[Firestore] No stations to process');
    return;
  }

  if (dryRun) {
    console.log('\n[Firestore] ── DRY RUN MODE ── No writes will be made\n');
    for (const station of stations) {
      const id = generateStationId(station.lat, station.lng);
      console.log(`  Station: ${station.name}`);
      console.log(`    ID:       ${id}`);
      console.log(`    Brand:    ${station.brand}`);
      console.log(`    City:     ${station.city}`);
      console.log(`    Coords:   ${station.lat}, ${station.lng}`);
      console.log(`    Diesel:   ${station.dieselPrice ?? 'N/A'}`);
      console.log(`    Gas:      ${station.gasPrice ?? 'N/A'}`);
      console.log(`    Premium:  ${station.premiumPrice ?? 'N/A'}`);
      console.log(`    Updated:  ${station.lastUpdated ?? 'N/A'}`);
      console.log('');
    }
    console.log(`[Firestore] DRY RUN complete — ${stations.length} stations would be written`);
    return;
  }

  const db = getDb();
  console.log(`[Firestore] Processing ${stations.length} stations...`);

  // Process in batches of BATCH_LIMIT / 2 (each station = 2 writes: station + price_history)
  const batchSize = Math.floor(BATCH_LIMIT / 2);
  let totalStationsWritten = 0;
  let totalPriceRecords = 0;

  for (let i = 0; i < stations.length; i += batchSize) {
    const chunk = stations.slice(i, i + batchSize);
    const batch = db.batch();

    for (const station of chunk) {
      const stationId = generateStationId(station.lat, station.lng);

      // ── Upsert station document ────────────────────────────────
      const stationRef = db.collection(COLLECTION_STATIONS).doc(stationId);
      batch.set(
        stationRef,
        {
          name: station.name,
          brand: station.brand,
          city: station.city,
          coordinates: {
            lat: station.lat,
            lng: station.lng,
          },
          source: 'MetroFuelTracker',
          updatedAt: FieldValue.serverTimestamp(),
          // createdAt only set if document doesn't exist yet (merge preserves it)
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // ── Append price history document ──────────────────────────
      const priceRef = db.collection(COLLECTION_PRICE_HISTORY).doc();
      batch.set(priceRef, {
        stationId,
        dieselPrice: station.dieselPrice,
        gasPrice: station.gasPrice,
        premiumPrice: station.premiumPrice,
        scrapedAt: FieldValue.serverTimestamp(),
        source: 'MetroFuelTracker',
      });

      totalStationsWritten++;
      totalPriceRecords++;
    }

    await batch.commit();
    console.log(
      `[Firestore] Batch ${Math.floor(i / batchSize) + 1} committed ` +
        `(${chunk.length} stations, ${chunk.length} price records)`
    );
  }

  console.log(
    `[Firestore] Done — ${totalStationsWritten} stations upserted, ` +
      `${totalPriceRecords} price_history records appended`
  );
}
