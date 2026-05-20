# BANGIS — Maps, Station Logos & Data Pipeline

This document describes how fuel station data, brand logos, and maps work in the BANGIS app.

---

## Metro bundler / `path` module error

**Symptom:** Expo fails with `Unable to resolve module path` pointing at `scraper/node_modules/dotenv/...`.

**Cause:** The `scraper/` folder is a **Node.js** tool (Playwright + Firebase Admin). Metro was trying to bundle it into the mobile app.

**Fix:** `metro.config.js` blocks the scraper directory:

```js
config.resolver.blockList = [/[/\\]scraper[/\\].*/];
```

After changing Metro config, restart Expo with a clean cache:

```bash
npx expo start -c
```

The scraper is only run from `scraper/` via `npm start` — never imported by the app.

---

## OpenStreetMap (Android-friendly maps)

BANGIS no longer uses `react-native-maps` (Google Maps on Android needs API keys and native setup).

### Implementation

| Piece | Location |
|-------|----------|
| Map component | `src/components/OpenStreetMap.tsx` |
| Home screen | `app/(tabs)/index.tsx` |

The map is a **WebView** running **Leaflet** with tiles from:

- **Light mode:** [OpenStreetMap](https://www.openstreetmap.org/copyright)
- **Dark mode:** CARTO dark tiles (also OSM-based)

### Why this works on Android

- No Google Maps API key
- No extra native map SDK beyond `react-native-webview` (already in the project)
- Same experience on Android, iOS, and web

### Features

- Station markers with price + brand logo
- User location dot (from `expo-location`)
- Simple route line when “Navigate” is used (straight line, not turn-by-turn)
- Tap marker → station details sheet

### Attribution

When shipping publicly, keep OSM/CARTO attribution visible (handled in the map tile layer).

---

## Station brand logos

Logos live in:

```
assets/logo/
  shell.jpg
  petron.png
  caltex.png
  phoenix.png
  seaoil.jpg
  unioil.png
  jetti.png
  flying v.png
  cleanfuel.jpg
  total.png
  ptt station.png
  nitrofuel.png
```

### Mapping logic

`src/utils/brandLogos.ts` normalizes the brand name from GasWatch PH and picks the correct asset:

| GasWatch brand | Logo file |
|----------------|-----------|
| Shell | `shell.jpg` |
| Petron | `petron.png` |
| Caltex | `caltex.png` |
| Phoenix | `phoenix.png` |
| Seaoil | `seaoil.jpg` |
| Unioil | `unioil.png` |
| Jetti | `jetti.png` |
| Flying V | `flying v.png` |
| Cleanfuel | `cleanfuel.jpg` |
| Total | `total.png` |
| PTT | `ptt station.png` |

`FuelContext` runs every station through `withStationLogo()` so each record gets:

- `logo` — for React Native `<Image source={...} />`
- `logoUri` — for map markers inside the WebView

### Adding a new brand

1. Drop the image in `assets/logo/` (use a simple filename when possible).
2. Add a `require()` entry in `BRAND_LOGO_ASSETS` in `src/utils/brandLogos.ts`.
3. Restart Expo (`npx expo start -c`).

---

## GasWatch PH data (scraper)

Fuel prices are scraped from [GasWatch PH](https://gaswatchph.com/) and stored in Firestore collection `scraped_stations`.

| Item | Path |
|------|------|
| Scraper | `scraper/index.js` |
| GitHub Action | `.github/workflows/scrape.yml` |
| App listener | `src/context/FuelContext.tsx` |

### Run scraper locally

```bash
cd scraper
npm install
npx playwright install chromium
npm run dry-run    # test without Firebase
npm start          # upload to Firestore (needs credentials)
```

### Firestore shape (per station)

```json
{
  "id": "gw_380",
  "name": "Unioil Marcos Hwy Santolan Pasig",
  "brand": "Unioil",
  "address": "Unioil Marcos Hwy..., Pasig",
  "area": "Pasig",
  "prices": { "diesel": 75.75, "unleaded": 80.88, "premium": 84.18 },
  "coords": { "lat": 14.61868, "lng": 121.08965 },
  "source": "GasWatchPH"
}
```

Logos are **not** stored in Firestore; they are resolved locally from `assets/logo/` using the `brand` field.

---

## Quick troubleshooting

| Issue | Action |
|-------|--------|
| `path` / `dotenv` Metro error | Confirm `metro.config.js` exists; run `npx expo start -c` |
| Map blank on device | Check internet (tiles load from CDN); wait for WebView `onLoadEnd` |
| No station logos | Brand name must match mapping in `brandLogos.ts` |
| No stations on map | Run scraper or use preview data when Firestore is empty |
| Scraper fails locally | `cd scraper && npx playwright install chromium` |

---

## Related commands

```bash
# App
npm install
npx expo start -c

# Scraper only
cd scraper && npm run dry-run
```
