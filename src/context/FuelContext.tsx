import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { withStationLogo } from '../utils/brandLogos';

interface FuelContextType {
  stations: any[];
  loading: boolean;
}

const FuelContext = createContext<FuelContextType | undefined>(undefined);

/**
 * Fetches the latest price_history entry for each station and merges it
 * into a unified station object the app can consume.
 *
 * Expected app-side shape:
 *   { id, name, brand, address, prices: { gas, diesel, premium }, coords: { lat, lng } }
 *
 * Firestore shape written by the scraper:
 *   stations   → { name, brand, city, coordinates: { lat, lng }, source, createdAt, updatedAt }
 *   price_history → { stationId, dieselPrice, gasPrice, premiumPrice, scrapedAt, source }
 */
export function FuelProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to the `stations` collection (written by the scraper)
    const stationsQuery = query(collection(db, 'stations'));

    const unsubscribe = onSnapshot(
      stationsQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          // No scraped data yet — show Bacolod preview data so the UI isn't empty
          setStations(
            [
              {
                id: 'preview_petron',
                name: 'Petron Lacson St (Preview)',
                brand: 'Petron',
                address: 'Bacolod City',
                prices: { diesel: 56.75, gas: 62.50, premium: 68.00 },
                coords: { lat: 10.6765, lng: 122.9509 },
                isBestValue: false,
                source: 'Preview',
              },
              {
                id: 'preview_shell',
                name: 'Shell Mandalagan (Preview)',
                brand: 'Shell',
                address: 'Bacolod City',
                prices: { diesel: 57.20, gas: 63.10, premium: 69.50 },
                coords: { lat: 10.6920, lng: 122.9620 },
                isBestValue: false,
                source: 'Preview',
              },
            ].map(withStationLogo)
          );
          setLoading(false);
          return;
        }

        // Build a map of station docs keyed by their Firestore doc ID
        const stationDocs: Record<string, any> = {};
        snapshot.forEach((doc) => {
          stationDocs[doc.id] = { firestoreId: doc.id, ...doc.data() };
        });

        // Fetch the latest price_history entry for each station
        const stationIds = Object.keys(stationDocs);
        const priceMap: Record<string, any> = {};

        // Firestore `in` queries support max 30 values per call, so batch them
        const BATCH_SIZE = 30;
        for (let i = 0; i < stationIds.length; i += BATCH_SIZE) {
          const batch = stationIds.slice(i, i + BATCH_SIZE);
          try {
            const priceQuery = query(
              collection(db, 'price_history'),
              where('stationId', 'in', batch),
              orderBy('scrapedAt', 'desc'),
            );
            const priceSnap = await getDocs(priceQuery);
            priceSnap.forEach((priceDoc) => {
              const data = priceDoc.data();
              // Keep only the most recent entry per station
              if (!priceMap[data.stationId]) {
                priceMap[data.stationId] = data;
              }
            });
          } catch (err) {
            console.warn('[FuelContext] price_history fetch failed for batch:', err);
          }
        }

        // Merge station + price data into the shape the UI expects
        const merged = stationIds.map((id) => {
          const station = stationDocs[id];
          const prices = priceMap[id];

          return {
            id,
            name: station.name || 'Unknown Station',
            brand: station.brand || '',
            address: station.city || '',
            prices: {
              diesel: prices?.dieselPrice ?? null,
              gas: prices?.gasPrice ?? null,
              premium: prices?.premiumPrice ?? null,
            },
            coords: {
              lat: station.coordinates?.lat ?? 0,
              lng: station.coordinates?.lng ?? 0,
            },
            source: station.source || 'MetroFuelTracker',
            isBestValue: false,
          };
        });

        setStations(merged.map(withStationLogo));
        setLoading(false);
      },
      (error) => {
        console.error('[FuelContext] Error fetching stations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <FuelContext.Provider value={{ stations, loading }}>
      {children}
    </FuelContext.Provider>
  );
}

export function useFuelData() {
  const context = useContext(FuelContext);
  if (!context) {
    return { stations: [], loading: false };
  }
  return context;
}
