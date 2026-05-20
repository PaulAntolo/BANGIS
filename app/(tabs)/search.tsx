import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, MapPin } from 'lucide-react-native';
import Header from '../../src/components/Header';
import StationCard from '../../src/components/StationCard';
import { calculateDistance, getSelectedPrice } from '../../src/utils/geo';
import { useFuelData } from '../../src/context/FuelContext';
import { useAppTheme } from '../../src/context/ThemeContext';

export default function SearchScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const { stations } = useFuelData();
  const [fuelType, setFuelType] = useState<'Diesel' | 'Unleaded' | 'Premium'>('Unleaded');
  const [sortBy, setSortBy] = useState<'Price' | 'Distance'>('Price');
  const [query, setQuery] = useState('');
  const router = useRouter();

  const userLocation: [number, number] = [14.5995, 120.9842];
  const fuelTypes = ['Diesel', 'Unleaded', 'Premium'] as const;
  const sortOptions = ['Price', 'Distance'] as const;

  const filteredAndSortedStations = useMemo(() => {
    let result = stations.filter(station => 
      station.name.toLowerCase().includes(query.toLowerCase()) ||
      station.brand.toLowerCase().includes(query.toLowerCase()) ||
      station.address.toLowerCase().includes(query.toLowerCase())
    );

    const mapped = result.map(s => ({
      ...s,
      distanceValue: calculateDistance(userLocation[0], userLocation[1], s.coords.lat, s.coords.lng)
    }));

    if (sortBy === 'Price') {
      return mapped.sort((a, b) => getSelectedPrice(a.prices, fuelType.toLowerCase()) - getSelectedPrice(b.prices, fuelType.toLowerCase()));
    } else {
      return mapped.sort((a, b) => a.distanceValue - b.distanceValue);
    }
  }, [query, fuelType, sortBy]);

  const handleStationClick = (station: any) => {
    // Ideally we would pass params, but router push works
    router.push({ pathname: '/(tabs)', params: { stationId: station.id } });
  };

  return (
    <View style={styles.container}>
      <Header title="Search & Compare" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city, station..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          {fuelTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFuelType(type)}
              style={[styles.chip, fuelType === type && styles.chipActive]}
            >
              <Text style={[styles.chipText, fuelType === type && styles.chipTextActive]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.regionCard}>
          <View style={styles.regionHeader}>
            <View>
              <Text style={styles.regionLabel}>CURRENT REGION</Text>
              <View style={styles.regionTitleContainer}>
                <MapPin size={20} color={colors.accent} />
                <Text style={styles.regionTitle}>Bacolod City</Text>
              </View>
            </View>
            <View style={styles.regionBadge}>
              <Text style={styles.regionBadgeText}>12 Stations</Text>
            </View>
          </View>

          <View style={styles.regionStats}>
            <View>
              <Text style={styles.statLabel}>Average Price</Text>
              <Text style={styles.statValue}>₱56.40</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statLabel}>Price Change</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>+0.20</Text>
            </View>
          </View>
        </View>

        <View style={styles.sortHeader}>
          <Text style={styles.sortTitle}>Nearby Value</Text>
          <View style={styles.sortOptions}>
            {sortOptions.map(sort => (
              <TouchableOpacity
                key={sort}
                onPress={() => setSortBy(sort)}
                style={[styles.sortBtn, sortBy === sort && styles.sortBtnActive]}
              >
                <Text style={[styles.sortBtnText, sortBy === sort && styles.sortBtnTextActive]}>
                  {sort.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.listContainer}>
          {filteredAndSortedStations.map(station => (
            <TouchableOpacity key={station.id} onPress={() => handleStationClick(station)}>
              <StationCard station={station} fuelType={fuelType} userLocation={userLocation} />
            </TouchableOpacity>
          ))}
          {filteredAndSortedStations.length === 0 && (
            <Text style={styles.emptyText}>No stations found matching your search.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipsScroll: {
    marginTop: 20,
  },
  chipsContent: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.bgWhite,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  chipTextActive: {
    color: colors.bgWhite,
  },
  regionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  regionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#60a5fa',
    marginBottom: 4,
  },
  regionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
  },
  regionBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  regionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  regionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(96, 165, 250, 0.7)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  sortTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  sortOptions: {
    flexDirection: 'row',
    backgroundColor: colors.bgWhite,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortBtnActive: {
    backgroundColor: colors.accent,
  },
  sortBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
  },
  sortBtnTextActive: {
    color: 'white',
  },
  listContainer: {
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 40,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
});
