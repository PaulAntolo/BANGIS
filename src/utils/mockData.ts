export const STATIONS = [
  {
    id: '1',
    name: 'Shell Lacson',
    brand: 'Shell',
    address: 'Lacson St, Bacolod City',
    distance: 0.4,
    prices: {
      diesel: 51.50,
      unleaded: 54.80,
      premium: 57.90,
    },
    updatedAt: '12m ago',
    verificationCount: 42,
    coords: { lat: 10.6841, lng: 122.9556 },
    isBestValue: true,
    description: 'Clean restrooms and a wide selection of snacks at the Select store. Highly recommended for a quick stop.',
    image: 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?auto=format&fit=crop&q=80&w=400',
    logoUrl: 'https://www.shell.com.ph/v1/logo.png',
    history: [
      { day: 'Mon', diesel: 50.50, unleaded: 53.80, premium: 56.90 },
      { day: 'Tue', diesel: 50.80, unleaded: 54.10, premium: 57.20 },
      { day: 'Wed', diesel: 51.00, unleaded: 54.30, premium: 57.40 },
      { day: 'Thu', diesel: 51.20, unleaded: 54.50, premium: 57.60 },
      { day: 'Fri', diesel: 51.30, unleaded: 54.60, premium: 57.70 },
      { day: 'Sat', diesel: 51.40, unleaded: 54.70, premium: 57.80 },
      { day: 'Sun', diesel: 51.50, unleaded: 54.80, premium: 57.90 },
    ]
  },
  {
    id: '2',
    name: 'Petron Araneta',
    brand: 'Petron',
    address: 'Araneta St, Bacolod City',
    distance: 1.2,
    prices: {
      diesel: 52.10,
      unleaded: 55.40,
      premium: 58.50,
    },
    updatedAt: '45m ago',
    verificationCount: 15,
    coords: { lat: 10.6652, lng: 122.9481 },
    description: 'Centrally located with fast service and competitive fuel prices for Petron card holders.',
    image: 'https://images.unsplash.com/photo-1527010150264-770002ecdf1c?auto=format&fit=crop&q=80&w=400',
    logoUrl: 'https://www.petron.com/wp-content/themes/petron/assets/images/petron-logo.png',
    history: [
      { day: 'Mon', diesel: 51.10, unleaded: 54.40, premium: 57.50 },
      { day: 'Tue', diesel: 51.40, unleaded: 54.70, premium: 57.80 },
      { day: 'Wed', diesel: 51.60, unleaded: 54.90, premium: 58.00 },
      { day: 'Thu', diesel: 51.80, unleaded: 55.10, premium: 58.20 },
      { day: 'Fri', diesel: 51.90, unleaded: 55.20, premium: 58.30 },
      { day: 'Sat', diesel: 52.00, unleaded: 55.30, premium: 58.40 },
      { day: 'Sun', diesel: 52.10, unleaded: 55.40, premium: 58.50 },
    ]
  },
  {
    id: '3',
    name: 'Caltex Mandalagan',
    brand: 'Caltex',
    address: 'Mandalagan, Bacolod City',
    distance: 2.1,
    prices: {
      diesel: 51.90,
      unleaded: 55.10,
      premium: 58.20,
    },
    updatedAt: '5m ago',
    verificationCount: 88,
    coords: { lat: 10.7025, lng: 122.9632 },
    isLowestPrice: true,
    description: 'Reliable fuel quality and helpful staff. Usually has the lowest prices in the area.',
    image: 'https://images.unsplash.com/photo-1490806843937-0bb013935db2?auto=format&fit=crop&q=80&w=400',
    logoUrl: 'https://www.caltex.com/content/dam/caltex/global/Master-Caltex-Logo-Color.svg',
    history: [
      { day: 'Mon', diesel: 50.90, unleaded: 54.10, premium: 57.20 },
      { day: 'Tue', diesel: 51.10, unleaded: 54.30, premium: 57.40 },
      { day: 'Wed', diesel: 51.30, unleaded: 54.50, premium: 57.60 },
      { day: 'Thu', diesel: 51.50, unleaded: 54.70, premium: 57.80 },
      { day: 'Fri', diesel: 51.70, unleaded: 54.90, premium: 58.00 },
      { day: 'Sat', diesel: 51.80, unleaded: 55.00, premium: 58.10 },
      { day: 'Sun', diesel: 51.90, unleaded: 55.10, premium: 58.20 },
    ]
  },
  {
    id: '4',
    name: 'Phoenix Mansilingan',
    brand: 'Phoenix',
    address: 'Mansilingan Main Rd, Bacolod',
    distance: 3.5,
    prices: {
      diesel: 50.80,
      unleaded: 53.90,
      premium: 56.50,
    },
    updatedAt: '1h ago',
    verificationCount: 22,
    coords: { lat: 10.6450, lng: 122.9750 },
    description: 'Affordable prices and friendly service in the Mansilingan area.',
    image: 'https://images.unsplash.com/photo-1563911302283-d2bc120e7458?auto=format&fit=crop&q=80&w=400',
    logoUrl: 'https://www.phoenixfuels.ph/wp-content/uploads/2018/03/phoenix-logo.png',
    history: [
      { day: 'Mon', diesel: 49.80, unleaded: 52.90, premium: 55.50 },
      { day: 'Tue', diesel: 50.00, unleaded: 53.10, premium: 55.70 },
      { day: 'Wed', diesel: 50.20, unleaded: 53.30, premium: 55.90 },
      { day: 'Thu', diesel: 50.40, unleaded: 53.50, premium: 56.10 },
      { day: 'Fri', diesel: 50.60, unleaded: 53.70, premium: 56.30 },
      { day: 'Sat', diesel: 50.70, unleaded: 53.80, premium: 56.40 },
      { day: 'Sun', diesel: 50.80, unleaded: 53.90, premium: 56.50 },
    ]
  },
  {
    id: '5',
    name: 'Shell B.S. Aquino',
    brand: 'Shell',
    address: 'B.S. Aquino Drive, Bacolod',
    distance: 0.9,
    prices: {
      diesel: 52.30,
      unleaded: 55.60,
      premium: 58.90,
    },
    updatedAt: '20m ago',
    verificationCount: 31,
    coords: { lat: 10.6800, lng: 122.9580 },
    description: 'Premium station with full-service bays and air/water facilities.',
    image: 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?auto=format&fit=crop&q=80&w=400',
    logoUrl: 'https://www.shell.com.ph/v1/logo.png',
    history: [
      { day: 'Mon', diesel: 51.30, unleaded: 54.60, premium: 57.90 },
      { day: 'Tue', diesel: 51.60, unleaded: 54.90, premium: 58.20 },
      { day: 'Wed', diesel: 51.80, unleaded: 55.10, premium: 58.40 },
      { day: 'Thu', diesel: 52.00, unleaded: 55.30, premium: 58.60 },
      { day: 'Fri', diesel: 52.10, unleaded: 55.40, premium: 58.70 },
      { day: 'Sat', diesel: 52.20, unleaded: 55.50, premium: 58.80 },
      { day: 'Sun', diesel: 52.30, unleaded: 55.60, premium: 58.90 },
    ]
  },
  {
    id: '6',
    name: 'Petron Burgos',
    brand: 'Petron',
    address: 'Burgos St, Bacolod City',
    distance: 1.8,
    prices: {
      diesel: 51.90,
      unleaded: 55.20,
      premium: 58.10,
    },
    updatedAt: '15m ago',
    verificationCount: 26,
    coords: { lat: 10.6720, lng: 122.9550 },
    description: 'Quick service lane and clean convenience store. Located at a major intersection.',
    image: 'https://images.unsplash.com/photo-1527010150264-770002ecdf1c?auto=format&fit=crop&q=80&w=400',
    logoUrl: 'https://www.petron.com/wp-content/themes/petron/assets/images/petron-logo.png',
    history: [
      { day: 'Mon', diesel: 50.90, unleaded: 54.20, premium: 57.10 },
      { day: 'Tue', diesel: 51.20, unleaded: 54.50, premium: 57.40 },
      { day: 'Wed', diesel: 51.40, unleaded: 54.70, premium: 57.60 },
      { day: 'Thu', diesel: 51.60, unleaded: 54.90, premium: 57.80 },
      { day: 'Fri', diesel: 51.70, unleaded: 55.00, premium: 57.90 },
      { day: 'Sat', diesel: 51.80, unleaded: 55.10, premium: 58.00 },
      { day: 'Sun', diesel: 51.90, unleaded: 55.20, premium: 58.10 },
    ]
  }
];

