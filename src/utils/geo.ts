
// Helper to calculate distance between two coordinates in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

export const getDistanceLabel = (station: any, userLocation: [number, number]) => {
  const d = calculateDistance(userLocation[0], userLocation[1], station.coords.lat, station.coords.lng);
  if (d < 1) return `${(d * 1000).toFixed(0)}m`;
  return `${d.toFixed(1)}km`;
};

// Helper to get price for selected fuel type
export const getSelectedPrice = (prices: any, selectedFuelType: string) => {
  if (!prices) return 0;
  const key = selectedFuelType.toLowerCase() as 'gas' | 'diesel' | 'premium';
  return prices[key] || 0;
};
