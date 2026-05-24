/**
 * MetroFuelTracker Scraper — Bacolod Only
 *
 * Uses Playwright (Chromium headless) to load metrofueltracker.com,
 * intercepts network responses containing station data, and filters
 * to Bacolod gas stations.
 *
 * Strategy (multi-layered):
 *   1. Navigate to /?city=bacolod-city to trigger Bacolod data loading
 *   2. Intercept /api/stations responses (coordinates + station metadata)
 *   3. Load prices pages to capture RSC payloads with price data
 *   4. Intercept RSC flight payloads for embedded station JSON arrays
 *   5. Fallback: Evaluate DOM/window state for any station data in JS globals
 *   6. Parse structured data from /prices/bacolod-city SSR page (last resort)
 */

import { chromium, Browser, Page, Response, Request, APIRequestContext } from 'playwright';
import { ScrapedStation } from '../types/station';

// ── Bacolod Bounding Box ───────────────────────────────────────────
const BACOLOD_BOUNDS = {
  minLat: 10.55,
  maxLat: 10.80,
  minLng: 122.85,
  maxLng: 123.05,
};

const TARGET_URL = 'https://metrofueltracker.com/';
const BACOLOD_MAP_URL = 'https://metrofueltracker.com/?city=bacolod-city';
const BACOLOD_PRICES_URL = 'https://metrofueltracker.com/prices/bacolod-city';
const BACOLOD_PRICES_PROVINCE_URL = 'https://metrofueltracker.com/prices/province/metro-bacolod';
const BACOLOD_API_BOUNDS: Bounds = {
  south: 10.5799,
  west: 122.8092,
  north: 10.7356,
  east: 123.1444,
};

type FuelType = 'DIESEL' | 'UNLEADED_91' | 'PREMIUM_95';
type Coordinates = { lat: number; lng: number };
type Bounds = { south: number; west: number; north: number; east: number };

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Checks if a coordinate falls within the Bacolod bounding box.
 */
function isInBacolod(lat: number, lng: number): boolean {
  return (
    lat >= BACOLOD_BOUNDS.minLat &&
    lat <= BACOLOD_BOUNDS.maxLat &&
    lng >= BACOLOD_BOUNDS.minLng &&
    lng <= BACOLOD_BOUNDS.maxLng
  );
}

/**
 * Checks if a city/area/address string references Bacolod.
 */
function isBacolodText(text: string): boolean {
  return /bacolod/i.test(text);
}

/**
 * Attempts to extract a numeric price from a value.
 * Returns null if the value is not a valid price.
 */
function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === 'N/A') {
    return null;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) || num <= 0 ? null : num;
}

function extractNestedPrice(value: unknown): number | null {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return parsePrice(obj.price ?? obj.value ?? obj.amount ?? obj.pricePerLiter);
  }
  return parsePrice(value);
}

/**
 * Inspects a JSON payload looking for an array of station-like objects.
 * Returns true if the payload looks like it contains station data.
 */
function looksLikeStationArray(data: unknown): data is Record<string, unknown>[] {
  if (!Array.isArray(data) || data.length === 0) return false;

  // Sample the first few items — they should have lat/lng-like fields
  const sample = data.slice(0, Math.min(5, data.length));
  return sample.some((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const obj = item as Record<string, unknown>;

    // Check for coordinate-like fields
    const hasCoords =
      (typeof obj.lat === 'number' && typeof obj.lng === 'number') ||
      (typeof obj.latitude === 'number' && typeof obj.longitude === 'number') ||
      (typeof obj.coords === 'object' && obj.coords !== null) ||
      (typeof obj.position === 'object' && obj.position !== null) ||
      (typeof obj.location === 'object' && obj.location !== null) ||
      (typeof obj.x === 'number' && typeof obj.y === 'number');

    // Check for price-like fields
    const hasPriceHint =
      obj.price !== undefined ||
      obj.prices !== undefined ||
      obj.diesel !== undefined ||
      obj.gasoline !== undefined ||
      obj.unleaded !== undefined ||
      obj.dieselPrice !== undefined ||
      obj.d !== undefined ||  // MetroFuel sometimes uses abbreviated keys
      obj.u !== undefined;

    // Check for station-like fields
    const hasStationHint =
      obj.name !== undefined ||
      obj.stationName !== undefined ||
      obj.station_name !== undefined ||
      obj.brand !== undefined ||
      obj.brandName !== undefined ||
      obj.n !== undefined ||   // MetroFuel abbreviated
      obj.stationId !== undefined ||
      obj.id !== undefined;

    return hasCoords || (hasPriceHint && hasStationHint);
  });
}

/**
 * Recursively searches a nested object/array for station-like arrays.
 */
