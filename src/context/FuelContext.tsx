import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { withStationLogo } from '../utils/brandLogos';

interface FuelContextType {
  stations: any[];
}

const FuelContext = createContext<FuelContextType | undefined>(undefined);

export function FuelProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<any[]>([]);

  useEffect(() => {
    // Listen to the backend-scraped data
    const q = query(collection(db, 'scraped_stations'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data());
      });
      
      // If the database is empty (scraper hasn't run yet), fallback to some mock data just for UI preview
      if (data.length === 0) {
        setStations(
          [
            { id: 'gw_preview_1', name: 'Petron (Preview)', brand: 'Petron', address: 'Makati, Metro Manila', prices: { diesel: 82.72, unleaded: 85.66, premium: 88.26 }, coords: { lat: 14.554, lng: 121.024 }, isBestValue: false, source: 'GasWatchPH' },
            { id: 'gw_preview_2', name: 'Shell (Preview)', brand: 'Shell', address: 'Makati, Metro Manila', prices: { diesel: 86.61, unleaded: 92.29, premium: 97.13 }, coords: { lat: 14.5501, lng: 121.03 }, isBestValue: false, source: 'GasWatchPH' },
          ].map(withStationLogo)
        );
      } else {
        setStations(data.map(withStationLogo));
      }
    }, (error) => {
      console.error("Error fetching scraped stations:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FuelContext.Provider value={{ stations }}>
      {children}
    </FuelContext.Provider>
  );
}

export function useFuelData() {
  const context = useContext(FuelContext);
  if (!context) {
    return { stations: [] };
  }
  return context;
}
