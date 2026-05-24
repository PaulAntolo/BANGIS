/**
 * Raw station data extracted from MetroFuelTracker.
 * Represents a single fuel station with its current prices.
 */
export interface ScrapedStation {
  /** Display name of the station (e.g., "Shell Lacson St") */
  name: string;

  /** Brand name (e.g., "Shell", "Petron", "Caltex") */
  brand: string;

  /** City or region (e.g., "Bacolod City") */
  city: string;

  /** Latitude coordinate */
  lat: number;

  /** Longitude coordinate */
  lng: number;

  /** Current diesel price in PHP, null if unavailable */
  dieselPrice: number | null;

  /** Current unleaded/regular gasoline price in PHP, null if unavailable */
  gasPrice: number | null;

  /** Current premium gasoline price in PHP, null if unavailable */
  premiumPrice: number | null;

  /** ISO timestamp of last price update on the source site */
  lastUpdated: string | null;
}

/**
 * Firestore document shape for the `stations` collection.
 * Stores structural/location data. Upserted on each scrape.
 */
export interface StationDocument {
  name: string;
  brand: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  source: 'MetroFuelTracker';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Firestore document shape for the `price_history` collection.
 * Append-only — a new document is created every scrape cycle.
 */
export interface PriceHistoryDocument {
  /** References the parent station document ID in `stations` */
  stationId: string;

  dieselPrice: number | null;
  gasPrice: number | null;
  premiumPrice: number | null;

  /** Server timestamp of when this price snapshot was recorded */
  scrapedAt: FirebaseFirestore.Timestamp;

  source: 'MetroFuelTracker';
}
