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
