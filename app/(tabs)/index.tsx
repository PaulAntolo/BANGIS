import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Image, FlatList, Linking, Platform } from 'react-native';
import CustomBottomSheet from '../../src/components/CustomBottomSheet';
import { Search as SearchIcon, Navigation, Fuel, ArrowLeft, Clock, Coffee, CreditCard, Wind, ShieldCheck, MapPin, Info } from 'lucide-react-native';
import Header from '../../src/components/Header';
import OpenStreetMap, { OpenStreetMapHandle } from '../../src/components/OpenStreetMap';
import { formatCurrency, getPriceColor } from '../../src/utils/formatters';
import { calculateDistance, getDistanceLabel } from '../../src/utils/geo';
import { getKNNRecommendations } from '../../src/utils/knn';
import * as Location from 'expo-location';
import { useFuelData } from '../../src/context/FuelContext';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useLocalSearchParams } from 'expo-router';

const DEFAULT_LOCATION = { latitude: 10.6690464, longitude: 122.9569778 }; // STI West Negros University Front Building, Burgos Ave

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isDark = colors.bgLight === '#111827';

  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStation, setNavStation] = useState<any>(null);
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState<'gas' | 'diesel' | 'premium'>('gas');
  const [userLocation, setUserLocation] = useState<any>(null);
  const mapRef = useRef<OpenStreetMapHandle>(null);
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const lastRouteFetch = useRef<{ latitude: number; longitude: number } | null>(null);

  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const { stations } = useFuelData();
  const { stationId } = useLocalSearchParams<{ stationId?: string }>();

  const getSelectedPrice = (prices: any, type: string) => prices[type] ?? null;

  const baseFilteredStations = useMemo(() => {
    if (stations.length === 0) return [];
    return stations;
  }, [stations]);

  const mapStations = useMemo(() => {
    return baseFilteredStations.map((s) => {
      const p = getSelectedPrice(s.prices, selectedFuelType);
      return {
        id: s.id,
        lat: s.coords.lat,
        lng: s.coords.lng,
        name: s.name,
        brand: s.brand,
        priceLabel: p !== null ? formatCurrency(p) : 'N/A',
        priceColor: p !== null ? getPriceColor(p, selectedFuelType, stations, colors) : colors.textMuted,
        logoUri: s.logoUri,
      };
    });
  }, [baseFilteredStations, selectedFuelType, isNavigating, stations, colors]);

  const filteredStations = useMemo(() => {
    const validStations = baseFilteredStations.filter((s) => {
      const p = getSelectedPrice(s.prices, selectedFuelType);
      return p !== null && p > 0;
    });

    const withDetails = validStations.map((s) => ({
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
        (getSelectedPrice(a.prices, selectedFuelType) as number) - (getSelectedPrice(b.prices, selectedFuelType) as number)
    );
    if (sorted.length > 0) {
      sorted[0].isBestValue = true;
    }

    return sorted;
  }, [baseFilteredStations, selectedFuelType, userLocation]);

  const topRecommendations = useMemo(() => {
    if (filteredStations.length === 0) return [];

    const featureData = filteredStations.map(s => ({
      id: s.id,
      price: getSelectedPrice(s.prices, selectedFuelType) as number,
      distance: s.distanceValue,
      verificationCount: s.verificationCount || 0
    }));

    const knnResults = getKNNRecommendations(featureData, 10);

    return knnResults.map((knn, index) => {
      const station = filteredStations.find(s => s.id === knn.id)!;
      return { ...station, recommendationReason: knn.reason, index };
    });
  }, [filteredStations, selectedFuelType]);

  useEffect(() => {
    if (stationId && filteredStations.length > 0) {
      const station = filteredStations.find((s) => s.id === stationId);
      if (station && selectedStation?.id !== stationId) {
        setSelectedStation(station);
        setTimeout(() => {
          mapRef.current?.flyTo(station.coords.lat, station.coords.lng, 15);
        }, 500);
      }
    }
  }, [stationId, filteredStations]);

  const handleLocateMe = async () => {
    try {
      if (Platform.OS === 'web') {
        setUserLocation(DEFAULT_LOCATION);
        mapRef.current?.flyTo(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, 14);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        return;
      }
      
      setLocationPermissionDenied(false);
      const location = await Location.getCurrentPositionAsync({});
      const newLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(newLoc);
      mapRef.current?.flyTo(newLoc.latitude, newLoc.longitude, 14);
    } catch (err) {
      console.warn('Failed to get current position:', err);
    }
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

    try {
      if (Platform.OS === 'web') {
        setUserLocation(DEFAULT_LOCATION);
        return;
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
    } catch (err) {
      console.warn('Failed to watch position:', err);
    }
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
        {locationPermissionDenied ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <MapPin size={48} color={colors.danger} style={{ marginBottom: 16 }} />
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 18, marginBottom: 8 }}>Location Required</Text>
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              BANGIS needs your location to find the cheapest fuel stations near you and provide precise navigation.
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              onPress={() => Linking.openSettings()}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : userLocation ? (
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {(['gas', 'diesel', 'premium'] as const).map((type) => (
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
        </View>
      )}

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleLocateMe}>
          <Navigation size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {!isNavigating && userLocation && topRecommendations.length > 0 && !selectedStation && (
        <CustomBottomSheet
          snapPoints={snapPoints}
          initialIndex={1}
          backgroundColor={colors.bgWhite}
        >
          <View style={styles.recommendationsHeaderBottomSheet}>
            <Text style={styles.recommendationsTitle}>Top Recommendations</Text>
          </View>

          <FlatList
            data={topRecommendations}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.recommendationsList}
            renderItem={({ item, index }) => (
              <View style={styles.recCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    {item.logo ? (
                      <Image source={item.logo} style={styles.cardLogo} resizeMode="contain" />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.badgeText}>
                        {index === 0 ? 'BEST VALUE' : `#${index + 1} CHEAPEST`}
                      </Text>
                      <Text style={styles.stationName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.stationDistance}>
                        {getDistanceLabel(item, [userLocation.latitude, userLocation.longitude])} away
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.recReasonBox}>
                  <Text style={styles.recReasonText}>{item.recommendationReason}</Text>
                </View>

                <View style={styles.recBottomRow}>
                  <View>
                    <Text style={[styles.stationPrice, { color: getPriceColor(getSelectedPrice(item.prices, selectedFuelType), selectedFuelType, stations, colors) }]}>
                      {formatCurrency(getSelectedPrice(item.prices, selectedFuelType))}
                    </Text>
                    <Text style={styles.priceUnit}>{selectedFuelType} / L</Text>
                  </View>
                  <View style={styles.recActions}>
                    <TouchableOpacity style={styles.btnNavigate} onPress={() => handleNavigate(item)}>
                      <Text style={styles.btnNavigateText}>GO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnDetails} onPress={() => setSelectedStation(item)}>
                      <Text style={styles.btnDetailsText}>INFO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </CustomBottomSheet>
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
                      <Text style={styles.priceLabel}>GAS</Text>
                      <Text style={styles.priceValue}>{formatCurrency(selectedStation.prices.gas)}</Text>
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

                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>Station Details</Text>
                    <View style={styles.infoRow}>
                      <Clock size={16} color={colors.textSecondary} />
                      <Text style={styles.infoText}>Open 24/7</Text>
                    </View>
                    {selectedStation.description ? (
                      <View style={styles.infoRow}>
                        <Info size={16} color={colors.textSecondary} />
                        <Text style={styles.infoText}>{selectedStation.description}</Text>
                      </View>
                    ) : null}
                    <View style={styles.infoRow}>
                      <ShieldCheck size={16} color={colors.textSecondary} />
                      <Text style={styles.infoText}>
                        {selectedStation.verificationCount ? `Verified by ${selectedStation.verificationCount} users` : 'Verified Station'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MapPin size={16} color={colors.textSecondary} />
                      <Text style={styles.infoText}>
                        {getDistanceLabel(selectedStation, [userLocation.latitude, userLocation.longitude])} from your location
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>Amenities</Text>
                    <View style={styles.amenitiesRow}>
                      <View style={styles.amenityTag}>
                        <Coffee size={14} color={colors.primary} />
                        <Text style={styles.amenityText}>Store</Text>
                      </View>
                      <View style={styles.amenityTag}>
                        <CreditCard size={14} color={colors.primary} />
                        <Text style={styles.amenityText}>Card</Text>
                      </View>
                      <View style={styles.amenityTag}>
                        <Wind size={14} color={colors.primary} />
                        <Text style={styles.amenityText}>Air/Water</Text>
                      </View>
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
    bottomSheet: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    recommendationsHeaderBottomSheet: {
      paddingHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    recommendationsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      backgroundColor: colors.bgLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      overflow: 'hidden',
    },
    toggleBtn: {
      backgroundColor: colors.bgWhite,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    toggleBtnText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.primary,
    },
    recommendationsList: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    recCard: {
      width: '100%',
      marginBottom: 16,
      backgroundColor: colors.bgWhite,
      borderRadius: 24,
      padding: 16,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    recReasonBox: {
      backgroundColor: colors.bgLight,
      padding: 10,
      borderRadius: 12,
      marginVertical: 12,
    },
    recReasonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      lineHeight: 16,
    },
    recBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    recActions: {
      flexDirection: 'row',
      gap: 8,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
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
    stationName: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    stationDistance: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    stationPrice: { fontSize: 24, fontWeight: '900', color: colors.primary },
    priceUnit: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted, marginTop: -4 },
    btnNavigate: {
      backgroundColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    btnNavigateText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    btnDetails: {
      backgroundColor: colors.primary + '1a',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    btnDetailsText: { color: colors.primary, fontWeight: 'bold', fontSize: 12 },
    navOverlay: {
      position: 'absolute',
      bottom: 24,
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
    infoSection: { marginBottom: 24 },
    infoSectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginBottom: 12, textTransform: 'uppercase' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    infoText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    amenitiesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    amenityTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    amenityText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
    btnNavigateModal: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    mapControls: { position: 'absolute', right: 16, bottom: 250 },
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
