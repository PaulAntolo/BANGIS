import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Image } from 'react-native';
import { Search as SearchIcon, Navigation, Fuel, ArrowLeft } from 'lucide-react-native';
import Header from '../../src/components/Header';
import OpenStreetMap, { OpenStreetMapHandle } from '../../src/components/OpenStreetMap';
import { formatCurrency } from '../../src/utils/formatters';
import { calculateDistance, getDistanceLabel } from '../../src/utils/geo';
import * as Location from 'expo-location';
import { useFuelData } from '../../src/context/FuelContext';
import { useAppTheme } from '../../src/context/ThemeContext';

const DEFAULT_LOCATION = { latitude: 14.5995, longitude: 120.9842 };

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isDark = colors.bgLight === '#111827';

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStation, setNavStation] = useState<any>(null);
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState<'unleaded' | 'diesel' | 'premium'>('unleaded');
  const [userLocation, setUserLocation] = useState<any>(null);
  const mapRef = useRef<OpenStreetMapHandle>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const lastRouteFetch = useRef<{ latitude: number; longitude: number } | null>(null);

  const { stations } = useFuelData();

  const getSelectedPrice = (prices: any, type: string) => prices[type] || 0;

  const baseFilteredStations = useMemo(() => {
    if (stations.length === 0) return [];
    return stations.filter(
      (station) =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stations, searchQuery]);

  const mapStations = useMemo(() => {
    if (isNavigating) return [];
    return baseFilteredStations.map((s) => ({
      id: s.id,
      lat: s.coords.lat,
      lng: s.coords.lng,
      name: s.name,
      brand: s.brand,
      priceLabel: formatCurrency(getSelectedPrice(s.prices, selectedFuelType)),
      logoUri: s.logoUri,
    }));
  }, [baseFilteredStations, selectedFuelType, isNavigating]);

  const filteredStations = useMemo(() => {
    const withDetails = baseFilteredStations.map((s) => ({
      ...s,
      distanceValue: calculateDistance(
        userLocation?.latitude || DEFAULT_LOCATION.latitude,
        userLocation?.longitude || DEFAULT_LOCATION.longitude,
        s.coords.lat,
        s.coords.lng
      ),
    }));

    const sorted = withDetails.sort(
      (a, b) =>
        getSelectedPrice(a.prices, selectedFuelType) - getSelectedPrice(b.prices, selectedFuelType)
    );
    if (sorted.length > 0) {
      sorted[0].isBestValue = true;
    }

    return sorted;
  }, [baseFilteredStations, selectedFuelType, userLocation]);

  const bestStation = filteredStations.find((s) => s.isBestValue) || filteredStations[0];

  const handleLocateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const location = await Location.getCurrentPositionAsync({});
    const newLoc = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setUserLocation(newLoc);
    mapRef.current?.flyTo(newLoc.latitude, newLoc.longitude, 14);
  };

  useEffect(() => {
    handleLocateMe();
    return () => {
      if (locationSub.current) locationSub.current.remove();
    };
  }, []);

  const fetchRoute = async (start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c: any) => ({
          latitude: c[1],
          longitude: c[0]
        }));
        setRoutePoints(coords);
      }
    } catch (e) {
      console.warn('Routing failed', e);
      setRoutePoints([start, end]);
    }
  };

  const handleNavigate = async (station: any) => {
    setNavStation(station);
    setIsNavigating(true);
    setSelectedStation(null);
    const dest = { latitude: station.coords.lat, longitude: station.coords.lng };
    
    await fetchRoute(userLocation, dest);
    lastRouteFetch.current = userLocation;
    mapRef.current?.fitCoordinates([userLocation, dest]);

    if (locationSub.current) {
      locationSub.current.remove();
    }
    
    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (loc) => {
        const newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(newLoc);
        
        if (lastRouteFetch.current) {
          const dist = calculateDistance(newLoc.latitude, newLoc.longitude, lastRouteFetch.current.latitude, lastRouteFetch.current.longitude);
          if (dist > 0.05) { // 50 meters
            fetchRoute(newLoc, dest);
            lastRouteFetch.current = newLoc;
          }
        }
      }
    );
  };

  const exitNavigation = () => {
    setIsNavigating(false);
    setRoutePoints([]);
    setNavStation(null);
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.mapContainer}>
        {userLocation ? (
          <OpenStreetMap
            ref={mapRef}
            style={styles.map}
            stations={mapStations}
            userLocation={userLocation}
            routePoints={isNavigating ? routePoints : null}
            isDark={isDark}
            onStationPress={(id) => {
              const station = filteredStations.find((s) => s.id === id);
              if (station) setSelectedStation(station);
            }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontWeight: 'bold' }}>Locating you...</Text>
          </View>
        )}
      </View>

      {!isNavigating && userLocation && (
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {(['unleaded', 'diesel', 'premium'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, selectedFuelType === type && styles.filterButtonActive]}
                onPress={() => setSelectedFuelType(type)}
              >
                <Fuel size={14} color={selectedFuelType === type ? 'white' : colors.textSecondary} />
                <Text style={[styles.filterText, selectedFuelType === type && styles.filterTextActive]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {showSuggestions && searchQuery.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView style={{ maxHeight: 200 }}>
                {filteredStations.map((station) => (
                  <TouchableOpacity
                    key={station.id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(station.name);
                      setShowSuggestions(false);
                      setSelectedStation(station);
                    }}
                  >
                    <View style={styles.suggestionLeft}>
                      {station.logo ? (
                        <Image source={station.logo} style={styles.suggestionLogo} resizeMode="contain" />
                      ) : null}
                      <Text style={styles.suggestionName}>{station.name}</Text>
                    </View>
                    <Text style={styles.suggestionPrice}>
                      {formatCurrency(getSelectedPrice(station.prices, selectedFuelType))}
                    </Text>
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
            <View style={styles.cardHeaderLeft}>
              {bestStation.logo ? (
                <Image source={bestStation.logo} style={styles.cardLogo} resizeMode="contain" />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeText}>{bestStation.isBestValue ? 'BEST VALUE' : 'TOP RESULT'}</Text>
                <Text style={styles.stationName}>{bestStation.name}</Text>
                <Text style={styles.stationDistance}>
                  {getDistanceLabel(bestStation, [userLocation.latitude, userLocation.longitude])} away
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.stationPrice}>
                {formatCurrency(getSelectedPrice(bestStation.prices, selectedFuelType))}
              </Text>
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
          <TouchableOpacity style={styles.btnExitNav} onPress={exitNavigation}>
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
                <View style={styles.modalImageWrap}>
                  {selectedStation.logo ? (
                    <Image source={selectedStation.logo} style={styles.modalLogo} resizeMode="contain" />
                  ) : (
                    <Text style={styles.modalBrandFallback}>{selectedStation.brand}</Text>
                  )}
                </View>
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
                  <TouchableOpacity
                    style={styles.btnNavigateModal}
                    onPress={() => handleNavigate(selectedStation)}
                  >
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

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgLight },
    mapContainer: { flex: 1, ...StyleSheet.absoluteFillObject, top: 80, zIndex: 0 },
    map: { flex: 1 },
    searchOverlay: { position: 'absolute', top: 90, left: 16, right: 16, zIndex: 10 },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgWhite,
      borderRadius: 16,
      paddingHorizontal: 12,
      height: 50,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
    filterScroll: { marginTop: 12 },
    filterContent: { gap: 8 },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bgWhite,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 10, fontWeight: 'bold', color: colors.textSecondary },
    filterTextActive: { color: 'white' },
    suggestionsContainer: {
      backgroundColor: colors.bgWhite,
      marginTop: 8,
      borderRadius: 16,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      overflow: 'hidden',
    },
    suggestionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    suggestionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    suggestionLogo: { width: 28, height: 28 },
    suggestionName: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, flex: 1 },
    suggestionPrice: { fontSize: 14, fontWeight: 'bold', color: colors.success },
    bottomCard: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      backgroundColor: colors.bgWhite,
      borderRadius: 24,
      padding: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    cardLogo: { width: 44, height: 44 },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.success,
      backgroundColor: 'rgba(0,204,102,0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    stationName: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
    stationDistance: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    stationPrice: { fontSize: 24, fontWeight: '900', color: colors.primary },
    priceUnit: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted },
    cardActions: { flexDirection: 'row', gap: 12 },
    btnNavigate: {
      flex: 1,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    btnNavigateText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    btnDetails: {
      flex: 1,
      backgroundColor: colors.primary + '1a',
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    btnDetailsText: { color: colors.primary, fontWeight: 'bold', fontSize: 12 },
    navOverlay: {
      position: 'absolute',
      top: 90,
      left: 16,
      right: 16,
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 20,
      elevation: 10,
    },
    navTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    btnExitNav: {
      backgroundColor: colors.danger,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    btnExitNavText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.bgWhite,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      height: '80%',
      overflow: 'hidden',
    },
    modalCloseBtn: {
      position: 'absolute',
      top: 16,
      left: 16,
      zIndex: 10,
      backgroundColor: colors.bgWhite,
      padding: 8,
      borderRadius: 16,
      elevation: 5,
    },
    modalImageWrap: {
      width: '100%',
      height: 200,
      backgroundColor: colors.bgLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalLogo: { width: '70%', height: 140 },
    modalBrandFallback: { fontSize: 32, fontWeight: '900', color: colors.primary },
    modalBody: { padding: 24 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: colors.primary, marginBottom: 4 },
    modalAddress: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
    pricesGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    priceBox: {
      flex: 1,
      backgroundColor: colors.bgLight,
      padding: 12,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    priceLabel: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted, marginBottom: 4 },
    priceValue: { fontSize: 16, fontWeight: '900', color: colors.primary },
    btnNavigateModal: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    mapControls: { position: 'absolute', right: 16, top: 160 },
    controlBtn: {
      width: 44,
      height: 44,
      backgroundColor: colors.bgWhite,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
