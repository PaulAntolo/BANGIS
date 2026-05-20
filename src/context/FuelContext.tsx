import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

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
        setStations([
          { id: 'mf_1', name: 'Petron (Mock)', brand: 'Petron', address: 'Bacolod Downtown', prices: { diesel: 58.4, unleaded: 62.1, premium: 64.5 }, coords: { lat: 10.6765, lng: 122.9509 }, image: 'https://api.dicebear.com/7.x/initials/png?seed=Petron', isBestValue: false },
          { id: 'mf_2', name: 'Shell (Mock)', brand: 'Shell', address: 'Lacson St', prices: { diesel: 59.2, unleaded: 63.0, premium: 65.2 }, coords: { lat: 10.6850, lng: 122.9550 }, image: 'https://api.dicebear.com/7.x/initials/png?seed=Shell', isBestValue: false },
        ]);
      } else {
        // Ensure image fields exist
        const formatted = data.map(s => ({
          ...s,
          image: s.image || `https://api.dicebear.com/7.x/initials/png?seed=${s.brand || s.name}`
        }));
        setStations(formatted);
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
