export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount).replace('PHP', '₱');
};

export const formatDistance = (km: number) => {
  return `${km.toFixed(1)} km away`;
};

export function getStatusColorByRange(price: number, minPrice: number, maxPrice: number, colors: any) {
  if (!price || !minPrice || !maxPrice) return colors.primary;
  const range = maxPrice - minPrice;
  if (range === 0) return colors.primary;
  
  if (price <= minPrice + (range * 0.2)) return colors.success; // Low -> Green
  if (price >= maxPrice - (range * 0.2)) return colors.danger;  // High -> Red
  
  return colors.primary; // Normal -> Blue (Primary)
}

export function getPriceColor(price: number, fuelType: string, allStations: any[], colors: any) {
  if (!price) return colors.primary;
  
  if (price < 60) return colors.success; // Less than 60 -> Green
  if (price <= 75) return colors.primary; // 60 to 75 -> Blue
  
  return colors.danger; // Above 75 -> Red
}
