# ⛽ BANGIS (Bacolod Advanced Network for Gas and Information System)

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)

BANGIS is a capstone project designed to help motorists in Bacolod City efficiently locate the most cost-effective fuel stations. By deploying an automated data aggregation engine (scraper) coupled with a cross-platform geolocation app, BANGIS provides users with real-time pricing for Gasoline, Diesel, and Premium fuels, alongside dynamic navigation to the cheapest and nearest stations.

## 🌟 Key Features
- **Real-Time Price Tracking**: Automatically scrapes and standardizes fuel prices from reliable regional fuel trackers.
- **Interactive Map Visualization**: Displays fuel stations on a color-coded map, pinpointing the cheapest and most expensive locations using OpenStreetMap.
- **Intelligent Routing**: Integrates routing algorithms to calculate the most cost-effective travel paths for users based on their location and the fuel price.
- **Cross-Platform**: Built with React Native and Expo, supporting both Android and Web platforms.

## 🎯 Objectives
1. **Collection**: To develop a backend web scraping architecture that extracts and standardizes fuel prices automatically.
2. **Development**: To design an interactive mobile application visualizing stations with color-coded indicators.
3. **Integration**: To integrate geolocation APIs and routing algorithms for cost-effective navigation.
4. **Evaluation**: To evaluate system performance and user acceptability based on ISO/IEC 25010 software quality standards.

## 🛠️ Technology Stack
- **Frontend**: React Native, Expo, Expo Router
- **Maps & Routing**: OpenStreetMap, Leaflet (rendered via WebView and conditional iframes for web support)
- **Backend / Database**: Firebase Firestore
- **Icons**: Lucide React Native

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine.
- Expo CLI or `npx` available.

### Installation

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. **Run on Android**: 
   Use the Expo Go app on your phone to scan the QR code, or press `a` in the terminal to launch an Android Emulator.
   ```bash
   npm run android
   ```

4. **Run on Web**: 
   Press `w` in the terminal, or run the web script directly:
   ```bash
   npm run web
   ```
   *Note: On the web platform, the location defaults to the STI West Negros University main gate for testing purposes.*

## 📝 License
Developed as a capstone project for STI West Negros University.
