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

export function getPriceColor(price: number | null | undefined, fuelType: string, allStations: any[], colors: any) {
  if (price === null || price === undefined) return colors.textMuted;
  
  if (price < 70) return colors.success; // 69 and below -> Green
  if (price < 80) return colors.primary; // 70 to 79.99 -> Blue
  
  return colors.danger; // 80 and above -> Red
}
