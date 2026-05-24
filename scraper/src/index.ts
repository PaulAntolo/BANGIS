/**
 * Bangis Scraper — Entry Point
 *
 * Modes:
 *   node dist/index.js            → Start cron scheduler (Sunday midnight)
 *   node dist/index.js --once     → Scrape once, write to Firestore, exit
 *   node dist/index.js --dry-run  → Scrape once, log to console, no writes
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from scraper root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import * as cron from 'node-cron';
import { scrapeMetroFuel } from './scraper/metroFuelScraper';
import { processScrapedStations } from './db/firestoreOps';

// ── CLI Flag Parsing ─────────────────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isOnce = args.includes('--once') || isDryRun;

// ── Scrape Execution ─────────────────────────────────────────────

async function runScrape(): Promise<void> {
  const startTime = Date.now();
  console.log('═'.repeat(60));
  console.log(`[Bangis] MetroFuelTracker Bacolod Scraper`);
  console.log(`[Bangis] Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`[Bangis] Started at: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  try {
    // Step 1: Scrape Stations
    const stations = await scrapeMetroFuel();

    if (stations.length === 0) {
      console.warn('[Bangis] ⚠ No Bacolod stations found! The site structure may have changed.');
      console.warn('[Bangis] Try running with --dry-run to debug the output.');
      return;
    }

    // Step 2: Persist
    await processScrapedStations(stations, isDryRun);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('═'.repeat(60));
    console.log(`[Bangis] ✓ Complete — ${stations.length} Bacolod stations processed in ${elapsed}s`);
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('[Bangis] ✗ Scrape failed:', error);
    throw error;
  }
}

// ── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (isOnce) {
    // Single execution mode
    await runScrape();
    process.exit(0);
  }

  // Cron mode — schedule weekly scrape every Sunday at midnight
  const CRON_SCHEDULE = '0 0 * * 0'; // Sunday at 00:00

  console.log('═'.repeat(60));
  console.log('[Bangis] MetroFuelTracker Bacolod Scraper — CRON MODE');
  console.log(`[Bangis] Schedule: ${CRON_SCHEDULE} (every Sunday at midnight)`);
  console.log(`[Bangis] Timezone: Asia/Manila`);
  console.log(`[Bangis] Started at: ${new Date().toISOString()}`);
  console.log('[Bangis] Waiting for next scheduled execution...');
  console.log('═'.repeat(60));

  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      console.log(`\n[Cron] Triggered at ${new Date().toISOString()}`);
      try {
        await runScrape();
      } catch (error) {
        console.error('[Cron] Scrape cycle failed:', error);
        // Don't crash the process — let the next cron cycle retry
      }
    },
    {
      timezone: 'Asia/Manila',
    }
  );
}

main().catch((error) => {
  console.error('[Bangis] Fatal error:', error);
  process.exit(1);
});