export const TREND_DATA = [
  { name: 'MON', unleaded: 53.20, diesel: 50.50, premium: 56.90 },
  { name: 'TUE', unleaded: 53.50, diesel: 50.80, premium: 57.20 },
  { name: 'WED', unleaded: 54.80, diesel: 51.00, premium: 57.40 },
  { name: 'THU', unleaded: 54.10, diesel: 51.20, premium: 57.60 },
  { name: 'FRI', unleaded: 55.20, diesel: 51.30, premium: 57.70 },
  { name: 'SAT', unleaded: 55.80, diesel: 51.40, premium: 57.80 },
  { name: 'SUN', unleaded: 56.10, diesel: 51.50, premium: 57.90 },
];

export const ACTIVITY = [
  {
    id: '1',
    type: 'price_hike',
    station: 'Shell Lacson',
    change: '+₱0.30',
    reason: 'Market adjustment',
    time: '1h ago',
  },
  {
    id: '2',
    type: 'discount',
    station: 'Petron Mansilingan',
    change: '-₱0.80',
    reason: 'Weekend Promo',
    time: '3h ago',
  }
];

export const TREND_DATA_30D = Array.from({ length: 30 }, (_, i) => ({
  name: `Day ${i + 1}`,
  unleaded: 53.20 + Math.sin(i / 5) * 2 + (i / 10),
  diesel: 50.50 + Math.sin(i / 5) * 1.5 + (i / 12),
  premium: 56.90 + Math.sin(i / 5) * 2.2 + (i / 8),
}));

