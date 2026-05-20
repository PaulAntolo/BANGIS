import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Search as SearchIcon, Navigation, MapPin as MapPinIcon, Fuel, AlertCircle, ArrowLeft } from 'lucide-react-native';
import Header from '../../src/components/Header';
import { formatCurrency } from '../../src/utils/formatters';
import { calculateDistance, getDistanceLabel } from '../../src/utils/geo';
import * as Location from 'expo-location';
import { useFuelData } from '../../src/context/FuelContext';
import { useAppTheme } from '../../src/context/ThemeContext';

const DEFAULT_LOCATION = { latitude: 10.6667, longitude: 122.9500 };

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStation, setNavStation] = useState<any>(null);
  const [routePoints, setRoutePoints] = useState<any[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState<'unleaded' | 'diesel' | 'premium'>('unleaded');
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const mapRef = useRef<MapView>(null);
  
  // State for scraped data
  const { stations } = useFuelData();

  const getSelectedPrice = (prices: any, type: string) => prices[type] || 0;

  const filteredStations = useMemo(() => {
    if (stations.length === 0) return [];
    
    let result = stations.filter(station => 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const withDetails = result.map(s => ({
      ...s,
      distanceValue: calculateDistance(userLocation.latitude, userLocation.longitude, s.coords.lat, s.coords.lng)
    }));
    
    // Sort by price and mark the cheapest as best value
    const sorted = withDetails.sort((a, b) => getSelectedPrice(a.prices, selectedFuelType) - getSelectedPrice(b.prices, selectedFuelType));
    if (sorted.length > 0) {
      sorted[0].isBestValue = true;
    }
    
    return sorted;
  }, [searchQuery, selectedFuelType, userLocation, stations]);

  const bestStation = filteredStations.find(s => s.isBestValue) || filteredStations[0];

  const handleLocateMe = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    let location = await Location.getCurrentPositionAsync({});
    const newLoc = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    setUserLocation(newLoc);
    mapRef.current?.animateToRegion({
      ...newLoc,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  useEffect(() => {
    handleLocateMe();
  }, []);

  const handleNavigate = (station: any) => {
    setNavStation(station);
    setIsNavigating(true);
    setSelectedStation(null);
    setRoutePoints([
      userLocation,
      { latitude: station.coords.lat, longitude: station.coords.lng }
    ]);
    mapRef.current?.fitToCoordinates([
      userLocation,
      { latitude: station.coords.lat, longitude: station.coords.lng }
    ], {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            ...DEFAULT_LOCATION,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          userInterfaceStyle={colors.bgLight === '#111827' ? 'dark' : 'light'}
        >
          {isNavigating && (
            <Polyline coordinates={routePoints} strokeColor="#3b82f6" strokeWidth={6} />
          )}

          {!isNavigating && filteredStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.coords.lat, longitude: station.coords.lng }}
              onPress={() => setSelectedStation(station)}
            >
              <View style={styles.customMarker}>
                <View style={styles.markerContent}>
                  <Text style={styles.markerPrice}>{formatCurrency(getSelectedPrice(station.prices, selectedFuelType))}</Text>
                  <Text style={styles.markerBrand}>{station.brand}</Text>
                </View>
                <View style={styles.markerTriangle} />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {!isNavigating && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchInputContainer}>
            <SearchIcon size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stations, brands..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setShowSuggestions(true)}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {(['unleaded', 'diesel', 'premium'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, selectedFuelType === type && styles.filterButtonActive]}
                onPress={() => setSelectedFuelType(type)}
              >
                <Fuel size={14} color={selectedFuelType === type ? 'white' : colors.textSecondary} />
                <Text style={[styles.filterText, selectedFuelType === type && styles.filterTextActive]}>{type.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {showSuggestions && searchQuery.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView style={{ maxHeight: 200 }}>
                {filteredStations.map(station => (
                  <TouchableOpacity
                    key={station.id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(station.name);
                      setShowSuggestions(false);
                      setSelectedStation(station);
                    }}
                  >
                    <Text style={styles.suggestionName}>{station.name}</Text>
                    <Text style={styles.suggestionPrice}>{formatCurrency(getSelectedPrice(station.prices, selectedFuelType))}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {!isNavigating && bestStation && !selectedStation && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.badgeText}>{bestStation.isBestValue ? 'BEST VALUE' : 'TOP RESULT'}</Text>
              <Text style={styles.stationName}>{bestStation.name}</Text>
              <Text style={styles.stationDistance}>{getDistanceLabel(bestStation, [userLocation.latitude, userLocation.longitude])} away</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.stationPrice}>{formatCurrency(getSelectedPrice(bestStation.prices, selectedFuelType))}</Text>
              <Text style={styles.priceUnit}>{selectedFuelType} / L</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.btnNavigate} onPress={() => handleNavigate(bestStation)}>
              <Text style={styles.btnNavigateText}>NAVIGATE NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDetails} onPress={() => setSelectedStation(bestStation)}>
              <Text style={styles.btnDetailsText}>DETAILS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isNavigating && (
        <View style={styles.navOverlay}>
          <Text style={styles.navTitle}>Navigating to {navStation?.name}</Text>
          <TouchableOpacity style={styles.btnExitNav} onPress={() => setIsNavigating(false)}>
            <Text style={styles.btnExitNavText}>EXIT NAVIGATION</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!selectedStation} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedStation(null)}>
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            {selectedStation && (
              <ScrollView>
                <Image source={{ uri: selectedStation.image }} style={styles.modalImage} />
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>{selectedStation.name}</Text>
                  <Text style={styles.modalAddress}>{selectedStation.address}</Text>
                  
                  <View style={styles.pricesGrid}>
                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>UNLEADED</Text>
                      <Text style={styles.priceValue}>{formatCurrency(selectedStation.prices.unleaded)}</Text>
                    </View>
                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>DIESEL</Text>
                      <Text style={styles.priceValue}>{formatCurrency(selectedStation.prices.diesel)}</Text>
                    </View>
                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>PREMIUM</Text>
                      <Text style={styles.priceValue}>{formatCurrency(selectedStation.prices.premium)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.btnNavigateModal} onPress={() => handleNavigate(selectedStation)}>
                    <Text style={styles.btnNavigateText}>NAVIGATE NOW</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleLocateMe}>
          <Navigation size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  mapContainer: { flex: 1, ...StyleSheet.absoluteFillObject, top: 80, zIndex: 0 },
  map: { flex: 1 },
  searchOverlay: { position: 'absolute', top: 90, left: 16, right: 16, zIndex: 10 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgWhite, borderRadius: 16, paddingHorizontal: 12, height: 50, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  filterScroll: { marginTop: 12 },
  filterContent: { gap: 8 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgWhite, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 10, fontWeight: 'bold', color: colors.textSecondary },
  filterTextActive: { color: 'white' },
  suggestionsContainer: { backgroundColor: colors.bgWhite, marginTop: 8, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  suggestionName: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  suggestionPrice: { fontSize: 14, fontWeight: 'bold', color: colors.success },
  bottomCard: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: colors.bgWhite, borderRadius: 24, padding: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: colors.success, backgroundColor: 'rgba(0,204,102,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 4 },
  stationName: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  stationDistance: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  stationPrice: { fontSize: 24, fontWeight: '900', color: colors.primary },
  priceUnit: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted },
  cardActions: { flexDirection: 'row', gap: 12 },
  btnNavigate: { flex: 1, backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnNavigateText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  btnDetails: { flex: 1, backgroundColor: colors.primary + '1a', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnDetailsText: { color: colors.primary, fontWeight: 'bold', fontSize: 12 },
  navOverlay: { position: 'absolute', top: 90, left: 16, right: 16, backgroundColor: colors.primary, borderRadius: 24, padding: 20, elevation: 10 },
  navTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  btnExitNav: { backgroundColor: colors.danger, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnExitNavText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bgWhite, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '80%', overflow: 'hidden' },
  modalCloseBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, backgroundColor: colors.bgWhite, padding: 8, borderRadius: 16, elevation: 5 },
  modalImage: { width: '100%', height: 200 },
  modalBody: { padding: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.primary, marginBottom: 4 },
  modalAddress: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  pricesGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  priceBox: { flex: 1, backgroundColor: colors.bgLight, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  priceLabel: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted, marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: '900', color: colors.primary },
  btnNavigateModal: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  mapControls: { position: 'absolute', right: 16, top: 160 },
  controlBtn: { width: 44, height: 44, backgroundColor: colors.bgWhite, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  customMarker: { alignItems: 'center' },
  markerContent: { backgroundColor: colors.bgWhite, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: colors.primary, elevation: 4 },
  markerPrice: { fontSize: 12, fontWeight: '900', color: colors.primary, textAlign: 'center' },
  markerBrand: { fontSize: 8, fontWeight: 'bold', color: colors.textSecondary, textAlign: 'center' },
  markerTriangle: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.primary, transform: [{ rotate: '180deg' }], marginTop: -1 }
});