function findStationArrays(data: unknown, depth = 0): Record<string, unknown>[][] {
  if (depth > 10) return [];
  const results: Record<string, unknown>[][] = [];

  if (Array.isArray(data)) {
    if (looksLikeStationArray(data)) {
      results.push(data as Record<string, unknown>[]);
    }
    for (const item of data) {
      results.push(...findStationArrays(item, depth + 1));
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const value of Object.values(data as Record<string, unknown>)) {
      results.push(...findStationArrays(value, depth + 1));
    }
  }

  return results;
}

/**
 * Extracts JSON objects/arrays from a raw text string.
 * Handles RSC flight payloads by finding balanced JSON structures.
 */
function extractJsonFromText(text: string): unknown[] {
  const results: unknown[] = [];
  const startChars = ['{', '['];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!startChars.includes(ch)) continue;

    const endChar = ch === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;
    let j = i;

    for (; j < text.length; j++) {
      const c = text[j];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (c === '\\') {
        escaped = true;
        continue;
      }

      if (c === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (c === ch) depth++;
      if (c === endChar) {
        depth--;
        if (depth === 0) break;
      }
    }

    if (depth === 0 && j - i > 20) {
      const candidate = text.substring(i, j + 1);
      try {
        const parsed = JSON.parse(candidate);
        results.push(parsed);
        i = j; // Skip past this JSON
      } catch {
        // Not valid JSON — continue
      }
    }
  }

  return results;
}

