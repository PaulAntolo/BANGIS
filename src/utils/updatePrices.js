const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'mockData.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace station prices
content = content.replace(/prices:\s*\{\s*diesel:\s*[\d.]+,\s*gas:\s*[\d.]+,\s*premium:\s*[\d.]+,?\s*\}/g, () => {
  const d = (80 + Math.random() * 5).toFixed(2);
  const u = (85 + Math.random() * 5).toFixed(2);
  const p = (90 + Math.random() * 5).toFixed(2);
  return `prices: {
      diesel: ${d},
      gas: ${u},
      premium: ${p},
    }`;
});

// Replace TREND_DATA
content = content.replace(/export const TREND_DATA = \[[\s\S]*?\];/, () => {
  return `export const TREND_DATA = [
  { name: 'MON', gas: 85.20, diesel: 80.50, premium: 90.90 },
  { name: 'TUE', gas: 85.50, diesel: 80.80, premium: 91.20 },
  { name: 'WED', gas: 86.80, diesel: 81.00, premium: 91.40 },
  { name: 'THU', gas: 86.10, diesel: 81.20, premium: 91.60 },
  { name: 'FRI', gas: 87.20, diesel: 81.30, premium: 91.70 },
  { name: 'SAT', gas: 87.80, diesel: 81.40, premium: 91.80 },
  { name: 'SUN', gas: 88.10, diesel: 81.50, premium: 91.90 },
];`;
});

// Replace TREND_DATA_30D
content = content.replace(/export const TREND_DATA_30D = [\s\S]*?\}\)\);/, () => {
  return `export const TREND_DATA_30D = Array.from({ length: 30 }, (_, i) => ({
  name: \`Day \${i + 1}\`,
  gas: 85.20 + Math.sin(i / 5) * 2 + (i / 10),
  diesel: 80.50 + Math.sin(i / 5) * 1.5 + (i / 12),
  premium: 90.90 + Math.sin(i / 5) * 2.2 + (i / 8),
}));`;
});

// Replace REGIONAL_PRICES
content = content.replace(/export const REGIONAL_PRICES = \[[\s\S]*?\];/, () => {
  return `export const REGIONAL_PRICES = [
  { area: 'LACSON STREET', gas: 88.80, diesel: 84.50, premium: 93.90 },
  { area: 'ARANETA STREET', gas: 89.40, diesel: 85.10, premium: 94.50 },
  { area: 'MANSILINGAN', gas: 86.90, diesel: 82.80, premium: 91.50 },
  { area: 'BURGOS STREET', gas: 89.20, diesel: 84.90, premium: 94.10 },
  { area: 'MANDALAGAN', gas: 88.10, diesel: 83.90, premium: 93.20 },
];`;
});

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully randomized mockup data to 80-95 range.');