export const EXTENDED_ACTIVITY = [
  ...ACTIVITY,
  {
    id: '3',
    type: 'price_hike',
    station: 'Caltex Mandalagan',
    change: '+₱0.45',
    reason: 'Oil supply drop',
    time: '5h ago',
  },
  {
    id: '4',
    type: 'discount',
    station: 'Phoenix Mansilingan',
    change: '-₱1.20',
    reason: 'Local competition',
    time: '8h ago',
  },
  {
    id: '5',
    type: 'price_hike',
    station: 'Petron Araneta',
    change: '+₱0.15',
    reason: 'Inflation adjustment',
    time: '12h ago',
  },
  {
    id: '6',
    type: 'discount',
    station: 'Shell B.S. Aquino',
    change: '-₱0.50',
    reason: 'App exclusive promo',
    time: '1d ago',
  },
  {
    id: '7',
    type: 'price_hike',
    station: 'Shell Lacson',
    change: '+₱0.75',
    reason: 'Global market surge',
    time: '2d ago',
  }
];

export const REGIONAL_PRICES = [
  { area: 'LACSON STREET', unleaded: 54.80, diesel: 51.50, premium: 57.90 },
  { area: 'ARANETA STREET', unleaded: 55.40, diesel: 52.10, premium: 58.50 },
  { area: 'MANSILINGAN', unleaded: 53.90, diesel: 50.80, premium: 56.50 },
  { area: 'BURGOS STREET', unleaded: 55.20, diesel: 51.90, premium: 58.10 },
  { area: 'MANDALAGAN', unleaded: 55.10, diesel: 51.90, premium: 58.20 },
];