async function fetchRscStations(
  request: APIRequestContext,
  url: string,
  stationStore: Map<string, Record<string, unknown>>
): Promise<number> {
  const rscUrl = new URL(url);
  rscUrl.searchParams.set('_rsc', `scrape_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);

  const response = await request.get(rscUrl.toString(), {
    headers: {
      accept: 'text/x-component,*/*',
    },
  });

  if (!response.ok()) {
    console.warn(`[Scraper] RSC request failed (${response.status()}) for ${rscUrl.toString()}`);
    return 0;
  }

  const text = await response.text();
  const extracted = extractJsonFromText(text);
  let mergedCount = 0;

  for (const item of extracted) {
    const arrays = findStationArrays(item);
    for (const arr of arrays) {
      if (arr.length >= 1) {
        for (const station of arr) {
          mergeStationRecord(stationStore, station);
          mergedCount += 1;
        }
      }
    }
  }

  return mergedCount;
}

async function fetchStationsByFuelType(
  request: APIRequestContext,
  bounds: Bounds,
  fuelType: FuelType,
  stationStore: Map<string, Record<string, unknown>>
): Promise<number> {
  const apiUrl = new URL('https://metrofueltracker.com/api/stations');
  apiUrl.searchParams.set('fuelType', fuelType);
  apiUrl.searchParams.set('south', String(bounds.south));
  apiUrl.searchParams.set('west', String(bounds.west));
  apiUrl.searchParams.set('north', String(bounds.north));
  apiUrl.searchParams.set('east', String(bounds.east));

  const response = await request.get(apiUrl.toString(), {
    headers: { accept: 'application/json' },
  });

  if (!response.ok()) {
    console.warn(`[Scraper] API request failed (${response.status()}) for ${apiUrl.toString()}`);
    return 0;
  }

  const body = (await response.json()) as Record<string, unknown>;
  const stations = Array.isArray(body?.stations)
    ? (body.stations as Record<string, unknown>[])
    : Array.isArray(body)
      ? (body as Record<string, unknown>[])
      : [];

  for (const station of stations) {
    mergeStationRecord(stationStore, station, { fuelType });
  }

  return stations.length;
}

/**
 * Normalizes a raw station object (unknown shape) into a ScrapedStation.
 * Handles various field naming conventions from different API responses,
 * including MetroFuel's abbreviated key format.
 */
function extractCoordinates(raw: Record<string, unknown>): Coordinates | null {
  let lat: number | undefined;
  let lng: number | undefined;

  if (typeof raw.lat === 'number' && typeof raw.lng === 'number') {
    lat = raw.lat;
    lng = raw.lng;
  } else if (typeof raw.latitude === 'number' && typeof raw.longitude === 'number') {
    lat = raw.latitude;
    lng = raw.longitude;
  } else if (typeof raw.y === 'number' && typeof raw.x === 'number') {
    // Some map libraries use x/y
    lat = raw.y;
    lng = raw.x;
  } else if (typeof raw.coords === 'object' && raw.coords !== null) {
    const coords = raw.coords as Record<string, unknown>;
    lat = typeof coords.lat === 'number' ? coords.lat : undefined;
    lng = typeof coords.lng === 'number' ? coords.lng : (typeof coords.lon === 'number' ? coords.lon : undefined);
  } else if (typeof raw.position === 'object' && raw.position !== null) {
    const pos = raw.position as Record<string, unknown>;
    lat = typeof pos.lat === 'number' ? pos.lat : undefined;
    lng = typeof pos.lng === 'number' ? pos.lng : (typeof pos.lon === 'number' ? pos.lon : undefined);
  } else if (typeof raw.location === 'object' && raw.location !== null) {
    const loc = raw.location as Record<string, unknown>;
    lat = typeof loc.lat === 'number' ? loc.lat : undefined;
    lng = typeof loc.lng === 'number' ? loc.lng : (typeof loc.lon === 'number' ? loc.lon : undefined);
  } else if (typeof raw.coordinates === 'object' && raw.coordinates !== null) {
    const coord = raw.coordinates as Record<string, unknown>;
    lat = typeof coord.lat === 'number' ? coord.lat : (typeof coord.latitude === 'number' ? coord.latitude : undefined);
    lng = typeof coord.lng === 'number' ? coord.lng : (typeof coord.longitude === 'number' ? coord.longitude : undefined);
  }

  // Try parsing string coordinate values
  if (lat === undefined && typeof raw.lat === 'string') {
    const parsed = parseFloat(raw.lat);
    if (!isNaN(parsed)) lat = parsed;
  }
  if (lng === undefined && typeof raw.lng === 'string') {
    const parsed = parseFloat(raw.lng);
    if (!isNaN(parsed)) lng = parsed;
  }

  if (lat === undefined || lng === undefined) return null;
  return { lat, lng };
}

function normalizeStation(raw: Record<string, unknown>): ScrapedStation | null {
  const coords = extractCoordinates(raw);
  if (!coords) return null;
  const { lat, lng } = coords;

  // Extract name
  const name = String(
    raw.name || raw.stationName || raw.station_name || raw.title || raw.label || raw.n || 'Unknown Station'
  );

  // Extract brand
  const brand = String(raw.brand || raw.brandName || raw.brand_name || raw.company || raw.b || '');

  // Extract city/area
  const city = String(
    raw.city || raw.area || raw.region || raw.address || raw.location_name || raw.c || ''
  );

  // Extract address if available
  const address = String(raw.address || raw.addr || raw.a || '');

  // Extract prices — handle both flat and nested structures
  let dieselPrice: number | null = null;
  let gasPrice: number | null = null;
  let premiumPrice: number | null = null;

  if (typeof raw.prices === 'object' && raw.prices !== null) {
    const prices = raw.prices as Record<string, unknown>;
    dieselPrice = extractNestedPrice(
      prices.diesel ??
        prices.dieselPrice ??
        prices.Diesel ??
        prices.DIESEL ??
        prices.PREMIUM_DIESEL ??
        prices.d
    );
    gasPrice = extractNestedPrice(
      prices.unleaded ?? prices.gasoline ?? prices.regular ?? prices.gasPrice ?? prices.gas ??
      prices.Unleaded ?? prices.Regular ?? prices.unleaded91 ?? prices.u ?? prices.u91 ??
      prices.UNLEADED ?? prices.UNLEADED_91 ?? prices.GASOLINE ?? prices.REGULAR
    );
    premiumPrice = extractNestedPrice(
      prices.premium ?? prices.premiumPrice ?? prices.Premium ??
      prices.premium95 ?? prices.p ?? prices.p95 ??
      prices.PREMIUM ?? prices.PREMIUM_95 ?? prices.PREMIUM_98
    );
  }

  dieselPrice ??= extractNestedPrice(raw.diesel ?? raw.dieselPrice ?? raw.diesel_price ?? raw.d);
  gasPrice ??= extractNestedPrice(
    raw.unleaded ?? raw.gasoline ?? raw.gasPrice ?? raw.gas_price ?? raw.gas ??
    raw.regular ?? raw.unleaded91 ?? raw.u ?? raw.u91
  );
  premiumPrice ??= extractNestedPrice(
    raw.premium ?? raw.premiumPrice ?? raw.premium_price ??
    raw.premium95 ?? raw.p ?? raw.p95
  );

  // Extract last updated timestamp
  const lastUpdated = raw.updatedAt
    ? String(raw.updatedAt)
    : raw.lastUpdated
      ? String(raw.lastUpdated)
      : raw.updated_at
        ? String(raw.updated_at)
        : raw.timestamp
          ? String(raw.timestamp)
          : raw.t
            ? String(raw.t)
            : null;

  return {
    name,
    brand,
    city: city || address,
    lat,
    lng,
    dieselPrice,
    gasPrice,
    premiumPrice,
    lastUpdated,
  };
}

function normalizeFuelType(value: string | null | undefined): FuelType | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === 'DIESEL' || upper === 'PREMIUM_DIESEL') return 'DIESEL';
  if (upper === 'UNLEADED' || upper === 'GASOLINE' || upper === 'REGULAR' || upper === 'UNLEADED_91') return 'UNLEADED_91';
  if (upper === 'PREMIUM' || upper === 'PREMIUM_95' || upper === 'PREMIUM_98') return 'PREMIUM_95';
  return null;
}

function fuelTypeToPriceKey(fuelType: FuelType): 'diesel' | 'unleaded' | 'premium' {
  switch (fuelType) {
    case 'DIESEL':
      return 'diesel';
    case 'PREMIUM_95':
      return 'premium';
    default:
      return 'unleaded';
  }
}

function extractPriceValue(raw: Record<string, unknown>): number | null {
  return extractNestedPrice(
    raw.price ??
      raw.pricePerLiter ??
      raw.price_php ??
      raw.value ??
      raw.amount ??
      (typeof raw.prices === 'object' && raw.prices !== null
        ? (raw.prices as Record<string, unknown>).price
        : undefined)
  );
}

function extractFuelTypeFromUrl(url: string): FuelType | null {
  try {
    const parsed = new URL(url);
    return normalizeFuelType(parsed.searchParams.get('fuelType'));
  } catch {
    return null;
  }
}

function extractBoundsFromUrl(url: string): Bounds | null {
  try {
    const parsed = new URL(url);
    const south = parseFloat(parsed.searchParams.get('south') ?? '');
    const west = parseFloat(parsed.searchParams.get('west') ?? '');
    const north = parseFloat(parsed.searchParams.get('north') ?? '');
    const east = parseFloat(parsed.searchParams.get('east') ?? '');
    if ([south, west, north, east].some((v) => Number.isNaN(v))) {
      return null;
    }
    return { south, west, north, east };
  } catch {
    return null;
  }
}

function getStationKey(raw: Record<string, unknown>): string | null {
  const idValue = raw.id ?? raw.stationId ?? raw.station_id ?? raw.sid;
  if (typeof idValue === 'string' || typeof idValue === 'number') {
    return `id:${String(idValue)}`;
  }

  const coords = extractCoordinates(raw);
  if (coords) {
    return `coord:${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`;
  }

  const nameValue = raw.name ?? raw.stationName ?? raw.station_name ?? raw.title ?? raw.label ?? raw.n;
  const brandValue = raw.brand ?? raw.brandName ?? raw.brand_name ?? raw.company ?? raw.b ?? '';
  if (nameValue) {
    return `name:${String(nameValue).toLowerCase()}|${String(brandValue).toLowerCase()}`;
  }

  return null;
}

function mergeStationRecord(
  stationStore: Map<string, Record<string, unknown>>,
  raw: Record<string, unknown>,
  context?: { fuelType?: FuelType }
): void {
  const key = getStationKey(raw);
  if (!key) return;

  const existing = stationStore.get(key) ?? {};
  const merged: Record<string, unknown> = { ...existing, ...raw };

  const existingPrices =
    typeof existing.prices === 'object' && existing.prices !== null
      ? { ...(existing.prices as Record<string, unknown>) }
      : {};
  const rawPrices =
    typeof raw.prices === 'object' && raw.prices !== null
      ? { ...(raw.prices as Record<string, unknown>) }
      : {};
  const mergedPrices: Record<string, unknown> = { ...existingPrices, ...rawPrices };

  const dieselCandidate =
    mergedPrices.DIESEL ??
    mergedPrices.PREMIUM_DIESEL ??
    mergedPrices.diesel;
  const dieselValue = extractNestedPrice(dieselCandidate);
  if (dieselValue !== null) {
    mergedPrices.diesel = dieselValue;
  }

  const unleadedCandidate =
    mergedPrices.UNLEADED ??
    mergedPrices.UNLEADED_91 ??
    mergedPrices.GASOLINE ??
    mergedPrices.REGULAR ??
    mergedPrices.unleaded ??
    mergedPrices.gasoline ??
    mergedPrices.gas ??
    mergedPrices.gasPrice ??
    mergedPrices.regular;
  const unleadedValue = extractNestedPrice(unleadedCandidate);
  if (unleadedValue !== null) {
    mergedPrices.unleaded = unleadedValue;
  }

  const premiumCandidate =
    mergedPrices.PREMIUM ??
    mergedPrices.PREMIUM_95 ??
    mergedPrices.PREMIUM_98 ??
    mergedPrices.premium;
  const premiumValue = extractNestedPrice(premiumCandidate);
  if (premiumValue !== null) {
    mergedPrices.premium = premiumValue;
  }

  const fuelType = context?.fuelType ?? normalizeFuelType(String(raw.fuelType ?? raw.fuel ?? raw.type ?? ''));
  const priceValue = extractPriceValue(raw);
  if (fuelType && priceValue !== null) {
    mergedPrices[fuelTypeToPriceKey(fuelType)] = priceValue;
  }

  if (Object.keys(mergedPrices).length > 0) {
    merged.prices = mergedPrices;
  }

  stationStore.set(key, merged);
}

/**
 * Filters an array of normalized stations to only those in Bacolod.
 */
function filterToBacolod(stations: ScrapedStation[]): ScrapedStation[] {
  return stations.filter((s) => {
    const inBounds = isInBacolod(s.lat, s.lng);
    const nameMatch = isBacolodText(s.city) || isBacolodText(s.name);
    return inBounds || nameMatch;
  });
}

// ── Main Scraper ───────────────────────────────────────────────────

/**
 * Scrapes MetroFuelTracker.com and returns Bacolod gas stations.
 */
export async function scrapeMetroFuel(): Promise<ScrapedStation[]> {
  console.log('[Scraper] Launching Chromium headless...');

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-PH',
    timezoneId: 'Asia/Manila',
  });

  const page: Page = await context.newPage();

  // ── Network Interception ───────────────────────────────────────
  const interceptedStations: Record<string, unknown>[][] = [];
  const stationStore = new Map<string, Record<string, unknown>>();
  let apiResponseCaptured = false;
  let lastBounds: Bounds | null = null;

  // Listen for both requests and responses to capture /api/stations
  page.on('response', async (response: Response) => {
    const url = response.url();
    const request: Request = response.request();
    const fuelTypeFromUrl = extractFuelTypeFromUrl(url) ?? undefined;
    const contentType = response.headers()['content-type'] || '';

    // Skip non-data responses (images, fonts, CSS, map tiles, etc.)
    if (
      contentType.includes('image/') ||
      contentType.includes('font/') ||
      contentType.includes('text/css') ||
      url.includes('.pmtiles') ||
      url.includes('.pbf') ||
      url.includes('.png') ||
      url.includes('.jpg') ||
      url.includes('.woff') ||
      url.includes('.svg')
    ) {
      return;
    }

    try {
      // ── Strategy 1: Intercept /api/stations responses ──────────
      if (url.includes('/api/stations') || url.includes('/api/prices')) {
        console.log(`[Scraper] 🎯 Intercepted API call: ${request.method()} ${url}`);
        try {
          if (url.includes('/api/stations')) {
            const bounds = extractBoundsFromUrl(url);
            if (bounds) {
              lastBounds = bounds;
            }
          }
          const body = await response.json();
          console.log(`[Scraper]   Response type: ${typeof body}, keys: ${typeof body === 'object' ? Object.keys(body as Record<string, unknown>).slice(0, 10).join(', ') : 'N/A'}`);

          const arrays = findStationArrays(body);
          for (const arr of arrays) {
            if (arr.length >= 1) {
              console.log(`[Scraper]   Found ${arr.length} station-like objects in API response`);
              interceptedStations.push(arr);
              apiResponseCaptured = true;
              for (const item of arr) {
                mergeStationRecord(stationStore, item, { fuelType: fuelTypeFromUrl });
              }
            }
          }

          // If the response itself is an array
          if (Array.isArray(body) && body.length > 0) {
            console.log(`[Scraper]   Direct array response: ${body.length} items`);
            interceptedStations.push(body as Record<string, unknown>[]);
            apiResponseCaptured = true;
            for (const item of body as Record<string, unknown>[]) {
              mergeStationRecord(stationStore, item, { fuelType: fuelTypeFromUrl });
            }
          }
        } catch (e) {
          // Try as text (might be NDJSON or custom format)
          try {
            const text = await response.text();
            console.log(`[Scraper]   API response is text (${text.length} chars), attempting JSON extraction`);
            const extracted = extractJsonFromText(text);
            for (const item of extracted) {
              const arrays = findStationArrays(item);
              for (const arr of arrays) {
                if (arr.length >= 1) {
                  console.log(`[Scraper]   Extracted ${arr.length} stations from text response`);
                  interceptedStations.push(arr);
                  apiResponseCaptured = true;
                  for (const item of arr) {
                    mergeStationRecord(stationStore, item, { fuelType: fuelTypeFromUrl });
                  }
                }
              }
            }
          } catch {
            // Skip
          }
        }
        return;
      }

      // ── Strategy 2: Handle JSON responses ──────────────────────
      if (contentType.includes('application/json') || contentType.includes('text/json')) {
        const body = await response.json();
        const arrays = findStationArrays(body);
        for (const arr of arrays) {
          if (arr.length >= 3) {
            console.log(`[Scraper] Intercepted JSON with ${arr.length} station-like objects from ${url}`);
            interceptedStations.push(arr);
            for (const item of arr) {
              mergeStationRecord(stationStore, item);
            }
          }
        }
        return;
      }

      // ── Strategy 3: Handle Next.js RSC flight responses ────────
      if (
        contentType.includes('text/x-component') ||
        contentType.includes('text/plain') ||
        url.includes('_rsc') ||
        url.includes('__next') ||
        url.includes('_next/data')
      ) {
        const text = await response.text();

        // RSC payloads contain serialized React trees with embedded data
        // Look for JSON structures in the payload
        const extracted = extractJsonFromText(text);
        for (const item of extracted) {
          const arrays = findStationArrays(item);
          for (const arr of arrays) {
            if (arr.length >= 3) {
              console.log(`[Scraper] Intercepted RSC payload with ${arr.length} stations from ${url}`);
              interceptedStations.push(arr);
              for (const item of arr) {
                mergeStationRecord(stationStore, item);
              }
            }
          }
        }

        // Also try regex-based extraction for deeply embedded station data
        const jsonMatches = text.match(/\[[\s\S]*?\{[\s\S]*?"(?:lat|lng|latitude|longitude|coords|prices?|diesel|brand)"[\s\S]*?\}[\s\S]*?\]/g);
        if (jsonMatches) {
          for (const match of jsonMatches) {
            try {
              const parsed = JSON.parse(match);
              const arrays = findStationArrays(parsed);
              for (const arr of arrays) {
                if (arr.length >= 3) {
                  console.log(`[Scraper] Regex-extracted RSC payload with ${arr.length} stations from ${url}`);
                  interceptedStations.push(arr);
                  for (const item of arr) {
                    mergeStationRecord(stationStore, item);
                  }
                }
              }
            } catch {
              // Not valid JSON — skip
            }
          }
        }
        return;
      }
    } catch {
      // Response body not readable (e.g., aborted) — skip silently
    }
  });

  // ── Navigate to Bacolod Map ────────────────────────────────────
  console.log(`[Scraper] Navigating to ${BACOLOD_MAP_URL}...`);

  try {
    await page.goto(BACOLOD_MAP_URL, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });
  } catch (err) {
    console.warn('[Scraper] Navigation timeout — continuing with partial data...');
  }

  // Wait for map data to fully load (map tiles + station API calls)
  console.log('[Scraper] Waiting for map data to fully load...');
  await page.waitForTimeout(10_000);

  // ── If no API data yet, try interacting with the map ───────────
  if (!apiResponseCaptured) {
    console.log('[Scraper] No API data captured yet. Trying map interaction...');

    // Try zooming to trigger data loading
    try {
      // Look for a zoom control or map container
      const mapContainer = page.locator('div[class*="map"], canvas, div[class*="leaflet"], div[class*="maplibre"], div[class*="mapbox"]').first();
      if (await mapContainer.isVisible({ timeout: 5_000 })) {
        console.log('[Scraper] Found map container, scrolling to trigger data load...');
        await mapContainer.click();
        await page.waitForTimeout(2_000);

        // Try mouse wheel zoom
        await mapContainer.evaluate((el: HTMLElement) => {
          el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
        });
        await page.waitForTimeout(3_000);
      }
    } catch {
      console.log('[Scraper] Map interaction skipped');
    }

    // Try clicking fuel type tabs to trigger network requests for other fuel types
    console.log('[Scraper] Attempting to click fuel type tabs...');
    try {
      for (const tabText of ['Unleaded', 'Premium', 'Diesel', 'Gasoline', 'Regular']) {
        const tab = page.locator(`button:has-text("${tabText}"), a:has-text("${tabText}"), div:has-text("${tabText}")`).last();
        if (await tab.isVisible({ timeout: 2_000 })) {
          console.log(`[Scraper] Clicking tab: ${tabText}`);
          try {
            await tab.click({ force: true, timeout: 2_000 });
            await page.waitForTimeout(2_000); // Wait for the API response
          } catch {
            // ignore click errors
          }
        }
      }
    } catch {
      console.log('[Scraper] Fuel tabs interaction skipped');
    }

    // Try searching for Bacolod via the search UI
    console.log('[Scraper] Attempting to search for Bacolod via UI...');
    try {
      const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="city" i], input[placeholder*="find" i], input[type="search"]').first();

      if (await searchInput.isVisible({ timeout: 5_000 })) {
        await searchInput.click();
        await searchInput.fill('Bacolod');
        await page.waitForTimeout(2_000);

        // Try to click a Bacolod result if a dropdown appears
        const bacolodOption = page.locator('text=/Bacolod/i').first();
        if (await bacolodOption.isVisible({ timeout: 3_000 })) {
          await bacolodOption.click();
          console.log('[Scraper] Selected Bacolod from search results');
          await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
          await page.waitForTimeout(5_000);
        }
      }
    } catch {
      console.log('[Scraper] Search interaction skipped — will filter by coordinates');
    }
  }

  // ── Load price pages via RSC payloads to capture price data ───────
  console.log('[Scraper] Loading price pages for price data...');
  for (const priceUrl of [BACOLOD_PRICES_URL, BACOLOD_PRICES_PROVINCE_URL]) {
    try {
      const mergedCount = await fetchRscStations(context.request, priceUrl, stationStore);
      console.log(`[Scraper] RSC price payload merged ${mergedCount} entries from ${priceUrl}`);
    } catch (err) {
      console.warn(`[Scraper] RSC price fetch failed for ${priceUrl}:`, err);
    }
  }

  // ── Fetch all fuel types directly from the API ───────────────────
  const apiBounds = lastBounds ?? BACOLOD_API_BOUNDS;
  console.log('[Scraper] Fetching stations for all fuel types...');
  for (const fuelType of ['DIESEL', 'UNLEADED_91', 'PREMIUM_95'] as const) {
    try {
      const count = await fetchStationsByFuelType(context.request, apiBounds, fuelType, stationStore);
      console.log(`[Scraper] API merged ${count} stations for ${fuelType}`);
    } catch (err) {
      console.warn(`[Scraper] API fetch failed for ${fuelType}:`, err);
    }
  }

  // ── If still no data, navigate to main page and wait ───────────
  if (interceptedStations.length === 0) {
    console.log('[Scraper] No stations intercepted yet. Trying main map page...');
    try {
      await page.goto(TARGET_URL, {
        waitUntil: 'networkidle',
        timeout: 60_000,
      });
      await page.waitForTimeout(10_000);
    } catch {
      console.warn('[Scraper] Main page navigation timeout');
    }
  }

  // ── Evaluate DOM/Window State as Fallback ──────────────────────
  let domStations: Record<string, unknown>[] = [];

  try {
    domStations = await page.evaluate(() => {
      // Check common patterns for storing station data in window globals
      const win = window as unknown as Record<string, unknown>;
      const candidates = [
        win._stations,
        win._allStations,
        win._tableAllStations,
        win.stationData,
        win.__stations,
        win.mapData,
        win.stations,
        win.allStations,
      ];

      // Check __NEXT_DATA__ for embedded props
      const nextData = win.__NEXT_DATA__ as Record<string, unknown> | undefined;
      if (nextData) {
        candidates.push(nextData);
        if (typeof nextData.props === 'object' && nextData.props !== null) {
          candidates.push(nextData.props);
        }
      }

      // Try to find data in React fiber tree
      try {
        const rootEl = document.getElementById('__next');
        if (rootEl) {
          const rootElRecord = rootEl as unknown as Record<string, unknown>;
          const fiberKey = Object.keys(rootElRecord).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
          if (fiberKey) {
            let fiber = rootElRecord[fiberKey] as Record<string, unknown> | null;
            const visited = new Set<unknown>();
            let maxIter = 200;

            while (fiber && maxIter-- > 0) {
              if (visited.has(fiber)) break;
              visited.add(fiber);

              // Check memoizedState and memoizedProps
              const state = fiber.memoizedState as Record<string, unknown> | null;
              const props = fiber.memoizedProps as Record<string, unknown> | null;

              for (const container of [state, props]) {
                if (container && typeof container === 'object') {
                  for (const val of Object.values(container)) {
                    if (Array.isArray(val) && val.length > 5) {
                      const sample = val[0];
                      if (sample && typeof sample === 'object' && ('lat' in sample || 'lng' in sample || 'brand' in sample)) {
                        return val as Record<string, unknown>[];
                      }
                    }
                  }
                }
              }

              fiber = (fiber.child || fiber.return || fiber.sibling) as Record<string, unknown> | null;
            }
          }
        }
      } catch {
        // React fiber traversal failed — continue
      }

      for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
          return candidate as Record<string, unknown>[];
        }
        if (typeof candidate === 'object' && candidate !== null) {
          // Search nested objects for arrays
          const values = Object.values(candidate as Record<string, unknown>);
          for (const val of values) {
            if (Array.isArray(val) && val.length > 0) {
              return val as Record<string, unknown>[];
            }
            if (typeof val === 'object' && val !== null) {
              const nested = Object.values(val as Record<string, unknown>);
              for (const nv of nested) {
                if (Array.isArray(nv) && nv.length > 0) {
                  return nv as Record<string, unknown>[];
                }
                // One more level deep
                if (typeof nv === 'object' && nv !== null) {
                  const deep = Object.values(nv as Record<string, unknown>);
                  for (const dv of deep) {
                    if (Array.isArray(dv) && dv.length > 0) {
                      return dv as Record<string, unknown>[];
                    }
                  }
                }
              }
            }
          }
        }
      }

      return [];
    });

    if (domStations.length > 0) {
      console.log(`[Scraper] Found ${domStations.length} stations in DOM/window state`);
      for (const station of domStations) {
        mergeStationRecord(stationStore, station);
      }
    }
  } catch (err) {
    console.log('[Scraper] DOM evaluation failed:', err);
  }

  // ── Strategy 5: Parse SSR page as last resort ──────────────────
  if (interceptedStations.length === 0 && domStations.length === 0) {
    console.log('[Scraper] All dynamic strategies failed. Trying SSR prices page...');
    try {
      await page.goto(BACOLOD_PRICES_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await page.waitForTimeout(3_000);

      // Extract station names and brands from the HTML
      // The prices page has station listings in the DOM
      const ssrStations = await page.evaluate(() => {
        const results: Record<string, unknown>[] = [];

        // Look for structured data (JSON-LD)
        const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of Array.from(ldScripts)) {
          try {
            const data = JSON.parse(script.textContent || '');
            if (data && typeof data === 'object') {
              // Look for AggregateOffer or station listings
              const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
              for (const node of graph) {
                if (node['@type'] === 'GasStation' || node['@type'] === 'LocalBusiness') {
                  results.push(node as Record<string, unknown>);
                }
              }
            }
          } catch {
            // Skip invalid JSON-LD
          }
        }

        return results;
      });

      if (ssrStations.length > 0) {
        console.log(`[Scraper] Found ${ssrStations.length} stations from SSR JSON-LD`);
        domStations.push(...ssrStations);
        for (const station of ssrStations) {
          mergeStationRecord(stationStore, station);
        }
      }
    } catch {
      console.log('[Scraper] SSR page fallback failed');
    }
  }

  // ── Merge All Sources ──────────────────────────────────────────
  const allRawStations: Record<string, unknown>[] = [];

  const mergedStations = Array.from(stationStore.values());
  if (mergedStations.length > 0) {
    allRawStations.push(...mergedStations);
  } else {
    // Fallback to raw intercepted data if merging produced nothing
    for (const arr of interceptedStations) {
      allRawStations.push(...arr);
    }
  }

  // Add DOM data as a fallback supplement
  allRawStations.push(...domStations);

  console.log(`[Scraper] Total raw station entries collected: ${allRawStations.length}`);

  // Log a sample of the raw data for debugging
  if (allRawStations.length > 0) {
    console.log('[Scraper] Sample raw station entry:');
    console.log(JSON.stringify(allRawStations[0], null, 2).substring(0, 500));
  } else {
    console.log('[Scraper] ⚠ No raw data found. Dumping page diagnostics...');

    // Dump useful diagnostics
    try {
      const diagnostics = await page.evaluate(() => {
        const win = window as unknown as Record<string, unknown>;
        return {
          url: window.location.href,
          title: document.title,
          hasNext: !!win.__NEXT_DATA__,
          globalKeys: Object.keys(win).filter(k => !k.startsWith('_') || k === '__NEXT_DATA__' || k === '__next').slice(0, 30),
          bodyText: document.body?.innerText?.substring(0, 500) || 'N/A',
        };
      });
      console.log('[Scraper] Page diagnostics:', JSON.stringify(diagnostics, null, 2));
    } catch {
      console.log('[Scraper] Could not capture diagnostics');
    }
  }

  // ── Normalize & Filter ─────────────────────────────────────────
  const normalized: ScrapedStation[] = [];
  const seenCoords = new Set<string>();

  for (const raw of allRawStations) {
    const station = normalizeStation(raw);
    if (!station) continue;

    // Deduplicate by coordinates (rounded to 5 decimal places)
    const coordKey = `${station.lat.toFixed(5)}_${station.lng.toFixed(5)}`;
    if (seenCoords.has(coordKey)) continue;
    seenCoords.add(coordKey);

    normalized.push(station);
  }

  console.log(`[Scraper] Normalized unique stations: ${normalized.length}`);

  // Filter to Bacolod only
  const bacolodStations = filterToBacolod(normalized);
  console.log(`[Scraper] Bacolod stations after filtering: ${bacolodStations.length}`);

  // ── Cleanup ────────────────────────────────────────────────────
  await browser.close();
  console.log('[Scraper] Browser closed');

  return bacolodStations;
}
